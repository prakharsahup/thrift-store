-- Security hardening, two independent fixes:
--
-- 1. auth_account_status was SECURITY DEFINER, read auth.users.encrypted_password, and was granted
--    to anon/authenticated with no rate limit — an unauthenticated caller could hit it directly via
--    supabase.rpc() and use the three-value response to enumerate which emails have an account
--    (CWE-203/204). It's now service_role-only (callable only from a trusted server action, the same
--    pattern as request_notify/submit_support_request) and rate-limited per client_key, and its
--    search_path is normalised to '' like every other SECURITY DEFINER function in this project.
--
-- 2. admin_products_missing_cost checked is_admin() inside its WHERE clause instead of raising via
--    private.assert_admin() (that helper didn't exist yet when this function was first written).
--    A non-admin caller got a silent empty result rather than a 403 — not exploitable today, but a
--    future edit that adds another WHERE branch above the check could reopen it unnoticed. Switched
--    to the same assert-and-raise pattern used by every other admin/insights RPC.

-- ---------------------------------------------------------------------------
-- 1. auth_account_status
-- ---------------------------------------------------------------------------

create table public.auth_account_status_checks (
  client_key text not null,
  created_at timestamptz not null default now()
);

comment on table public.auth_account_status_checks is
  'Rate-limit log for auth_account_status. A hash of the requester''s IP, made by the server '
  'action. Rows are never read for anything but counting recent attempts.';

create index auth_account_status_checks_client_key_idx
  on public.auth_account_status_checks (client_key, created_at);

alter table public.auth_account_status_checks enable row level security;
revoke all on table public.auth_account_status_checks from public, anon, authenticated;

create or replace function public.auth_account_status(p_email text, p_client_key text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_encrypted_password text;
begin
  if p_client_key is not null and (
    select count(*) from public.auth_account_status_checks c
     where c.client_key = p_client_key and c.created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'rate_limited' using errcode = '42901';
  end if;

  if p_client_key is not null then
    insert into public.auth_account_status_checks (client_key) values (p_client_key);
  end if;

  select encrypted_password into v_encrypted_password
  from auth.users
  where email = lower(trim(p_email))
  limit 1;

  if not found then
    return 'none';
  elsif v_encrypted_password is not null and v_encrypted_password <> '' then
    return 'has_password';
  else
    return 'needs_password';
  end if;
end;
$$;

revoke all on function public.auth_account_status(text, text) from public, anon, authenticated;
grant execute on function public.auth_account_status(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- 2. admin_products_missing_cost
-- ---------------------------------------------------------------------------

create or replace function public.admin_products_missing_cost(p_limit integer, p_offset integer)
returns table (
  id uuid,
  slug text,
  title text,
  brand text,
  status public.product_status,
  price_paise integer,
  sold_at timestamptz,
  source text,
  image_url text,
  image_alt text
)
language sql
stable
security definer
set search_path = ''
as $$
  with guard as (select private.assert_admin())
  select
    p.id, p.slug, p.title, p.brand, p.status, p.price_paise, p.sold_at, c.source,
    i.url, i.alt
  from public.products p
  cross join guard
  left join public.product_costs c on c.product_id = p.id
  left join lateral (
    select pi.url, pi.alt
    from public.product_images pi
    where pi.product_id = p.id
    order by pi.sort_order
    limit 1
  ) i on true
  where c.cost_paise is null
  order by p.sold_at desc nulls last, p.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;
