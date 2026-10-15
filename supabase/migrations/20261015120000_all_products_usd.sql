-- The store now displays every price in US dollars (owner decision, 2026-10-15): the numeric
-- price_paise/original_price_paise values are unchanged, only the label moves from ₹ to $. The 40
-- original seed products were still marked "INR" (see 20261014072313_vendoo_import_currency.sql);
-- bring them in line with the 209 Vendoo-imported USD products and make USD the default for
-- anything listed from here on.

update public.products set currency = 'USD' where currency <> 'USD';

alter table public.products
  alter column currency set default 'USD';

update public.banners set title = 'Under $499' where title = 'Under ₹499';
update public.banners
  set image_alt = 'Placeholder banner for items under $499'
  where image_alt = 'Placeholder banner for items under 499 rupees';
