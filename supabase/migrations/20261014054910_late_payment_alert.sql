-- A payment can land after this order's hold already expired and the stale-order cron cancelled
-- it (CLAUDE.md §9; cancel_stale_orders runs every 5 minutes). mark_order_paid already detects
-- this (status "cancelled", already_processed true) so the order isn't double-charged, but nothing
-- told the owner to refund it by hand. The webhook and the verify route can both call
-- mark_order_paid for the same late payment, so late_payment_notified_at makes "tell the owner"
-- happen exactly once per order, the same way the paid path is already one-time.

alter table public.orders
  add column late_payment_notified_at timestamptz;

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
  notify_late boolean;
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
    notify_late := o.status = 'cancelled' and o.late_payment_notified_at is null;
    if notify_late then
      update public.orders set late_payment_notified_at = now() where id = o.id;
    end if;

    return jsonb_build_object(
      'order_id', o.id,
      'status', o.status,
      'already_processed', true,
      'notify_late_payment', notify_late,
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
    'notify_late_payment', false,
    'unavailable_product_ids', to_jsonb(unavailable)
  );
end;
$$;
