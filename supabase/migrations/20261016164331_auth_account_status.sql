-- Lets the login form decide, before sending anything, whether an email should go through the
-- password field or the OTP-signup/set-password flow. SECURITY DEFINER because `auth.users` isn't
-- reachable from anon/authenticated roles directly; only a three-value status is ever returned.
create or replace function public.auth_account_status(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_encrypted_password text;
begin
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

revoke all on function public.auth_account_status(text) from public;
grant execute on function public.auth_account_status(text) to anon, authenticated;
