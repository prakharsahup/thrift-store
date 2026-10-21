-- Local development seed (runs after migrations on `supabase db reset`).
-- All products, brands and copy are invented. Images are placehold.co placeholders.
-- Category slugs match lib/config/navigation.ts.
--
-- Built-in test cases:
--   * 2 drafts (hidden from the public)
--   * 2 sold in the last 7 days (listed with a SOLD badge) and 1 sold 10 days ago (unlisted, URL works)
--   * 1 active 15-minute hold, and 1 expired hold (reads as available until cron releases it)
--   * a live drop, a published drop that goes live in 5 days (its products are hidden), and an
--     unpublished drop

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

insert into public.categories (name, slug, parent_id, gender, sort_order) values
  ('Men', 'men', null, 'men', 1),
  ('Women', 'women', null, 'women', 2),
  ('Unisex', 'unisex', null, 'unisex', 3);

insert into public.categories (name, slug, parent_id, gender, sort_order)
select c.name, c.slug, parent.id, parent.gender, c.sort_order
from (values
  ('T-shirts', 'men-t-shirts', 'men', 1),
  ('Shirts', 'men-shirts', 'men', 2),
  ('Polos', 'men-polos', 'men', 3),
  ('Sweatshirts & hoodies', 'men-sweatshirts', 'men', 4),
  ('Jerseys', 'men-jerseys', 'men', 5),
  ('Jeans', 'men-jeans', 'men', 6),
  ('Trousers', 'men-trousers', 'men', 7),
  ('Cargos', 'men-cargos', 'men', 8),
  ('Shorts', 'men-shorts', 'men', 9),
  ('Jackets', 'men-jackets', 'men', 10),
  ('Knitwear', 'men-knitwear', 'men', 11),
  ('Caps & hats', 'men-caps', 'men', 12),
  ('Bags', 'men-bags', 'men', 13),
  ('Tops', 'women-tops', 'women', 1),
  ('T-shirts', 'women-t-shirts', 'women', 2),
  ('Shirts', 'women-shirts', 'women', 3),
  ('Sweatshirts & hoodies', 'women-sweatshirts', 'women', 4),
  ('Knitwear', 'women-knitwear', 'women', 5),
  ('Dresses', 'women-dresses', 'women', 6),
  ('Co-ord sets', 'women-co-ords', 'women', 7),
  ('Skirts', 'women-skirts', 'women', 8),
  ('Jeans', 'women-jeans', 'women', 9),
  ('Trousers', 'women-trousers', 'women', 10),
  ('Shorts', 'women-shorts', 'women', 11),
  ('Jackets', 'women-jackets', 'women', 12),
  ('Cardigans', 'women-cardigans', 'women', 13),
  ('Bags', 'women-bags', 'women', 14),
  ('Accessories', 'women-accessories', 'women', 15),
  ('Oversized tees', 'unisex-oversized-tees', 'unisex', 1),
  ('Hoodies & sweatshirts', 'unisex-hoodies', 'unisex', 2),
  ('Jackets', 'unisex-jackets', 'unisex', 3),
  ('Track pants', 'unisex-track-pants', 'unisex', 4),
  ('Jerseys', 'unisex-jerseys', 'unisex', 5),
  ('Caps & hats', 'unisex-caps', 'unisex', 6),
  ('Bags', 'unisex-bags', 'unisex', 7),
  ('Scarves', 'unisex-scarves', 'unisex', 8)
) as c (name, slug, parent_slug, sort_order)
join public.categories parent on parent.slug = c.parent_slug;

update public.categories
set image_url = format(
  'https://placehold.co/480x600/19141F/F5ECFF/png?text=%s',
  replace(replace(name, ' & ', '+and+'), ' ', '+')
);

-- ---------------------------------------------------------------------------
-- Drops
-- ---------------------------------------------------------------------------

insert into public.drops (name, slug, description, banner_url, go_live_at, is_published) values
  ('Monsoon Denim', 'monsoon-denim',
   'Broken-in denim for grey skies: straight legs, flares and one very good trucker jacket.',
   'https://placehold.co/1600x700/8855D9/F5ECFF/png?text=Monsoon+Denim',
   now() - interval '3 days', true),
  ('Y2K Archive', 'y2k-archive',
   'Slip dresses, tiny bags and pleats, straight out of 2003.',
   'https://placehold.co/1600x700/C8A5FF/100D16/png?text=Y2K+Archive',
   now() + interval '5 days', true),
  ('Winter Knits', 'winter-knits',
   'Still being sorted. Not published yet.',
   null,
   now() + interval '30 days', false);

-- ---------------------------------------------------------------------------
-- Products (40)
-- age_hours sets published_at, so "Just dropped" has a believable order.
-- ---------------------------------------------------------------------------

insert into public.products (
  slug, title, brand, category_id, drop_id, gender, tagged_size, condition, measurements,
  flaws, style_tags, price_paise, original_price_paise, status, published_at, description
)
select
  p.slug, p.title, p.brand, c.id, d.id, c.gender, p.tagged_size,
  p.condition::public.product_condition, p.measurements::jsonb, p.flaws, p.style_tags::text[],
  p.price_paise, p.original_price_paise, p.status::public.product_status,
  case
    when p.status = 'draft' then null
    when d.id is not null then d.go_live_at
    else now() - p.age_hours * interval '1 hour'
  end,
  p.description
from (values
  -- Men
  ('washed-black-graphic-tee', 'Washed black graphic tee', 'Northline', 'men-t-shirts', null, 'L', 'good',
   '{"chest": 56, "length": 72, "shoulder": 50, "sleeve": 21}', 'Tiny pinhole near the hem.',
   '{vintage,streetwear}', 44900, 129900, 'available', 2,
   'Soft, thin cotton that only years of washing can give you. Faded print, boxy fit.'),
  ('sky-blue-oxford-shirt', 'Sky blue oxford shirt', 'Studio Nine', 'men-shirts', null, 'M', 'like_new',
   '{"chest": 54, "length": 76, "shoulder": 46, "sleeve": 63}', null,
   '{minimal,workwear}', 69900, 249900, 'available', 30,
   'A crisp button-down that works with chinos or over a tee. Barely worn.'),
  ('striped-pique-polo', 'Striped pique polo', 'Oaktree Athletic', 'men-polos', null, 'XL', 'good',
   '{"chest": 60, "length": 74, "shoulder": 52, "sleeve": 24}', 'Light fading on the collar.',
   '{sporty}', 39900, 149900, 'available', 400,
   'Breathable pique cotton with bold stripes. Relaxed fit.'),
  ('grey-marl-crewneck-sweatshirt', 'Grey marl crewneck sweatshirt', 'Basecamp Supply', 'men-sweatshirts', null, 'L', 'good',
   '{"chest": 61, "length": 68, "shoulder": 55, "sleeve": 60}', 'Slight pilling under the arms.',
   '{vintage,minimal}', 89900, 279900, 'available', 8,
   'Heavy loopback cotton, ribbed cuffs, the grey that goes with everything.'),
  ('retro-football-jersey-number-10', 'Retro football jersey number 10', 'Ferro', 'men-jerseys', null, 'M', 'like_new',
   '{"chest": 53, "length": 73, "shoulder": 47, "sleeve": 22}', null,
   '{sporty,y2k}', 99900, null, 'available', 5,
   'Shiny polyester, chunky collar, number 10 on the back. Made for the stands.'),
  ('mid-wash-straight-jeans', 'Mid-wash straight jeans', 'Kora Denim', 'men-jeans', 'monsoon-denim', '32', 'good',
   '{"waist": 42, "hip": 53, "inseam": 79, "length": 104}', 'Natural fading at the knees.',
   '{vintage,streetwear}', 109900, 349900, 'available', 0,
   'Classic five-pocket straight leg in a true mid-wash. Sits at the waist.'),
  ('raw-selvedge-jeans', 'Raw selvedge jeans', 'Kora Denim', 'men-jeans', 'monsoon-denim', '34', 'like_new',
   '{"waist": 44, "hip": 55, "inseam": 81, "length": 107}', null,
   '{workwear,minimal}', 189900, 599900, 'available', 0,
   'Stiff, dark and ready to fade your way. Selvedge ID on the outseam.'),
  ('olive-chino-trousers', 'Olive chino trousers', 'Studio Nine', 'men-trousers', null, '32', 'good',
   '{"waist": 41, "hip": 52, "inseam": 78, "length": 102}', 'Small mark on the back pocket.',
   '{minimal}', 59900, 199900, 'available', 50,
   'Mid-weight cotton twill in a muted olive. Tapered leg.'),
  ('sand-ripstop-cargo-pants', 'Sand ripstop cargo pants', 'Basecamp Supply', 'men-cargos', null, 'L', 'new_with_tags',
   '{"waist": 43, "hip": 56, "inseam": 80, "length": 106}', null,
   '{streetwear,workwear}', 129900, 289900, 'available', 3,
   'Tags still on. Ripstop cotton, six pockets, adjustable hems.'),
  ('nylon-track-shorts', 'Nylon track shorts', 'Oaktree Athletic', 'men-shorts', null, 'M', 'fair',
   '{"waist": 38, "length": 44}', 'Faded print and a loose drawcord.',
   '{sporty,y2k}', 24900, null, 'available', 70,
   'Swishy nylon with a mesh lining. Well loved, still going.'),
  ('trucker-denim-jacket', 'Trucker denim jacket', 'Kora Denim', 'men-jackets', 'monsoon-denim', 'L', 'good',
   '{"chest": 60, "length": 64, "shoulder": 50, "sleeve": 62}', 'Two buttons replaced with close matches.',
   '{vintage,workwear}', 179900, 449900, 'available', 0,
   'The jacket everyone wants: boxy, faded, with proper chest pockets.'),
  ('cream-cable-knit-sweater', 'Cream cable-knit sweater', 'Halcyon', 'men-knitwear', null, 'M', 'like_new',
   '{"chest": 55, "length": 67, "shoulder": 48, "sleeve": 61}', null,
   '{vintage,minimal}', 119900, 329900, 'available', 12,
   'Chunky cables in a warm cream wool blend. No pilling.'),
  ('corduroy-six-panel-cap', 'Corduroy six-panel cap', null, 'men-caps', null, 'One size', 'good',
   '{}', null, '{vintage}', 29900, null, 'available', 90,
   'Fine-wale corduroy with a brass buckle strap.'),
  ('canvas-messenger-bag', 'Canvas messenger bag', 'Basecamp Supply', 'men-bags', null, null, 'good',
   '{}', 'Ink mark on the inner lining.', '{workwear}', 79900, 199900, 'available', 26,
   'Waxed canvas with leather trims. Fits a 14-inch laptop.'),
  ('boxy-check-flannel-shirt', 'Boxy check flannel shirt', 'Northline', 'men-shirts', null, 'XL', 'good',
   '{"chest": 62, "length": 78, "shoulder": 54, "sleeve": 64}', null,
   '{workwear,vintage}', 64900, 179900, 'available', 16,
   'Brushed cotton flannel in a red and navy check. Wear it open over a tee.'),
  -- Women
  ('ribbed-baby-tee', 'Ribbed baby tee', 'Lumen', 'women-t-shirts', null, 'S', 'like_new',
   '{"chest": 40, "length": 48, "shoulder": 34, "sleeve": 12}', null,
   '{y2k}', 34900, 99900, 'available', 1,
   'Stretchy rib, cropped length, tiny sleeves. Very 2002.'),
  ('lace-trim-cami-top', 'Lace trim cami top', 'Mirela', 'women-tops', null, 'M', 'good',
   '{"chest": 44, "length": 52}', null,
   '{y2k,vintage}', 42900, 129900, 'available', 20,
   'Silky cami with lace at the neckline and adjustable straps.'),
  ('linen-button-up-shirt', 'Linen button-up shirt', 'Studio Nine', 'women-shirts', null, 'M', 'good',
   '{"chest": 52, "length": 70, "shoulder": 44, "sleeve": 58}', 'Faint crease marks.',
   '{minimal}', 74900, 229900, 'draft', 0,
   'Breezy linen in off-white. Oversized fit.'),
  ('cropped-zip-hoodie', 'Cropped zip hoodie', 'Oaktree Athletic', 'women-sweatshirts', null, 'S', 'good',
   '{"chest": 48, "length": 46, "shoulder": 42, "sleeve": 56}', null,
   '{sporty,streetwear}', 69900, 199900, 'available', 9,
   'Cropped, zip-through, fleece-lined. Pairs with high-rise anything.'),
  ('fuzzy-knit-vest', 'Fuzzy knit vest', 'Halcyon', 'women-knitwear', null, 'M', 'like_new',
   '{"chest": 47, "length": 55}', null,
   '{vintage}', 54900, 159900, 'available', 40,
   'Brushed knit sweater vest in moss green. Layer it over a shirt.'),
  ('floral-midi-dress', 'Floral midi dress', 'Mirela', 'women-dresses', null, 'M', 'good',
   '{"chest": 46, "waist": 36, "length": 118}', 'Small repaired seam at the side.',
   '{vintage}', 99900, 299900, 'available', 60,
   'Flowing viscose with a small floral print and a tie waist.'),
  ('satin-slip-dress', 'Satin slip dress', 'Lumen', 'women-dresses', 'y2k-archive', 'S', 'like_new',
   '{"chest": 42, "waist": 34, "length": 96}', null,
   '{y2k,minimal}', 89900, 269900, 'available', 0,
   'Bias-cut satin in champagne. Adjustable straps.'),
  ('tweed-co-ord-set', 'Tweed co-ord set', 'Juno', 'women-co-ords', null, 'M', 'new_with_tags',
   '{"chest": 47, "waist": 35, "length": 52}', null,
   '{vintage}', 199900, 549900, 'available', 4,
   'Cropped jacket and mini skirt in pink tweed. Tags on both pieces.'),
  ('pleated-tennis-skirt', 'Pleated tennis skirt', 'Oaktree Athletic', 'women-skirts', 'y2k-archive', 'S', 'good',
   '{"waist": 34, "hip": 46, "length": 38}', null,
   '{sporty,y2k}', 39900, 119900, 'available', 0,
   'Crisp knife pleats with built-in shorts.'),
  ('low-rise-flare-jeans', 'Low-rise flare jeans', 'Kora Denim', 'women-jeans', 'monsoon-denim', '28', 'good',
   '{"waist": 37, "hip": 46, "inseam": 82, "length": 101}', 'Frayed hems (part of the look).',
   '{y2k,vintage}', 119900, 329900, 'available', 0,
   'The low-rise flare is back. Medium wash, slight stretch.'),
  ('wide-leg-pleated-trousers', 'Wide-leg pleated trousers', 'Studio Nine', 'women-trousers', null, 'M', 'like_new',
   '{"waist": 36, "hip": 52, "inseam": 76, "length": 104}', null,
   '{minimal,workwear}', 84900, 249900, 'available', 14,
   'High-waisted with sharp front pleats. Falls straight to the floor.'),
  ('denim-cut-off-shorts', 'Denim cut-off shorts', 'Kora Denim', 'women-shorts', null, '30', 'fair',
   '{"waist": 38, "hip": 50, "length": 34}', 'Light staining on the back pocket.',
   '{vintage}', 29900, null, 'available', 100,
   'Cut from vintage straight jeans. Raw hem.'),
  ('cropped-faux-leather-jacket', 'Cropped faux-leather jacket', 'Ferro', 'women-jackets', null, 'S', 'good',
   '{"chest": 46, "length": 45, "shoulder": 39, "sleeve": 58}', 'Light creasing on the sleeves.',
   '{y2k,streetwear}', 149900, 399900, 'available', 7,
   'Boxy cropped biker in matte black. Zip cuffs.'),
  ('chunky-knit-cardigan', 'Chunky knit cardigan', 'Halcyon', 'women-cardigans', null, 'L', 'good',
   '{"chest": 58, "length": 62, "shoulder": 52, "sleeve": 55}', 'One button replaced.',
   '{vintage}', 79900, 219900, 'available', 36,
   'Oversized and cosy, with wooden buttons.'),
  ('beaded-shoulder-bag', 'Beaded shoulder bag', 'Mirela', 'women-bags', 'y2k-archive', null, 'like_new',
   '{}', null, '{y2k}', 49900, 149900, 'available', 0,
   'Tiny baguette bag covered in glass beads.'),
  -- Unisex
  ('oversized-washed-tee', 'Oversized washed tee', 'Northline', 'unisex-oversized-tees', null, 'XL', 'good',
   '{"chest": 62, "length": 74, "shoulder": 58, "sleeve": 24}', null,
   '{streetwear}', 39900, 119900, 'available', 6,
   'Dropped shoulders and a garment-dyed charcoal finish.'),
  ('heavyweight-pullover-hoodie', 'Heavyweight pullover hoodie', 'Basecamp Supply', 'unisex-hoodies', null, 'L', 'good',
   '{"chest": 64, "length": 70, "shoulder": 58, "sleeve": 60}', 'Faint mark on the cuff.',
   '{streetwear,minimal}', 109900, 299900, 'available', 11,
   'Thick 450gsm cotton fleece with a double-layer hood.'),
  ('colour-block-windbreaker', 'Colour-block windbreaker', 'Oaktree Athletic', 'unisex-jackets', null, 'L', 'like_new',
   '{"chest": 63, "length": 70, "shoulder": 56, "sleeve": 62}', null,
   '{y2k,sporty}', 139900, 349900, 'available', 2,
   'Teal, purple and white panels with a packable hood.'),
  ('side-stripe-track-pants', 'Side-stripe track pants', 'Oaktree Athletic', 'unisex-track-pants', null, 'M', 'good',
   '{"waist": 36, "hip": 52, "inseam": 76, "length": 100}', null,
   '{sporty,y2k}', 59900, 179900, 'available', 22,
   'Tricot track pants with contrast stripes and zip ankles.'),
  ('vintage-cricket-jersey', 'Vintage cricket jersey', 'Ferro', 'unisex-jerseys', null, 'L', 'fair',
   '{"chest": 58, "length": 76, "shoulder": 50, "sleeve": 24}', 'Faded numbers and a small hole at the back.',
   '{sporty,vintage}', 34900, null, 'available', 48,
   'Old-school one-day jersey. The fading is half the charm.'),
  ('washed-dad-cap', 'Washed dad cap', null, 'unisex-caps', null, 'One size', 'good',
   '{}', null, '{minimal}', 19900, null, 'available', 30,
   'Unstructured cotton cap in faded navy.'),
  ('heavy-canvas-tote', 'Heavy canvas tote', 'Basecamp Supply', 'unisex-bags', null, null, 'like_new',
   '{}', null, '{minimal}', 29900, 89900, 'available', 18,
   'Thick natural canvas with an inner zip pocket.'),
  ('wool-check-scarf', 'Wool check scarf', 'Halcyon', 'unisex-scarves', null, null, 'good',
   '{}', 'Small pull in the weave.', '{vintage}', 24900, null, 'available', 75,
   'Soft lambswool in a camel and grey check.'),
  ('fleece-quarter-zip', 'Fleece quarter-zip', 'Basecamp Supply', 'unisex-hoodies', null, 'M', 'good',
   '{"chest": 57, "length": 68, "shoulder": 50, "sleeve": 59}', null,
   '{vintage,sporty}', 69900, 189900, 'draft', 0,
   'Polar fleece pullover in forest green.'),
  ('nylon-coach-jacket', 'Nylon coach jacket', 'Northline', 'unisex-jackets', null, 'XL', 'good',
   '{"chest": 65, "length": 72, "shoulder": 57, "sleeve": 63}', null,
   '{streetwear}', 99900, 279900, 'available', 28,
   'Snap-front coach jacket with a light lining.')
) as p (
  slug, title, brand, category_slug, drop_slug, tagged_size, condition, measurements, flaws,
  style_tags, price_paise, original_price_paise, status, age_hours, description
)
join public.categories c on c.slug = p.category_slug
left join public.drops d on d.slug = p.drop_slug;

-- Sold: two recently (listed with a SOLD badge) and one 10 days ago (unlisted, URL still works).
update public.products set status = 'sold', sold_at = now() - interval '2 days'
  where slug = 'sky-blue-oxford-shirt';
update public.products set status = 'sold', sold_at = now() - interval '1 day'
  where slug = 'floral-midi-dress';
update public.products set status = 'sold', sold_at = now() - interval '10 days'
  where slug = 'striped-pique-polo';

-- Holds: one active, one already expired (reads as available until cron releases it).
update public.products set status = 'reserved', reserved_until = now() + interval '10 minutes'
  where slug = 'cream-cable-knit-sweater';
update public.products set status = 'reserved', reserved_until = now() - interval '5 minutes'
  where slug = 'oversized-washed-tee';

-- Two images per product: front, then back (the card hover shows the second one).
insert into public.product_images (product_id, url, alt, sort_order)
select p.id,
       format('https://placehold.co/600x800/%s/F5ECFF/png?text=%s', img.bg, replace(p.title, ' ', '+')),
       format('%s, %s', p.title, img.view),
       img.sort_order
from public.products p
cross join (values ('19141F', 'front', 0), ('2E2740', 'back', 1)) as img (bg, view, sort_order);

-- ---------------------------------------------------------------------------
-- Banners, coupons
-- ---------------------------------------------------------------------------

insert into public.banners (title, subtitle, image_url, image_alt, link_url, cta_label, sort_order) values
  ('Monsoon Denim is live', 'Straight legs, flares and one very good trucker jacket.',
   'https://placehold.co/1600x700/8855D9/F5ECFF/png?text=Monsoon+Denim',
   'Placeholder banner for the Monsoon Denim drop', '/drops/monsoon-denim', 'Shop the drop', 1),
  ('Under ₹499', 'Graded, measured and cheaper than a pizza night.',
   'https://placehold.co/1600x700/C8A5FF/100D16/png?text=Under+499',
   'Placeholder banner for items under ₹499', '/c/unisex?max=499', 'Shop steals', 2),
  ('Y2K Archive drops soon', 'Slip dresses, tiny bags and pleats. Get notified.',
   'https://placehold.co/1600x700/100D16/F5ECFF/png?text=Y2K+Archive',
   'Placeholder banner for the upcoming Y2K Archive drop', '/drops/y2k-archive', 'Notify me', 3);

insert into public.coupons (code, type, value, min_order_paise, max_uses, expires_at) values
  ('WELCOME10', 'percent', 10, 99900, null, null),
  ('FLAT150', 'flat', 15000, 149900, 500, now() + interval '90 days'),
  ('EXPIRED20', 'percent', 20, 0, null, now() - interval '1 day');
