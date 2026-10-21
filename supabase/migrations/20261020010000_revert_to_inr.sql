-- The 2026-10-15 "price everything in USD" decision (20261015161212_all_products_usd.sql) was
-- reverted at the display layer the very next day (see the "owner decision, 2026-10-16" comment
-- in lib/utils/money.ts, which has shown every price in rupees ever since, regardless of what this
-- column said) but never reverted here or in the Razorpay integration. The result: every live
-- checkout created a Razorpay order for the correct paise *number* tagged as USD, charging
-- customers roughly 80x the price shown on the page. Checked against the Vendoo CSV this store was
-- imported from (its "Price" column is in INR): price_paise already holds the correct rupee value
-- for every product (e.g. CSV "280" -> price_paise 28000 = ₹280), so this is a label-only fix, not
-- a repricing. The `currency` column was never read anywhere except one dead field on
-- ProductCardData, so it's dropped rather than just corrected.
--
-- `currency` was appended to storefront_products/listed_products directly against the hosted
-- project (not captured in any migration file here — see the reconciliation note on
-- 20261014072313_vendoo_import_currency.sql for the same pattern). Dropping a column from a view
-- requires recreating it, and listed_products/search_products are built on top of
-- storefront_products, so all three are recreated here, column-for-column identical to
-- 20261014054855_compliance.sql minus `currency`.

drop function public.search_products(text);
drop view public.listed_products;
drop view public.storefront_products;

alter table public.products drop column currency;

-- The "reserved but the hold expired, so treat it as available" rule
-- (schema.sql / rls.sql / review_fixes.sql / compliance.sql each copied this CASE verbatim into
-- their own `create or replace view`). One function now, so there's a single place that decides
-- when a reservation reads as expired.
create function public.product_effective_status(
  p_status public.product_status, p_reserved_until timestamptz
)
returns public.product_status
language sql
stable
set search_path = ''
as $$
  select case
    when p_status = 'reserved' and p_reserved_until <= now() then 'available'::public.product_status
    else p_status
  end;
$$;

create view public.storefront_products
with (security_invoker = true)
as
select
  p.id, p.slug, p.title, p.description, p.brand, p.category_id, p.drop_id, p.gender,
  p.tagged_size, p.condition, p.measurements, p.flaws, p.style_tags,
  p.price_paise, p.original_price_paise, p.status, p.reserved_until, p.sold_at,
  p.created_at, p.published_at, p.updated_at, p.search,
  public.product_effective_status(p.status, p.reserved_until) as effective_status,
  p.country_of_origin
from public.products p
where p.status <> 'draft';

create view public.listed_products
with (security_invoker = true)
as
select s.*
from public.storefront_products s
where s.status <> 'sold' or s.sold_at > now() - interval '7 days';

grant select on public.storefront_products, public.listed_products to anon, authenticated;

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

-- Live data: the one piece of on-site copy that still said "$".
update public.banners
  set title = 'Under ₹499', image_alt = 'Placeholder banner for items under ₹499'
  where title = 'Under $499';
