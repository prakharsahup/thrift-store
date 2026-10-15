-- Reservation and payment functions (CLAUDE.md §4, §7, §9).
-- SECURITY DEFINER and callable ONLY by the service role: the checkout and Razorpay routes call
-- them from server code with lib/supabase/admin.ts. Browsers can never reserve or sell items.

-- ---------------------------------------------------------------------------
-- reserve_products: hold items for 15 minutes when checkout starts.
-- Returns the ids that could NOT be reserved (already reserved by someone else, sold, draft,
-- in a drop that isn't live, or unknown). Items it could reserve stay reserved.
-- Calling it again for the same user extends that user's holds.
-- ---------------------------------------------------------------------------

create function public.reserve_products(product_ids uuid[], user_id uuid)
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
  -- A second checkout for the same item waits here, then sees the first one's hold below.
  perform 1
     from public.products p
    where p.id = any (requested)
    order by p.id
      for update;

  with updated as (
    update public.products p
       set status = 'reserved',
           reserved_until = now() + interval '15 minutes',
           reserved_by = reserve_products.user_id
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

-- ---------------------------------------------------------------------------
-- release_expired_reservations: return expired holds to `available`. Scheduled every 5 minutes
-- (next migration). Returns how many items were released.
-- ---------------------------------------------------------------------------

create function public.release_expired_reservations()
returns integer
language sql
security definer
set search_path = ''
as $$
  with released as (
    update public.products
       set status = 'available', reserved_until = null, reserved_by = null
     where status = 'reserved' and reserved_until <= now()
    returning 1
  )
  select count(*)::integer from released;
$$;

-- ---------------------------------------------------------------------------
-- release_order_reservations: a payment failed, so free the order's items right away.
-- The order stays `pending`: Razorpay lets the buyer retry, and a later successful payment still
-- goes through mark_order_paid. Returns how many items were released.
-- ---------------------------------------------------------------------------

create function public.release_order_reservations(order_id uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  with released as (
    update public.products p
       set status = 'available', reserved_until = null, reserved_by = null
      from public.orders o
     where o.id = release_order_reservations.order_id
       and o.status = 'pending'
       and p.id in (
         select oi.product_id from public.order_items oi
          where oi.order_id = release_order_reservations.order_id
       )
       and p.status = 'reserved'
       and p.reserved_by = o.user_id
    returning 1
  )
  select count(*)::integer from released;
$$;

-- ---------------------------------------------------------------------------
-- mark_order_paid: the payment was captured. Marks the order `paid` and its items `sold`.
-- Idempotent: the verify route and the webhook both call it; the second call changes nothing and
-- reports already_processed = true.
--
-- Returns JSON:
--   { order_id, status, already_processed, unavailable_product_ids }
-- unavailable_product_ids is non-empty only if the hold expired and someone else bought or holds
-- an item before this payment landed. The money was still taken, so the order is still marked
-- paid; the caller must refund or contact the buyer for those items.
-- If already_processed is true and status is `cancelled`, the payment arrived for a cancelled
-- order and must be refunded.
-- ---------------------------------------------------------------------------

create function public.mark_order_paid(order_id uuid, payment_id text)
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
      'unavailable_product_ids', '[]'::jsonb
    );
  end if;

  perform 1
     from public.products p
    where p.id in (select oi.product_id from public.order_items oi where oi.order_id = o.id)
    order by p.id
      for update;

  with updated as (
    update public.products p
       set status = 'sold', sold_at = now(), reserved_until = null, reserved_by = null
     where p.id in (select oi.product_id from public.order_items oi where oi.order_id = o.id)
       and (
         p.status = 'available'
         or (p.status = 'reserved' and (p.reserved_by = o.user_id or p.reserved_until <= now()))
       )
    returning p.id
  )
  select coalesce(array_agg(u.id), '{}') into sold from updated u;

  select coalesce(array_agg(oi.product_id), '{}')
    into unavailable
    from public.order_items oi
   where oi.order_id = o.id and oi.product_id <> all (sold);

  update public.orders
     set status = 'paid', razorpay_payment_id = mark_order_paid.payment_id, paid_at = now()
   where id = o.id;

  if o.coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where code = o.coupon_code;
  end if;

  return jsonb_build_object(
    'order_id', o.id,
    'status', 'paid',
    'already_processed', false,
    'unavailable_product_ids', to_jsonb(unavailable)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Service role only
-- ---------------------------------------------------------------------------

revoke execute on function public.reserve_products(uuid[], uuid) from public, anon, authenticated;
revoke execute on function public.release_expired_reservations() from public, anon, authenticated;
revoke execute on function public.release_order_reservations(uuid) from public, anon, authenticated;
revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;

grant execute on function public.reserve_products(uuid[], uuid) to service_role;
grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.release_order_reservations(uuid) to service_role;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
