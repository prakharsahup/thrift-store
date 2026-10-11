-- Compliance tests: support tickets (contact form / grievances) and country of origin.
-- Run with: pnpm db:test. Everything runs in a transaction and is rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'ticket-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'ticket-b@example.test'),
  ('00000000-0000-0000-0000-0000000000c1', 'ticket-admin@example.test');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000c1';

-- As the server would (service role / superuser): one ticket each for A, B and a guest.
select public.submit_support_request('Buyer A', 'TICKET-A@example.test', 'order', 'Where is my parcel please?',
  null, '#7f3a2c1b', '00000000-0000-0000-0000-0000000000a1', 'key-a');
select public.submit_support_request('Buyer B', 'ticket-b@example.test', 'grievance', 'I want to complain about this.',
  '+919876543210', null, '00000000-0000-0000-0000-0000000000b1', 'key-b');
select public.submit_support_request('Guest', 'guest@example.test', 'other', 'Do you ship to Leh?');

select is(
  (select email || ' ' || order_ref from public.support_requests where name = 'Buyer A'),
  'ticket-a@example.test 7F3A2C1B', 'email is lower-cased and the order number normalised');
select matches(
  (select ticket from public.support_requests where name = 'Guest'), '^[0-9A-F]{8}$',
  'every ticket gets an 8-character reference');

-- Rate limit: 5 per client key per hour (key-a has used 1).
select public.submit_support_request('Buyer A', 'ticket-a@example.test', 'other', 'Message number two', null, null, null, 'key-a')
  from generate_series(1, 4);
select is(
  public.submit_support_request('Buyer A', 'ticket-a@example.test', 'other', 'Message number six', null, null, null, 'key-a') ->> 'reason',
  'rate_limited', 'the 6th message in an hour from one client is refused');

-- ---------------------------------------------------------------- anonymous visitor
set local role anon;
select is((select count(*)::int from public.support_requests), 0, 'anon cannot read tickets');
select throws_ok(
  $$insert into public.support_requests (name, email, topic, message) values ('x', 'x@example.test', 'other', 'hello there')$$,
  '42501', null, 'anon cannot insert tickets directly');
select throws_ok(
  $$select public.submit_support_request('x', 'x@example.test', 'other', 'hello there')$$,
  '42501', null, 'anon cannot call submit_support_request');
select ok(
  (select count(*) from public.storefront_products where country_of_origin is null) > 0,
  'anon can read country_of_origin on the storefront');

-- ---------------------------------------------------------------- customer A
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select is((select count(*)::int from public.support_requests), 1, 'a customer sees only their own tickets');
select lives_ok($$update public.support_requests set status = 'in_progress'$$,
  'a customer status update matches no rows (RLS) rather than erroring');
select is((select status::text from public.support_requests), 'open',
  'a customer cannot change ticket status');
select throws_ok(
  $$update public.support_requests set message = 'edited'$$,
  '42501', null, 'a customer cannot edit the message column');
select throws_ok(
  $$delete from public.support_requests$$, '42501', null, 'a customer cannot delete tickets');

-- ---------------------------------------------------------------- admin
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';
select is((select count(*)::int from public.support_requests), 7, 'an admin sees every ticket');
select lives_ok($$update public.support_requests set status = 'in_progress' where name = 'Guest'$$,
  'an admin can update a ticket');
select is((select status::text from public.support_requests where name = 'Guest'), 'in_progress',
  'an admin can change ticket status');
select throws_ok(
  $$update public.support_requests set status = 'resolved' where name = 'Guest'$$,
  '23514', null, 'resolving needs resolved_at');
select lives_ok(
  $$update public.support_requests set status = 'resolved', resolved_at = now(), resolution = 'Yes, we do.' where name = 'Guest'$$,
  'an admin can resolve a ticket');

select * from finish();
rollback;
