-- Reservation and payment function tests. Run with: pnpm dlx supabase test db
-- Runs as the service role, like the checkout and Razorpay routes. Rolled back at the end.
-- The two-browser race is tested separately (see the Phase 3 notes): it needs two connections.
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Seeded holds are relative to when the seed ran, and cron releases them. Pin them to "now" so
-- these tests don't depend on when they run.
update public.products
   set status = 'reserved', reserved_until = now() + interval '10 minutes', reserved_by = null
 where slug = 'cream-cable-knit-sweater';
update public.products
   set status = 'reserved', reserved_until = now() - interval '5 minutes', reserved_by = null
 where slug = 'oversized-washed-tee';

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'buyer-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'buyer-b@example.test');

create temporary table ids on commit drop as
select slug, id from public.products;
grant select on ids to service_role;

set local role service_role;

-- ---------------------------------------------------------------- reserve_products
select set_eq(
  $$select unnest(public.reserve_products(
      array(select id from ids where slug in (
        'ribbed-baby-tee',          -- available
        'floral-midi-dress',        -- sold
        'linen-button-up-shirt',    -- draft
        'satin-slip-dress',         -- in a drop that is not live yet
        'cream-cable-knit-sweater'  -- held by someone else
      )),
      '00000000-0000-0000-0000-00000000000a'))$$,
  $$select id from ids where slug in (
      'floral-midi-dress', 'linen-button-up-shirt', 'satin-slip-dress', 'cream-cable-knit-sweater')$$,
  'reserve_products returns exactly the sold, draft, not-yet-live and held items'
);

select is(
  (select status from public.products where slug = 'ribbed-baby-tee'),
  'reserved'::public.product_status, 'the available item is now reserved');
select ok(
  (select reserved_until between now() + interval '14 minutes' and now() + interval '16 minutes'
     from public.products where slug = 'ribbed-baby-tee'),
  'the hold lasts 15 minutes');

select is(
  public.reserve_products(array[(select id from ids where slug = 'ribbed-baby-tee')],
                          '00000000-0000-0000-0000-00000000000b'),
  array[(select id from ids where slug = 'ribbed-baby-tee')],
  'another user cannot take an item that is on hold');

select is(
  public.reserve_products(array[(select id from ids where slug = 'ribbed-baby-tee')],
                          '00000000-0000-0000-0000-00000000000a'),
  '{}'::uuid[], 'the same user can re-reserve (extends the hold)');

select is(
  public.reserve_products(array[(select id from ids where slug = 'oversized-washed-tee')],
                          '00000000-0000-0000-0000-00000000000b'),
  '{}'::uuid[], 'an expired hold can be reserved by someone else');

-- ---------------------------------------------------------------- release_expired_reservations
reset role;
update public.products set reserved_until = now() - interval '1 minute'
  where slug = 'ribbed-baby-tee';
set local role service_role;

select ok(public.release_expired_reservations() >= 1, 'release_expired_reservations releases expired holds');
select is(
  (select status from public.products where slug = 'ribbed-baby-tee'),
  'available'::public.product_status, 'the released item is available again');

-- ---------------------------------------------------------------- mark_order_paid
-- A reserves two items and creates a pending order with a coupon.
select public.reserve_products(
  array[(select id from ids where slug = 'ribbed-baby-tee'),
        (select id from ids where slug = 'fuzzy-knit-vest')],
  '00000000-0000-0000-0000-00000000000a');

insert into public.orders (id, user_id, subtotal_paise, shipping_paise, discount_paise, total_paise,
                           coupon_code, address)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a',
        89800, 7900, 8980, 88720, 'WELCOME10', '{"city": "Bengaluru"}');
insert into public.order_items (order_id, product_id, title_snapshot, price_paise_snapshot)
select '00000000-0000-0000-0000-0000000000a1', id, slug, 44900
from ids where slug in ('ribbed-baby-tee', 'fuzzy-knit-vest');

select is(
  public.mark_order_paid('00000000-0000-0000-0000-0000000000a1', 'pay_test_1') ->> 'already_processed',
  'false', 'the first mark_order_paid call processes the order');
select is(
  (select count(*)::int from public.products
    where slug in ('ribbed-baby-tee', 'fuzzy-knit-vest') and status = 'sold' and sold_at is not null),
  2, 'both items are sold');
select is(
  (select status from public.orders where id = '00000000-0000-0000-0000-0000000000a1'),
  'paid'::public.order_status, 'the order is paid');
select is(
  public.mark_order_paid('00000000-0000-0000-0000-0000000000a1', 'pay_test_1') ->> 'already_processed',
  'true', 'a second call (webhook after verify) is a no-op');
select is(
  (select used_count from public.coupons where code = 'WELCOME10'), 1,
  'the coupon is counted once, not twice');

-- An order whose hold was lost: B pays for an item that A is holding.
select public.reserve_products(array[(select id from ids where slug = 'cropped-zip-hoodie')],
                               '00000000-0000-0000-0000-00000000000a');
insert into public.orders (id, user_id, subtotal_paise, total_paise, address)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b',
        69900, 69900, '{"city": "Pune"}');
insert into public.order_items (order_id, product_id, title_snapshot, price_paise_snapshot)
select '00000000-0000-0000-0000-0000000000b1', id, slug, 69900 from ids where slug = 'cropped-zip-hoodie';

select is(
  public.mark_order_paid('00000000-0000-0000-0000-0000000000b1', 'pay_test_2') -> 'unavailable_product_ids',
  jsonb_build_array((select id from ids where slug = 'cropped-zip-hoodie')),
  'mark_order_paid reports items it could not sell, so the server can refund them');

-- ---------------------------------------------------------------- release_order_reservations
select public.reserve_products(array[(select id from ids where slug = 'nylon-coach-jacket')],
                               '00000000-0000-0000-0000-00000000000b');
insert into public.orders (id, user_id, subtotal_paise, total_paise, address)
values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000000b',
        99900, 99900, '{"city": "Pune"}');
insert into public.order_items (order_id, product_id, title_snapshot, price_paise_snapshot)
select '00000000-0000-0000-0000-0000000000b2', id, slug, 99900 from ids where slug = 'nylon-coach-jacket';

select is(public.release_order_reservations('00000000-0000-0000-0000-0000000000b2'), 1,
  'a failed payment releases the order''s held items');
select is(
  (select status from public.products where slug = 'nylon-coach-jacket'),
  'available'::public.product_status, 'the item is available again');

reset role;

select * from finish();
rollback;
