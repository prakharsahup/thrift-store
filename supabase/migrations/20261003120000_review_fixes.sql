-- Fixes from the 2026-10-03 backend review.
--   1. Coupons: max_uses and one-use-per-customer are enforced atomically at checkout (apply_coupon).
--   2. Oversold orders: items that went to someone else are flagged on order_items.unavailable.
--   3. Holds belong to an order (reserved_order_id), so a failed payment only frees its own order's
--      items. Stale pending orders are cancelled by cron, which frees their holds and coupon.
--   4. reserved_by / reserved_order_id (customer and order ids) are no longer readable by the API.
--   5. Notify-me: no more public inserts. Sign-ups go through request_notify (service role, rate
--      limited) and need a double opt-in (confirm_notify) before anything is emailed.
--   6. Search: brand and style tags are indexed with the english config too, and search_products
--      ranks results.
--   7. Facets in SQL (no row cap), index clean-up, a cheaper products policy, and storefront views
--      the app reads instead of re-implementing the listing rules in TypeScript.

-- ===========================================================================
-- Storefront views and search (6, 7)
-- ===========================================================================

-- The old view and computed column take a whole products row, which needs SELECT on every column.
-- That stops working once reserved_by is hidden (section 4), so both are replaced by the views below.
drop view public.listed_products;
drop function public.effective_status(public.products);

-- Index brand and style tags with both configs: queries use the english stemmer ("sporty" becomes
-- "sporti"), which never matched tags indexed only as-is.
drop index public.products_search_idx;
alter table public.products drop column search;

create or replace function public.product_search_document(
  title text, brand text, style_tags text[], description text
)
returns tsvector
language sql
immutable
set search_path = ''
as $$
  select
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(brand, '')), 'A')
    || setweight(to_tsvector('english', coalesce(brand, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(array_to_string(style_tags, ' '), '')), 'B')
    || setweight(to_tsvector('english', coalesce(array_to_string(style_tags, ' '), '')), 'B')
    || setweight(to_tsvector('english', coalesce(description, '')), 'C');
$$;

alter table public.products add column search tsvector generated always as (
  public.product_search_document(title, brand, style_tags, description)
) stored;
create index products_search_idx on public.products using gin (search);

-- Every non-draft product the visitor may see (RLS still applies: security_invoker), without the
-- private reservation columns. Expired holds read as available ("lazy release on read").
-- The PDP and cart read this, so sold items keep their URL.
create view public.storefront_products
with (security_invoker = true)
as
select
  p.id, p.slug, p.title, p.description, p.brand, p.category_id, p.drop_id, p.gender,
  p.tagged_size, p.condition, p.measurements, p.flaws, p.style_tags,
  p.price_paise, p.original_price_paise, p.status, p.reserved_until, p.sold_at,
  p.created_at, p.published_at, p.updated_at, p.search,
  case
    when p.status = 'reserved' and p.reserved_until <= now() then 'available'::public.product_status
    else p.status
  end as effective_status
from public.products p
where p.status <> 'draft';

-- What listings show: minus items sold more than 7 days ago (CLAUDE.md §4).
create view public.listed_products
with (security_invoker = true)
as
select s.*
from public.storefront_products s
where s.status <> 'sold' or s.sold_at > now() - interval '7 days';

grant select on public.storefront_products, public.listed_products to anon, authenticated;

-- Ranked full-text search over listings. `query` is a to_tsquery string built by the app
-- ("jackets:* & kora:*"). Rows come back available first, then best match; PostgREST filters,
-- embeds and pagination apply on top. Callers that add .order() replace this order.
create function public.search_products(query text)
returns setof public.listed_products
language sql
stable
set search_path = ''
as $$
  select l.*
  from public.listed_products l, to_tsquery('english', search_products.query) as q
  where l.search @@ q
  order by l.status, ts_rank(l.search, q) desc, l.published_at desc, l.id;
$$;

-- Filter options with products in scope (category ids and/or a search query), computed in SQL so
-- there's no row cap. Returns
--   { sizes: text[], brands: text[], conditions: text[], styles: text[], min_price, max_price }.
create function public.product_facets(category_ids uuid[] default null, query text default null)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with scope as (
    select l.tagged_size, l.brand, l.condition, l.style_tags, l.price_paise
    from public.listed_products l
    where (product_facets.category_ids is null or l.category_id = any (product_facets.category_ids))
      and (
        product_facets.query is null
        or l.search @@ to_tsquery('english', product_facets.query)
      )
  )
  select jsonb_build_object(
    'sizes', coalesce((select jsonb_agg(distinct tagged_size) from scope where tagged_size is not null), '[]'),
    'brands', coalesce((select jsonb_agg(distinct brand) from scope where brand is not null), '[]'),
    'conditions', coalesce((select jsonb_agg(distinct condition) from scope), '[]'),
    'styles', coalesce((select jsonb_agg(distinct t.tag) from scope, unnest(scope.style_tags) as t (tag)), '[]'),
    'min_price', (select min(price_paise) from scope),
    'max_price', (select max(price_paise) from scope)
  );
$$;

-- ===========================================================================
-- Indexes and the products policy (7)
-- ===========================================================================

-- Never used by any query: listings filter by category, not gender, and brand filters are exact.
drop index public.products_gender_idx;
drop index public.products_brand_idx;
-- Price sorts and "under ₹X" rails always filter by status first.
drop index public.products_price_idx;
create index products_status_price_idx on public.products (status, price_paise);

-- Live drop ids, computed once per query (as an initPlan) instead of drop_is_live() once per row.
create function public.live_drop_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(d.id), '{}')
  from public.drops d
  where d.is_published and d.go_live_at <= now();
$$;

drop policy "Products: anyone can read published products in live drops" on public.products;
create policy "Products: anyone can read published products in live drops"
  on public.products for select to anon, authenticated
  using (
    (status <> 'draft' and (drop_id is null or drop_id = any ((select public.live_drop_ids())::uuid[])))
    or (select public.is_admin())
  );

-- ===========================================================================
-- Reservations belong to an order (2, 3)
-- ===========================================================================

alter table public.products
  add column reserved_order_id uuid references public.orders (id) on delete set null;

comment on column public.products.reserved_order_id is
  'The pending order this hold belongs to (set by attach_reservations). Null right after '
  'reserve_products, before the order exists.';

alter table public.products drop constraint products_reservation_consistent;
alter table public.products add constraint products_reservation_consistent check (
  (status = 'reserved' and reserved_until is not null)
  or (
    status <> 'reserved'
    and reserved_until is null and reserved_by is null and reserved_order_id is null
  )
);

create index products_reserved_order_id_idx on public.products (reserved_order_id)
  where reserved_order_id is not null;

alter table public.order_items
  add column unavailable boolean not null default false;

comment on column public.order_items.unavailable is
  'The order was paid but this item had already gone to someone else. Refund it; don''t pack it.';

create index order_items_unavailable_idx on public.order_items (order_id) where unavailable;

-- 4: the reservation columns hold customer and order ids. RLS can't hide columns, privileges can.
-- Admin screens that need them must read them with the service role.
revoke select on public.products from anon, authenticated;
grant select (
  id, slug, title, description, brand, category_id, drop_id, gender, tagged_size, condition,
  measurements, flaws, style_tags, price_paise, original_price_paise, status, reserved_until,
  sold_at, created_at, published_at, updated_at, search
) on public.products to anon, authenticated;

-- reserve_products: unchanged, except a new or renewed hold isn't attached to any order yet.
-- A newer checkout by the same user takes over holds from that user's older pending order.
create or replace function public.reserve_products(product_ids uuid[], user_id uuid)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  requested uuid[];
  reserved uuid[];
begin
  if reserve_products.user_id is null then
    raise exception 'user_id is required' using errcode = '22004';
  end if;

  select coalesce(array_agg(distinct t.id), '{}')
    into requested
    from unnest(reserve_products.product_ids) as t (id)
   where t.id is not null;

  if cardinality(requested) > 50 then
    raise exception 'Too many products in one checkout (max 50)' using errcode = '22023';
  end if;

  -- Lock the rows in a fixed order first, so two overlapping checkouts can't deadlock.
  perform 1
     from public.products p
    where p.id = any (requested)
    order by p.id
      for update;

  with updated as (
    update public.products p
       set status = 'reserved',
           reserved_until = now() + interval '15 minutes',
           reserved_by = reserve_products.user_id,
           reserved_order_id = null
     where p.id = any (requested)
       and public.drop_is_live(p.drop_id)
       and (
         p.status = 'available'
         or (
           p.status = 'reserved'
           and (p.reserved_until <= now() or p.reserved_by = reserve_products.user_id)
         )
       )
    returning p.id
  )
  select coalesce(array_agg(u.id), '{}') into reserved from updated u;

  return array(select r from unnest(requested) as r where r <> all (reserved));
end;
$$;

-- attach_reservations: after the pending order and its items are inserted, tie the user's live
-- holds on those items to the order. Returns the order's product ids that are NOT held for it
-- (the hold expired or was lost meanwhile); the caller should drop them or restart checkout.
create function public.attach_reservations(order_id uuid)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  o public.orders;
  attached uuid[];
begin
  select * into o from public.orders where id = attach_reservations.order_id for update;
  if not found then
    raise exception 'Order % not found', attach_reservations.order_id using errcode = 'P0002';
  end if;
  if o.status <> 'pending' or o.user_id is null then
    raise exception 'Order % is not a pending customer order', o.id using errcode = '22023';
  end if;

  with updated as (
    update public.products p
       set reserved_order_id = o.id
     where p.id in (select oi.product_id from public.order_items oi where oi.order_id = o.id)
       and p.status = 'reserved'
       and p.reserved_until > now()
       and p.reserved_by = o.user_id
       and (p.reserved_order_id is null or p.reserved_order_id = o.id)
    returning p.id
  )
  select coalesce(array_agg(u.id), '{}') into attached from updated u;

  return array(
    select oi.product_id from public.order_items oi
     where oi.order_id = o.id and oi.product_id <> all (attached)
  );
end;
$$;

create or replace function public.release_expired_reservations()
returns integer
language sql
security definer
set search_path = ''
as $$
  with released as (
    update public.products
       set status = 'available', reserved_until = null, reserved_by = null, reserved_order_id = null
     where status = 'reserved' and reserved_until <= now()
    returning 1
  )
  select count(*)::integer from released;
$$;

-- A payment failed: free this order's holds only. Holds that a newer checkout took over (or that
-- were never attached) are left alone. The order stays `pending` so Razorpay can retry.
create or replace function public.release_order_reservations(order_id uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  with released as (
    update public.products p
       set status = 'available', reserved_until = null, reserved_by = null, reserved_order_id = null
      from public.orders o
     where o.id = release_order_reservations.order_id
       and o.status = 'pending'
       and p.reserved_order_id = o.id
       and p.status = 'reserved'
    returning 1
  )
  select count(*)::integer from released;
$$;

-- mark_order_paid: as before, plus
--   * an item counts as this order's when the hold is attached to it, or is the buyer's hold not
--     yet attached to any order (verify racing attach), or has expired, or the item is available;
--   * items that went elsewhere are flagged order_items.unavailable (they need a refund);
--   * coupons are no longer counted here: apply_coupon claims them when the order is created.
create or replace function public.mark_order_paid(order_id uuid, payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  o public.orders;
  sold uuid[];
  unavailable uuid[];
begin
  if mark_order_paid.payment_id is null or mark_order_paid.payment_id = '' then
    raise exception 'payment_id is required' using errcode = '22004';
  end if;

  -- The row lock makes concurrent calls for the same order run one after the other.
  select * into o from public.orders where id = mark_order_paid.order_id for update;
  if not found then
    raise exception 'Order % not found', mark_order_paid.order_id using errcode = 'P0002';
  end if;

  if o.status <> 'pending' then
    return jsonb_build_object(
      'order_id', o.id,
      'status', o.status,
      'already_processed', true,
      'unavailable_product_ids', coalesce(
        (select jsonb_agg(oi.product_id) from public.order_items oi
          where oi.order_id = o.id and oi.unavailable),
        '[]'::jsonb
      )
    );
  end if;

  perform 1
     from public.products p
    where p.id in (select oi.product_id from public.order_items oi where oi.order_id = o.id)
    order by p.id
      for update;

  with updated as (
    update public.products p
       set status = 'sold', sold_at = now(),
           reserved_until = null, reserved_by = null, reserved_order_id = null
     where p.id in (select oi.product_id from public.order_items oi where oi.order_id = o.id)
       and (
         p.status = 'available'
         or (
           p.status = 'reserved'
           and (
             p.reserved_until <= now()
             or p.reserved_order_id = o.id
             or (p.reserved_order_id is null and p.reserved_by = o.user_id)
           )
         )
       )
    returning p.id
  )
  select coalesce(array_agg(u.id), '{}') into sold from updated u;

  with flagged as (
    update public.order_items oi
       set unavailable = true
     where oi.order_id = o.id and oi.product_id <> all (sold)
    returning oi.product_id
  )
  select coalesce(array_agg(f.product_id), '{}') into unavailable from flagged f;

  update public.orders
     set status = 'paid', razorpay_payment_id = mark_order_paid.payment_id, paid_at = now()
   where id = o.id;

  return jsonb_build_object(
    'order_id', o.id,
    'status', 'paid',
    'already_processed', false,
    'unavailable_product_ids', to_jsonb(unavailable)
  );
end;
$$;

-- When a pending order is cancelled (stale-order cron, or an admin), give back its holds and its
-- coupon use straight away.
create function public.release_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
     set status = 'available', reserved_until = null, reserved_by = null, reserved_order_id = null
   where reserved_order_id = new.id and status = 'reserved';

  with released as (
    delete from public.coupon_redemptions where order_id = new.id returning code
  )
  update public.coupons c
     set used_count = greatest(c.used_count - 1, 0)
    from released r
   where c.code = r.code;

  return new;
end;
$$;

-- cancel_stale_orders: pending orders older than 30 minutes (holds last 15) are abandoned.
-- A payment that still lands later finds the order cancelled; mark_order_paid reports that, and
-- the payment must be refunded. Scheduled below. Returns how many orders were cancelled.
create function public.cancel_stale_orders()
returns integer
language sql
security definer
set search_path = ''
as $$
  with cancelled as (
    update public.orders
       set status = 'cancelled'
     where status = 'pending' and created_at < now() - interval '30 minutes'
    returning 1
  )
  select count(*)::integer from cancelled;
$$;

create index orders_pending_created_at_idx on public.orders (created_at) where status = 'pending';

-- ===========================================================================
-- Coupon limits (1)
-- ===========================================================================

-- One row per coupon use. The primary key is the "once per customer" rule.
create table public.coupon_redemptions (
  code text not null references public.coupons (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (code, user_id)
);

alter table public.coupon_redemptions enable row level security;

create policy "Coupon redemptions: admins read"
  on public.coupon_redemptions for select to authenticated
  using ((select public.is_admin()));

-- Written only by apply_coupon and the cancel trigger.
revoke insert, update, delete on public.coupon_redemptions from anon, authenticated;

-- The trigger needs the table above, so it's created here.
create trigger orders_release_on_cancel
  after update of status on public.orders
  for each row
  when (old.status = 'pending' and new.status = 'cancelled')
  execute function public.release_cancelled_order();

comment on column public.coupons.used_count is
  'Uses claimed by apply_coupon (pending and paid orders). Cancelling a pending order gives one back.';

-- apply_coupon: claim a coupon for a pending order and recompute its total, atomically.
-- Insert the order with no coupon (discount 0) first, then call this, then create the Razorpay
-- order for the returned total. Never set orders.coupon_code directly.
--
-- Returns JSON. On success:
--   { ok: true, discount_paise, total_paise }
-- When the coupon can't be used (the order is left unchanged):
--   { ok: false, reason: 'invalid' | 'expired' | 'min_order' | 'used_up' | 'already_used',
--     min_order_paise? }
create function public.apply_coupon(order_id uuid, code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  o public.orders;
  c public.coupons;
  discount integer;
begin
  select * into o from public.orders where id = apply_coupon.order_id for update;
  if not found then
    raise exception 'Order % not found', apply_coupon.order_id using errcode = 'P0002';
  end if;
  if o.status <> 'pending' or o.user_id is null then
    raise exception 'Order % is not a pending customer order', o.id using errcode = '22023';
  end if;
  if o.coupon_code is not null then
    raise exception 'Order % already has a coupon', o.id using errcode = '22023';
  end if;

  -- Locking the coupon serialises checkouts using it, so the limit checks below can't race.
  select * into c from public.coupons
   where code = upper(btrim(apply_coupon.code))
     for update;

  if not found or not c.active then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if c.expires_at is not null and c.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if o.subtotal_paise < c.min_order_paise then
    return jsonb_build_object('ok', false, 'reason', 'min_order', 'min_order_paise', c.min_order_paise);
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'used_up');
  end if;
  if exists (
    select 1 from public.coupon_redemptions r where r.code = c.code and r.user_id = o.user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
  end if;

  discount := case c.type
    when 'percent' then (o.subtotal_paise::bigint * c.value / 100)::integer
    else least(c.value, o.subtotal_paise)
  end;

  insert into public.coupon_redemptions (code, user_id, order_id) values (c.code, o.user_id, o.id);
  update public.coupons set used_count = used_count + 1 where code = c.code;
  update public.orders
     set coupon_code = c.code,
         discount_paise = discount,
         total_paise = subtotal_paise + shipping_paise - discount
   where id = o.id;

  return jsonb_build_object(
    'ok', true,
    'discount_paise', discount,
    'total_paise', o.subtotal_paise + o.shipping_paise - discount
  );
end;
$$;

-- ===========================================================================
-- Notify-me: rate limited, double opt-in (5)
-- ===========================================================================

drop policy "Notify requests: anyone can sign up" on public.notify_requests;
revoke insert, update, delete on public.notify_requests from anon, authenticated;

alter table public.notify_requests
  add column confirm_token uuid not null unique default gen_random_uuid(),
  add column confirmed_at timestamptz,
  add column confirmation_sent_at timestamptz,
  add column client_key text check (char_length(client_key) <= 128);

comment on column public.notify_requests.confirmed_at is
  'Double opt-in. Only confirmed rows may ever be emailed a notification.';
comment on column public.notify_requests.client_key is
  'A hash of the requester''s IP, made by the server action. Used only for rate limiting.';

create index notify_requests_client_key_idx on public.notify_requests (client_key, created_at)
  where client_key is not null;
create index notify_requests_email_idx on public.notify_requests (email);

-- request_notify: called by the notify-me server action (service role).
--   * At most 10 sign-ups per client_key per hour.
--   * An address that has already confirmed once is subscribed straight away.
--   * Otherwise the row waits for confirmation, and the caller emails the confirm link only when
--     send_confirmation is true: at most one confirmation email per address per 24 hours, so a
--     stranger's inbox can't be flooded.
-- Returns JSON:
--   { ok: false, reason: 'rate_limited' | 'not_found' }
--   { ok: true, status: 'subscribed' }
--   { ok: true, status: 'pending', send_confirmation, confirm_token }
create function public.request_notify(
  email text, drop_id uuid default null, product_id uuid default null, client_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  addr text := lower(btrim(request_notify.email));
  r public.notify_requests;
  send boolean;
begin
  if num_nonnulls(request_notify.drop_id, request_notify.product_id) <> 1 then
    raise exception 'Pass exactly one of drop_id and product_id' using errcode = '22023';
  end if;

  if request_notify.client_key is not null and (
    select count(*) from public.notify_requests n
     where n.client_key = request_notify.client_key and n.created_at > now() - interval '1 hour'
  ) >= 10 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  -- Same visibility rules as the storefront: published drops, visible products.
  if request_notify.drop_id is not null and not exists (
    select 1 from public.drops d where d.id = request_notify.drop_id and d.is_published
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if request_notify.product_id is not null and not exists (
    select 1 from public.products p
     where p.id = request_notify.product_id
       and p.status <> 'draft'
       and public.drop_is_live(p.drop_id)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into public.notify_requests (email, drop_id, product_id, client_key, confirmed_at)
  values (
    addr, request_notify.drop_id, request_notify.product_id, request_notify.client_key,
    case
      when exists (
        select 1 from public.notify_requests n where n.email = addr and n.confirmed_at is not null
      ) then now()
    end
  )
  on conflict do nothing;

  select * into r from public.notify_requests n
   where n.email = addr
     and n.drop_id is not distinct from request_notify.drop_id
     and n.product_id is not distinct from request_notify.product_id;

  if r.confirmed_at is not null then
    return jsonb_build_object('ok', true, 'status', 'subscribed');
  end if;

  send := not exists (
    select 1 from public.notify_requests n
     where n.email = addr and n.confirmation_sent_at > now() - interval '24 hours'
  );
  if send then
    update public.notify_requests set confirmation_sent_at = now() where id = r.id;
  end if;

  return jsonb_build_object(
    'ok', true, 'status', 'pending', 'send_confirmation', send, 'confirm_token', r.confirm_token
  );
end;
$$;

-- confirm_notify: the address owner clicked the link. Confirms every pending sign-up for that
-- address (some may have been made while confirmation emails were throttled). Returns how many.
create function public.confirm_notify(token uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  with confirmed as (
    update public.notify_requests n
       set confirmed_at = now()
     where n.confirmed_at is null
       and n.email = (select t.email from public.notify_requests t where t.confirm_token = confirm_notify.token)
    returning 1
  )
  select count(*)::integer from confirmed;
$$;

-- Unconfirmed sign-ups are dropped after 7 days.
create function public.purge_unconfirmed_notify_requests()
returns integer
language sql
security definer
set search_path = ''
as $$
  with purged as (
    delete from public.notify_requests
     where confirmed_at is null and created_at < now() - interval '7 days'
    returning 1
  )
  select count(*)::integer from purged;
$$;

-- ===========================================================================
-- Privileges and schedules
-- ===========================================================================

revoke execute on function public.attach_reservations(uuid) from public, anon, authenticated;
revoke execute on function public.cancel_stale_orders() from public, anon, authenticated;
revoke execute on function public.release_cancelled_order() from public, anon, authenticated;
revoke execute on function public.apply_coupon(uuid, text) from public, anon, authenticated;
revoke execute on function public.request_notify(text, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.confirm_notify(uuid) from public, anon, authenticated;
revoke execute on function public.purge_unconfirmed_notify_requests() from public, anon, authenticated;

grant execute on function public.attach_reservations(uuid) to service_role;
grant execute on function public.cancel_stale_orders() to service_role;
grant execute on function public.apply_coupon(uuid, text) to service_role;
grant execute on function public.request_notify(text, uuid, uuid, text) to service_role;
grant execute on function public.confirm_notify(uuid) to service_role;
grant execute on function public.purge_unconfirmed_notify_requests() to service_role;

select cron.schedule(
  'cancel-stale-orders',
  '*/5 * * * *',
  $$select public.cancel_stale_orders()$$
);

select cron.schedule(
  'purge-unconfirmed-notify-requests',
  '17 3 * * *',
  $$select public.purge_unconfirmed_notify_requests()$$
);
