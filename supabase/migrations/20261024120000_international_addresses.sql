-- International shipping (owner decision, 2026-10-24): addresses get a country, and the
-- India-only checks on phone, state and PIN code now apply to Indian addresses only.
-- Mirrors addressSchema in lib/validators/checkout.ts. Existing rows are all Indian and keep
-- passing (country defaults to 'IN'). RLS on addresses is unchanged (own rows only).

alter table public.addresses
  add column country text not null default 'IN' check (country ~ '^[A-Z]{2}$');

-- The original inline checks (…_schema.sql) have generated names; drop them by column instead of
-- guessing the names.
do $$
declare
  c record;
begin
  for c in
    select con.conname
      from pg_constraint con
      join pg_attribute att
        on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
     where con.conrelid = 'public.addresses'::regclass
       and con.contype = 'c'
       and att.attname in ('phone', 'state', 'pincode')
  loop
    execute format('alter table public.addresses drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.addresses
  add constraint addresses_phone_by_country check (
    case when country = 'IN'
      then phone ~ '^[6-9][0-9]{9}$'      -- 10-digit Indian mobile, stored without +91
      else phone ~ '^\+[1-9][0-9]{6,14}$' -- E.164 with the country code
    end
  ),
  add constraint addresses_state_by_country check (
    case when country = 'IN'
      then char_length(state) between 1 and 80
      else char_length(state) <= 80        -- optional abroad (e.g. Singapore has none)
    end
  ),
  add constraint addresses_pincode_by_country check (
    case when country = 'IN'
      then pincode ~ '^[1-9][0-9]{5}$'
      else pincode ~ '^([A-Z0-9][A-Z0-9 -]{1,11})?$' -- optional abroad (Hong Kong, UAE, Qatar)
    end
  );
