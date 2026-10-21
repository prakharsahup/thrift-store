-- Insights, phase I3: replace the 1168-line PL/pgSQL reporting layer with two plain views plus
-- TypeScript aggregation (lib/server/insights.ts). The analytics math (date bucketing, breakdown
-- dimensions, percentiles) now lives in typed, diffable code instead of jsonb_build_object trees
-- nobody can step through. This migration only ADDS the two views; the insights_* functions stay
-- in place until the TypeScript side is verified against them (a later migration drops them).
--
-- Both views union real and demo rows exactly like private.all_orders/all_order_items did, but as
-- a `demo` boolean column instead of a function parameter.
--
-- These live in `public` (not `private`): `private` is never added to PostgREST's exposed-schema
-- list, which is the whole reason the old design needed SECURITY DEFINER functions in `public` to
-- reach it at all — a plain client, admin or not, cannot `.schema("private")` from the API. Instead
-- these views get the same treatment as the demo tables: no `security_invoker`, so they run as
-- their owner and read `public.orders`/`auth.users`/`private.*` regardless of the caller's RLS
-- (same effect as SECURITY DEFINER), and an explicit revoke/grant below is what actually restricts
-- them to service_role — the same "RLS can't hide columns/rows here, privileges can" pattern
-- CLAUDE.md §7 already uses for the reservation columns on `products`.

create view public.insights_orders as
select
  o.id, o.user_id, u.email::text as customer_email, o.status,
  o.subtotal_paise, o.shipping_paise, o.discount_paise, o.total_paise,
  o.coupon_code, o.address, o.payment_method, o.created_at, o.paid_at,
  m.packed_at, m.shipped_at, m.delivered_at,
  false as demo
from public.orders o
left join auth.users u on u.id = o.user_id
left join (
  select
    e.order_id,
    min(e.changed_at) filter (where e.to_status = 'packed') as packed_at,
    min(e.changed_at) filter (where e.to_status = 'shipped') as shipped_at,
    min(e.changed_at) filter (where e.to_status = 'delivered') as delivered_at
  from public.order_status_events e
  group by e.order_id
) m on m.order_id = o.id
union all
select
  d.id, d.user_id, d.customer_email, d.status,
  d.subtotal_paise, d.shipping_paise, d.discount_paise, d.total_paise,
  d.coupon_code, d.address, d.payment_method, d.created_at, d.paid_at,
  d.packed_at, d.shipped_at, d.delivered_at,
  true as demo
from private.demo_orders d;

revoke all on public.insights_orders from public, anon, authenticated;
grant select on public.insights_orders to service_role;

-- `price_paise` is the item's price AT SALE TIME (order_items.price_paise_snapshot / the demo
-- equivalent) — used for revenue, cost and retail-ratio math, same as the old
-- private.all_order_items. `product_price_paise` is the product's price TODAY — the old
-- insights_breakdown's price_band dimension bucketed by this (it ran
-- private.product_dimension_keys() against the whole, currently-joined `products` row, not the
-- order item), so a repriced-after-sale piece is kept consistent with that, not "fixed": it's
-- carried separately rather than silently swapped in for the snapshot.
create view public.insights_items as
select
  i.order_id, i.product_id, i.price_paise_snapshot as price_paise, i.unavailable,
  p.published_at as listed_at, c.cost_paise,
  p.brand, p.condition, p.tagged_size, p.gender, p.style_tags, p.drop_id, p.category_id,
  p.original_price_paise, p.price_paise as product_price_paise,
  false as demo
from public.order_items i
join public.products p on p.id = i.product_id
left join public.product_costs c on c.product_id = p.id
union all
select
  d.order_id, d.product_id, d.price_paise, d.unavailable,
  d.listed_at, dc.cost_paise,
  p.brand, p.condition, p.tagged_size, p.gender, p.style_tags, p.drop_id, p.category_id,
  p.original_price_paise, p.price_paise as product_price_paise,
  true as demo
from private.demo_order_items d
join public.products p on p.id = d.product_id
left join private.demo_product_costs dc on dc.product_id = d.product_id;

revoke all on public.insights_items from public, anon, authenticated;
grant select on public.insights_items to service_role;

-- Costs, real or demo. Inventory's "live" product list is always the real public.products rows
-- (stock on hand doesn't have a demo version), but which cost basis is joined to it does switch
-- with demo mode, same as every other report — this is what private.all_costs(p_demo) did.
create view public.insights_costs as
select product_id, cost_paise, false as demo
from public.product_costs
where cost_paise is not null
union all
select product_id, cost_paise, true as demo
from private.demo_product_costs;

revoke all on public.insights_costs from public, anon, authenticated;
grant select on public.insights_costs to service_role;
