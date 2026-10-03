-- Checkout (CLAUDE.md §9). Service role only: called by /api/checkout and the checkout actions.
--   coupon_quote    what a coupon would take off, without claiming it (shared by apply_coupon)
--   start_checkout  hold the cart and create the pending order, in one transaction

-- ---------------------------------------------------------------------------
-- coupon_quote: the coupon rules in one place. Read-only.
-- Returns { ok: true, code, discount_paise }
--      or { ok: false, reason: 'invalid' | 'expired' | 'min_order' | 'used_up' | 'already_used',
--           min_order_paise? }
-- ---------------------------------------------------------------------------

create function public.coupon_quote(code text, user_id uuid, subtotal_paise integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  c public.coupons;
begin
  select * into c from public.coupons where code = upper(btrim(coupon_quote.code));

  if not found or not c.active then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if c.expires_at is not null and c.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if coupon_quote.subtotal_paise < c.min_order_paise then
    return jsonb_build_object('ok', false, 'reason', 'min_order', 'min_order_paise', c.min_order_paise);
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'used_up');
  end if;
  if exists (
    select 1 from public.coupon_redemptions r
     where r.code = c.code and r.user_id = coupon_quote.user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', c.code,
    'discount_paise', case c.type
      when 'percent' then (coupon_quote.subtotal_paise::bigint * c.value / 100)::integer
      else least(c.value, coupon_quote.subtotal_paise)
    end
  );
end;
$$;

-- apply_coupon: same contract as before, now using coupon_quote for the rules.
create or replace function public.apply_coupon(order_id uuid, code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  o public.orders;
  quote jsonb;
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

  -- Locking the coupon serialises checkouts using it, so the limit checks can't race.
  perform 1 from public.coupons where code = upper(btrim(apply_coupon.code)) for update;

  quote := public.coupon_quote(apply_coupon.code, o.user_id, o.subtotal_paise);
  if not (quote ->> 'ok')::boolean then
    return quote;
  end if;
  discount := (quote ->> 'discount_paise')::integer;

  insert into public.coupon_redemptions (code, user_id, order_id)
  values (quote ->> 'code', o.user_id, o.id);
  update public.coupons set used_count = used_count + 1 where code = quote ->> 'code';
  update public.orders
     set coupon_code = quote ->> 'code',
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

-- ---------------------------------------------------------------------------
-- start_checkout: everything up to (not including) the coupon and payment, atomically.
--   1. Cancels the user's earlier unpaid orders (a fresh checkout replaces them; the cancel
--      trigger frees their holds and coupon use).
--   2. Holds every item for 15 minutes (reserve_products). If any can't be held, stops and
--      returns them; the others stay held so a retry without them is quick.
--   3. Creates the pending order with prices read from the database, snapshots its items, and
--      attaches the holds to it.
-- The shipping rule is passed in from lib/config/shipping.ts, its single source of truth.
--
-- Returns { ok: false, unavailable_product_ids }
--      or { ok: true, order_id, subtotal_paise, shipping_paise, total_paise, reserved_until }
-- ---------------------------------------------------------------------------

create function public.start_checkout(
  user_id uuid,
  product_ids uuid[],
  address jsonb,
  shipping_flat_paise integer,
  free_shipping_above_paise integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  requested uuid[];
  unavailable uuid[];
  new_order uuid;
  subtotal integer;
  ship integer;
begin
  if start_checkout.user_id is null then
    raise exception 'user_id is required' using errcode = '22004';
  end if;
  if jsonb_typeof(start_checkout.address) <> 'object' then
    raise exception 'address must be an object' using errcode = '22023';
  end if;

  requested := array(
    select distinct t.id from unnest(start_checkout.product_ids) as t (id) where t.id is not null
  );
  if cardinality(requested) = 0 then
    raise exception 'Nothing to check out' using errcode = '22023';
  end if;

  update public.orders
     set status = 'cancelled'
   where user_id = start_checkout.user_id and status = 'pending';

  unavailable := public.reserve_products(requested, start_checkout.user_id);
  if cardinality(unavailable) > 0 then
    return jsonb_build_object('ok', false, 'unavailable_product_ids', to_jsonb(unavailable));
  end if;

  select sum(p.price_paise)::integer into subtotal from public.products p where p.id = any (requested);
  ship := case
    when subtotal >= start_checkout.free_shipping_above_paise then 0
    else start_checkout.shipping_flat_paise
  end;

  insert into public.orders (user_id, subtotal_paise, shipping_paise, discount_paise, total_paise, address)
  values (start_checkout.user_id, subtotal, ship, 0, subtotal + ship, start_checkout.address)
  returning id into new_order;

  insert into public.order_items (order_id, product_id, title_snapshot, price_paise_snapshot, image_snapshot)
  select new_order, p.id, p.title, p.price_paise,
         (select i.url from public.product_images i
           where i.product_id = p.id order by i.sort_order limit 1)
    from public.products p
   where p.id = any (requested);

  update public.products set reserved_order_id = new_order where id = any (requested);

  return jsonb_build_object(
    'ok', true,
    'order_id', new_order,
    'subtotal_paise', subtotal,
    'shipping_paise', ship,
    'total_paise', subtotal + ship,
    'reserved_until', (select min(p.reserved_until) from public.products p where p.id = any (requested))
  );
end;
$$;

revoke execute on function public.coupon_quote(text, uuid, integer) from public, anon, authenticated;
revoke execute on function public.start_checkout(uuid, uuid[], jsonb, integer, integer)
  from public, anon, authenticated;
grant execute on function public.coupon_quote(text, uuid, integer) to service_role;
grant execute on function public.start_checkout(uuid, uuid[], jsonb, integer, integer) to service_role;
