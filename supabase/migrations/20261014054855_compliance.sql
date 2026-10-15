-- Legal compliance (docs/COMPLIANCE.md).
--   1. products.country_of_origin — E-Commerce Rules 2020 r. 6(5) asks sellers to show it.
--   2. support_requests — the contact form and grievance mechanism (r. 4(4)–(5): acknowledge
--      within 48 hours with a ticket number, resolve within a month).
--   3. Retention jobs the privacy notice promises.

-- ===========================================================================
-- 1. Country of origin
-- ===========================================================================

alter table public.products
  add column country_of_origin text check (char_length(country_of_origin) <= 60);

comment on column public.products.country_of_origin is
  'As printed on the label ("Made in …"). Null when the label doesn''t say or is missing.';

grant select (country_of_origin) on public.products to anon, authenticated;

-- Appended at the end, so `create or replace` keeps the existing columns as they are.
create or replace view public.storefront_products
with (security_invoker = true)
as
select
  p.id, p.slug, p.title, p.description, p.brand, p.category_id, p.drop_id, p.gender,
  p.tagged_size, p.condition, p.measurements, p.flaws, p.style_tags,
  p.price_paise, p.original_price_paise, p.status, p.reserved_until, p.sold_at,
  p.created_at, p.published_at, p.updated_at, p.search,
  case
    when p.status = 'reserved' and p.reserved_until <= now() then 'available'::public.product_status
    else p.status
  end as effective_status,
  p.country_of_origin
from public.products p
where p.status <> 'draft';

-- `s.*` was expanded when the view was made; re-create it to pick up the new column.
create or replace view public.listed_products
with (security_invoker = true)
as
select s.*
from public.storefront_products s
where s.status <> 'sold' or s.sold_at > now() - interval '7 days';

-- ===========================================================================
-- 2. Support requests and grievances
-- ===========================================================================

create type public.support_topic as enum (
  'order', 'cancellation', 'return', 'refund', 'privacy', 'grievance', 'other'
);
create type public.support_status as enum ('open', 'in_progress', 'resolved');

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  -- The reference shoppers quote: 8 characters, e.g. "K7Q2M9XA".
  ticket text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and email = lower(email)),
  phone text check (phone ~ '^\+?[0-9]{10,15}$'),
  topic public.support_topic not null,
  order_ref text check (char_length(order_ref) <= 20),
  message text not null check (char_length(message) between 10 and 5000),
  status public.support_status not null default 'open',
  resolution text check (char_length(resolution) <= 5000),
  client_key text check (char_length(client_key) <= 128),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint support_requests_resolved_consistent
    check ((status = 'resolved') = (resolved_at is not null))
);

comment on table public.support_requests is
  'Contact-form messages and complaints. Grievances must be acknowledged within 48 hours and resolved within 30 days.';
comment on column public.support_requests.acknowledged_at is
  'When the automatic acknowledgement email (with the ticket number) was sent.';
comment on column public.support_requests.client_key is
  'A hash of the sender''s IP, made by the server action. Used only for rate limiting.';

create index support_requests_open_idx on public.support_requests (created_at)
  where status <> 'resolved';
create index support_requests_user_idx on public.support_requests (user_id);
create index support_requests_client_key_idx on public.support_requests (client_key, created_at)
  where client_key is not null;

create trigger support_requests_set_updated_at
  before update on public.support_requests
  for each row execute function public.set_updated_at();

alter table public.support_requests enable row level security;

create policy "Support requests: own or admin read"
  on public.support_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Support requests: admins update"
  on public.support_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Created only through submit_support_request (service role); never deleted through the API.
revoke insert, delete on public.support_requests from anon, authenticated;
-- Admins may change only the workflow columns.
revoke update on public.support_requests from anon, authenticated;
grant update (status, resolution, resolved_at) on public.support_requests to authenticated;

-- submit_support_request: called by the contact form's server action (service role).
-- At most 5 messages per client_key per hour. Returns
--   { ok: false, reason: 'rate_limited' } or { ok: true, id, ticket }.
create function public.submit_support_request(
  name text,
  email text,
  topic public.support_topic,
  message text,
  phone text default null,
  order_ref text default null,
  user_id uuid default null,
  client_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.support_requests;
begin
  if submit_support_request.client_key is not null and (
    select count(*) from public.support_requests s
     where s.client_key = submit_support_request.client_key
       and s.created_at > now() - interval '1 hour'
  ) >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  insert into public.support_requests
    (name, email, phone, topic, order_ref, message, user_id, client_key)
  values (
    btrim(submit_support_request.name),
    lower(btrim(submit_support_request.email)),
    nullif(btrim(submit_support_request.phone), ''),
    submit_support_request.topic,
    nullif(upper(btrim(submit_support_request.order_ref, ' #')), ''),
    btrim(submit_support_request.message),
    submit_support_request.user_id,
    submit_support_request.client_key
  )
  returning * into r;

  return jsonb_build_object('ok', true, 'id', r.id, 'ticket', r.ticket);
end;
$$;

-- ===========================================================================
-- 3. Retention (privacy notice → "How long we keep it")
-- ===========================================================================

-- Resolved support messages are deleted 3 years after resolution.
create function public.purge_old_support_requests()
returns integer
language sql
security definer
set search_path = ''
as $$
  with purged as (
    delete from public.support_requests
     where status = 'resolved' and resolved_at < now() - interval '3 years'
    returning 1
  )
  select count(*)::integer from purged;
$$;

revoke execute on function public.submit_support_request(
  text, text, public.support_topic, text, text, text, uuid, text
) from public, anon, authenticated;
revoke execute on function public.purge_old_support_requests() from public, anon, authenticated;
grant execute on function public.submit_support_request(
  text, text, public.support_topic, text, text, text, uuid, text
) to service_role;

select cron.schedule(
  'purge-old-support-requests',
  '30 3 * * *',
  $$select public.purge_old_support_requests()$$
);
