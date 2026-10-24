-- Pre-launch cleanup (2026-10-24): hide the development seed data (supabase/seed.sql) that is still
-- live on the hosted project. Nothing is deleted; every change is a status flag and can be undone
-- with the "undo" block at the bottom.
--
-- Found on the hosted DB on 2026-10-24 (read-only check):
-- - 40 seed products whose every photo is a placehold.co image (35 available, 3 sold, 2 draft).
--   Shoppers can currently buy these, and they don't exist.
-- - 2 active hero banners with placeholder images ("Monsoon Denim is live", "Y2K Archive drops soon")
-- - 2 published seed drops (monsoon-denim, y2k-archive)
-- - 3 seed coupons (WELCOME10, FLAT150, EXPIRED20)
--
-- Run once in the Supabase SQL editor (or psql). Not a migration: it's data, not schema.

begin;

-- Sold seed items are left alone: products_sold_at_consistent needs sold_at on sold rows only, and
-- they sold on 2026-10-13, past the 7-day SOLD window, so they're already out of the listings.
update public.products p
   set status = 'draft'
 where p.status in ('available', 'reserved')
   and exists (select 1 from public.product_images i where i.product_id = p.id)
   and not exists (
     select 1 from public.product_images i
      where i.product_id = p.id and i.url not like '%placehold.co%'
   );

update public.banners set is_active = false where is_active and image_url like '%placehold.co%';

update public.drops set is_published = false
 where is_published and slug in ('monsoon-denim', 'y2k-archive');

update public.coupons set active = false
 where active and code in ('WELCOME10', 'FLAT150', 'EXPIRED20');

commit;

-- Undo:
-- update public.products p set status = 'available' where status = 'draft' and not exists (
--   select 1 from public.product_images i where i.product_id = p.id and i.url not like '%placehold.co%');
-- update public.banners set is_active = true where image_url like '%placehold.co%' and title <> 'Under ₹499';
-- update public.drops set is_published = true where slug in ('monsoon-denim', 'y2k-archive');
-- update public.coupons set active = true where code in ('WELCOME10', 'FLAT150', 'EXPIRED20');
