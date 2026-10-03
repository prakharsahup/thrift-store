-- LOCAL DEVELOPMENT ONLY. Loaded with the seed (config.toml [db.seed]), never by migrations, so
-- it doesn't exist in production.
--
-- Phone sign-in needs an SMS provider. Locally there isn't one, so auth's "send SMS" hook
-- (config.toml [auth.hook.send_sms]) writes each message here instead: the SMS version of
-- Mailpit. Read the latest code in Studio (http://127.0.0.1:54323 → Table editor → schema "dev"
-- → sms_outbox) or with:
--   select phone, otp, created_at from dev.sms_outbox order by created_at desc limit 5;

create schema if not exists dev;

create table if not exists dev.sms_outbox (
  id bigint generated always as identity primary key,
  phone text not null,
  otp text not null,
  created_at timestamptz not null default now()
);

-- Auth calls this with { user: { phone, ... }, sms: { otp } }. Returning {} means "sent".
create or replace function dev.send_sms_hook(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  insert into dev.sms_outbox (phone, otp)
  values (event #>> '{user,phone}', event #>> '{sms,otp}');
  return '{}'::jsonb;
end;
$$;

-- Only the auth server may call the hook or touch the outbox; the API roles can't see either.
revoke all on schema dev from public, anon, authenticated;
revoke execute on function dev.send_sms_hook(jsonb) from public, anon, authenticated;
grant usage on schema dev to supabase_auth_admin;
grant execute on function dev.send_sms_hook(jsonb) to supabase_auth_admin;
grant insert on dev.sms_outbox to supabase_auth_admin;
