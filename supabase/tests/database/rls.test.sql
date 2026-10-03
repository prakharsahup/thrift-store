-- Row Level Security tests. Run with: pnpm dlx supabase test db
-- Uses the seed data (supabase/seed.sql). Everything runs in a transaction and is rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select plan(35);

-- Seeded holds are relative to when the seed ran, and cron releases them. Pin them to "now" so
-- these tests don't depend on when they run.
update public.products
   set status = 'reserved', reserved_until = now() + interval '10 minutes', reserved_by = null
 where slug = 'cream-cable-knit-sweater';
update public.products
   set status = 'reserved', reserved_until = now() - interval '5 minutes', reserved_by = null
 where slug = 'oversized-washed-tee';

-- Test users: A and B are customers, C becomes an admin.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'buyer-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'buyer-b@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@example.test');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000c';

-- Product ids looked up as superuser, so tests can target products a role can't see.
create temporary table ids on commit drop as select slug, id from public.products;
grant select on ids to anon, authenticated;

select is(
  (select count(*)::int from public.profiles
    where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')),
  2, 'a profile is created for every new user'
);

-- ---------------------------------------------------------------- anonymous visitor
set local role anon;

select is((select count(*)::int from public.products), 35,
  'anon sees 35 products: not the 2 drafts, not the 3 in the drop that is not live yet');
select is((select count(*)::int from public.products where status = 'draft'), 0, 'anon sees no drafts');
select is((select count(*)::int from public.listed_products), 34,
  'listings also drop the item sold more than 7 days ago');
select is((select count(*)::int from public.products where slug = 'striped-pique-polo'), 1,
  'but that old sold item is still readable by URL');
select is(
  (select effective_status from public.storefront_products where slug = 'oversized-washed-tee'),
  'available'::public.product_status, 'an expired hold reads as available');
select is(
  (select effective_status from public.storefront_products where slug = 'cream-cable-knit-sweater'),
  'reserved'::public.product_status, 'an active hold reads as reserved');
select is((select count(*)::int from public.product_images), 70,
  'anon sees images only for visible products (35 x 2)');
select is((select count(*)::int from public.drops), 2, 'anon sees only published drops');
select is((select count(*)::int from public.coupons), 0, 'anon cannot list coupons');
select is((select count(*)::int from public.orders), 0, 'anon cannot read orders');
select throws_ok(
  $$insert into public.orders (subtotal_paise, total_paise, address) values (100, 100, '{}')$$,
  '42501', null, 'anon cannot create orders');
select throws_ok(
  $$select public.reserve_products(array[gen_random_uuid()], '00000000-0000-0000-0000-00000000000a')$$,
  '42501', null, 'anon cannot reserve products');
select throws_ok(
  $$insert into public.notify_requests (email, drop_id)
    select 'fan@example.test', id from public.drops where slug = 'y2k-archive'$$,
  '42501', null, 'anon cannot insert notify-me sign-ups directly (request_notify only)');
select throws_ok(
  $$select public.request_notify('fan@example.test', (select id from public.drops limit 1))$$,
  '42501', null, 'anon cannot call request_notify');
select throws_ok(
  $$select reserved_by from public.products limit 1$$,
  '42501', null, 'anon cannot read who holds an item');
select throws_ok(
  $$select reserved_order_id from public.products limit 1$$,
  '42501', null, 'anon cannot read which order holds an item');
select is((select count(*)::int from public.storefront_products), 35,
  'the storefront view shows the same 35 products');
select is_empty(
  $$select id from public.listed_products where 'sporty' = any (style_tags)
    except select id from public.search_products('sporty:*')$$,
  'search finds every listed product tagged sporty (english stemming matches tags)');
select ok(
  (select jsonb_array_length(public.product_facets(null, null) -> 'brands') > 0
      and (public.product_facets(null, null) ->> 'min_price')::int > 0),
  'anon can read facets');

reset role;

-- ---------------------------------------------------------------- customer A
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select lives_ok(
  $$insert into public.addresses (name, phone, line1, city, state, pincode)
    values ('Buyer A', '9876543210', '12 MG Road', 'Bengaluru', 'Karnataka', '560001')$$,
  'a user can add their own address');
select lives_ok(
  $$insert into public.wishlists (product_id)
    select id from public.products where slug = 'ribbed-baby-tee'$$,
  'a user can wishlist a visible product');
select throws_ok(
  $$insert into public.wishlists (product_id)
    values ((select id from ids where slug = 'satin-slip-dress'))$$,
  '42501', null, 'a user cannot wishlist a product hidden in an upcoming drop');
select throws_ok(
  $$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'a user cannot make themselves an admin');
select lives_ok(
  $$update public.profiles set full_name = 'Buyer A' where id = '00000000-0000-0000-0000-00000000000a'$$,
  'a user can update their own name');
select throws_ok(
  $$select public.mark_order_paid(gen_random_uuid(), 'pay_fake')$$,
  '42501', null, 'a user cannot mark orders paid');
select lives_ok(
  $$insert into public.cart_items (product_id)
    values ((select id from ids where slug = 'ribbed-baby-tee'))$$,
  'a user can add a visible product to their cart');
select throws_ok(
  $$insert into public.cart_items (product_id)
    values ((select id from ids where slug = 'fleece-quarter-zip'))$$,
  '42501', null, 'a user cannot add a draft product to their cart');

reset role;

-- ---------------------------------------------------------------- customer B
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';

select is((select count(*)::int from public.addresses), 0, 'B cannot see A''s address');
select is((select count(*)::int from public.wishlists), 0, 'B cannot see A''s wishlist');
select is((select count(*)::int from public.cart_items), 0, 'B cannot see A''s cart');
select lives_ok($$delete from public.cart_items$$, 'B can run a delete on cart items');

reset role;

select is((select count(*)::int from public.cart_items), 1, '...but A''s cart item survived it');

-- ---------------------------------------------------------------- admin
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';

select is((select count(*)::int from public.products), 40, 'admins see every product, drafts included');
select is((select count(*)::int from public.coupons), 3, 'admins see coupons');

reset role;

select * from finish();
rollback;
