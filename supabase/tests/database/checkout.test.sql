-- Reservation and payment function tests. Run with: pnpm dlx supabase test db
-- Runs as the service role, like the checkout and Razorpay routes. Rolled back at the end.
-- The two-browser race is tested separately (see the Phase 3 notes): it needs two connections.
begin;
create extension if not exists pgtap with schema extensions;

select plan(50);

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

insert into public.coupons (code, type, value, min_order_paise, max_uses)
values ('ONCE', 'flat', 10000, 0, 1);

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

-- ---------------------------------------------------------------- coupons and mark_order_paid
-- A reserves two items, creates a pending order without a coupon, attaches the holds, then
-- applies WELCOME10 (10%, min ₹999).
select public.reserve_products(
  array[(select id from ids where slug = 'ribbed-baby-tee'),
        (select id from ids where slug = 'fuzzy-knit-vest')],
  '00000000-0000-0000-0000-00000000000a');

insert into public.orders (id, user_id, subtotal_paise, shipping_paise, total_paise, address)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a',
        109800, 0, 109800, '{"city": "Bengaluru"}');
insert into public.order_items (order_id, product_id, title_snapshot, price_paise_snapshot)
select '00000000-0000-0000-0000-0000000000a1', id, slug, 54900
from ids where slug in ('ribbed-baby-tee', 'fuzzy-knit-vest');

select is(public.attach_reservations('00000000-0000-0000-0000-0000000000a1'), '{}'::uuid[],
  'attach_reservations ties both holds to the order');
select is(
  public.apply_coupon('00000000-0000-0000-0000-0000000000a1', ' welcome10 '),
  '{"ok": true, "discount_paise": 10980, "total_paise": 98820}'::jsonb,
  'apply_coupon applies 10% and returns the new total');
select is(
  (select total_paise from public.orders where id = '00000000-0000-0000-0000-0000000000a1'), 98820,
  'the order total is recomputed on the server');
select is((select used_count from public.coupons where code = 'WELCOME10'), 1,
  'the coupon use is claimed at checkout');

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
select is((select used_count from public.coupons where code = 'WELCOME10'), 1,
  'paying does not count the coupon again');

-- A second order by A: WELCOME10 is once per customer. ONCE has max_uses = 1.
insert into public.orders (id, user_id, subtotal_paise, total_paise, address)
values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a',
        120000, 120000, '{"city": "Bengaluru"}');
select is(public.apply_coupon('00000000-0000-0000-0000-0000000000a2', 'WELCOME10') ->> 'reason',
  'already_used', 'a customer cannot use the same coupon twice');
select is(public.apply_coupon('00000000-0000-0000-0000-0000000000a2', 'EXPIRED20') ->> 'reason',
  'expired', 'expired coupons are refused');
select is(public.apply_coupon('00000000-0000-0000-0000-0000000000a2', 'NOPE') ->> 'reason',
  'invalid', 'unknown coupons are refused');
select is(public.apply_coupon('00000000-0000-0000-0000-0000000000a2', 'ONCE') ->> 'ok',
  'true', 'A claims the single-use coupon');
select throws_ok(
  $$select public.apply_coupon('00000000-0000-0000-0000-0000000000a2', 'FLAT150')$$,
  '22023', null, 'an order takes one coupon only');

insert into public.orders (id, user_id, subtotal_paise, total_paise, address)
values ('00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-00000000000b',
        50000, 50000, '{"city": "Pune"}');
select is(public.apply_coupon('00000000-0000-0000-0000-0000000000b0', 'ONCE') ->> 'reason',
  'used_up', 'max_uses is enforced across customers');
select is(public.apply_coupon('00000000-0000-0000-0000-0000000000b0', 'WELCOME10') ->> 'reason',
  'min_order', 'the minimum order is enforced');

update public.orders set status = 'cancelled' where id = '00000000-0000-0000-0000-0000000000a2';
select is((select used_count from public.coupons where code = 'ONCE'), 0,
  'cancelling a pending order gives its coupon use back');
select is(public.apply_coupon('00000000-0000-0000-0000-0000000000b0', 'ONCE') ->> 'ok',
  'true', '...so someone else can use it');

-- ---------------------------------------------------------------- oversold orders
-- B pays for an item that A is holding.
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
  'mark_order_paid reports items it could not sell');
select ok(
  (select unavailable from public.order_items where order_id = '00000000-0000-0000-0000-0000000000b1'),
  'and flags them on the order, so nobody packs them');

-- ---------------------------------------------------------------- holds belong to an order
-- B starts checkout (order b2), abandons it, and starts again (order b3) for the same item.
select public.reserve_products(array[(select id from ids where slug = 'nylon-coach-jacket')],
                               '00000000-0000-0000-0000-00000000000b');
insert into public.orders (id, user_id, subtotal_paise, total_paise, address) values
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000000b', 99900, 99900, '{}'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-00000000000b', 99900, 99900, '{}');
insert into public.order_items (order_id, product_id, title_snapshot, price_paise_snapshot)
select o.id, i.id, i.slug, 99900
  from ids i,
       (values ('00000000-0000-0000-0000-0000000000b2'::uuid),
               ('00000000-0000-0000-0000-0000000000b3'::uuid)) as o (id)
 where i.slug = 'nylon-coach-jacket';
select public.attach_reservations('00000000-0000-0000-0000-0000000000b2');
select public.reserve_products(array[(select id from ids where slug = 'nylon-coach-jacket')],
                               '00000000-0000-0000-0000-00000000000b');
select is(public.attach_reservations('00000000-0000-0000-0000-0000000000b3'), '{}'::uuid[],
  'the newer checkout takes over the hold');

select is(public.release_order_reservations('00000000-0000-0000-0000-0000000000b2'), 0,
  'a failed payment on the old order does not free a hold the newer order depends on');
select is(public.release_order_reservations('00000000-0000-0000-0000-0000000000b3'), 1,
  'a failed payment frees the order''s own holds');
select is(
  (select status from public.products where slug = 'nylon-coach-jacket'),
  'available'::public.product_status, 'the item is available again');

-- ---------------------------------------------------------------- stale pending orders
select public.reserve_products(array[(select id from ids where slug = 'heavy-canvas-tote')],
                               '00000000-0000-0000-0000-00000000000b');
insert into public.orders (id, user_id, subtotal_paise, total_paise, address, created_at)
values ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-00000000000b',
        59900, 59900, '{}', now() - interval '1 hour');
insert into public.order_items (order_id, product_id, title_snapshot, price_paise_snapshot)
select '00000000-0000-0000-0000-0000000000b4', id, slug, 59900 from ids where slug = 'heavy-canvas-tote';
select public.attach_reservations('00000000-0000-0000-0000-0000000000b4');

select ok(public.cancel_stale_orders() >= 1, 'cancel_stale_orders cancels abandoned orders');
select is(
  (select status from public.orders where id = '00000000-0000-0000-0000-0000000000b4'),
  'cancelled'::public.order_status, 'the stale order is cancelled');
select is(
  (select status from public.products where slug = 'heavy-canvas-tote'),
  'available'::public.product_status, 'and its hold is released');
select is(
  public.mark_order_paid('00000000-0000-0000-0000-0000000000b4', 'pay_late') ->> 'status',
  'cancelled', 'a payment landing after cancellation is reported, so it can be refunded');

-- ---------------------------------------------------------------- start_checkout and coupon_quote
create temporary table co (n int primary key, result jsonb) on commit drop;
grant all on co to service_role;

insert into co values (1, public.start_checkout(
  '00000000-0000-0000-0000-00000000000a',
  array[(select id from ids where slug = 'chunky-knit-cardigan'),
        (select id from ids where slug = 'olive-chino-trousers')],
  '{"name": "Buyer A", "city": "Bengaluru"}', 7900, 99900));
select is((select (result ->> 'ok')::boolean from co where n = 1), true,
  'start_checkout holds the cart and creates the order');
select is(
  (select (result ->> 'subtotal_paise')::int from co where n = 1),
  (select sum(price_paise)::int from public.products
    where slug in ('chunky-knit-cardigan', 'olive-chino-trousers')),
  'the subtotal comes from database prices');
select is(
  (select count(*)::int from public.products
    where reserved_order_id = (select (result ->> 'order_id')::uuid from co where n = 1)),
  2, 'both holds are attached to the new order');
select is(
  (select count(*)::int from public.order_items
    where order_id = (select (result ->> 'order_id')::uuid from co where n = 1)
      and image_snapshot is not null),
  2, 'order items are snapshotted with an image');

insert into co values (2, public.start_checkout(
  '00000000-0000-0000-0000-00000000000a',
  array[(select id from ids where slug = 'chunky-knit-cardigan')],
  '{"name": "Buyer A"}', 7900, 99900));
select is(
  (select status from public.orders where id = (select (result ->> 'order_id')::uuid from co where n = 1)),
  'cancelled'::public.order_status, 'starting checkout again replaces the earlier unpaid order');
select is(
  (select status from public.products where slug = 'olive-chino-trousers'),
  'available'::public.product_status, '...and frees what the new checkout no longer includes');

insert into co values (3, public.start_checkout(
  '00000000-0000-0000-0000-00000000000b',
  array[(select id from ids where slug = 'chunky-knit-cardigan')],
  '{"name": "Buyer B"}', 7900, 99900));
select is(
  (select result from co where n = 3),
  jsonb_build_object('ok', false, 'unavailable_product_ids',
                     jsonb_build_array((select id from ids where slug = 'chunky-knit-cardigan'))),
  'another shopper cannot check out a held piece');

select is(public.coupon_quote('FLAT150', '00000000-0000-0000-0000-00000000000b', 200000),
  '{"ok": true, "code": "FLAT150", "discount_paise": 15000}'::jsonb,
  'coupon_quote previews a discount');
select is((select used_count from public.coupons where code = 'FLAT150'), 0,
  '...without using the coupon up');

-- ---------------------------------------------------------------- notify-me
select is(
  public.request_notify('Fan@Example.test', (select id from public.drops where slug = 'y2k-archive'),
                        null, 'ip-1') - 'confirm_token',
  '{"ok": true, "status": "pending", "send_confirmation": true}'::jsonb,
  'a new address gets one confirmation email');
select is(
  public.request_notify('fan@example.test', null, (select id from ids where slug = 'heavy-canvas-tote'),
                        'ip-1') ->> 'send_confirmation',
  'false', 'but no second one within 24 hours');
select is(
  public.confirm_notify(
    (select confirm_token from public.notify_requests where email = 'fan@example.test' limit 1)),
  2, 'confirming the address confirms its pending sign-ups');
select is(
  public.request_notify('fan@example.test', null,
                        (select id from ids where slug = 'canvas-messenger-bag'), 'ip-1') ->> 'status',
  'subscribed', 'a confirmed address is subscribed straight away');

reset role;
insert into public.notify_requests (email, product_id, client_key)
select 'spam' || g || '@example.test', (select id from ids where slug = 'canvas-messenger-bag'), 'ip-2'
  from generate_series(1, 10) as g;
set local role service_role;
select is(
  public.request_notify('victim@example.test', (select id from public.drops where slug = 'y2k-archive'),
                        null, 'ip-2') ->> 'reason',
  'rate_limited', 'more than 10 sign-ups an hour from one client are refused');

reset role;

select * from finish();
rollback;
