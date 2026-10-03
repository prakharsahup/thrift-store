-- Phone sign-in: when someone signs up with a phone number, keep it on their profile too, so the
-- account page and checkout can prefill it. Auth stores numbers as digits without "+"
-- ("919876543210"); profiles store them as "+919876543210".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    case when new.phone ~ '^[0-9]{10,15}$' then '+' || new.phone end
  );
  return new;
end;
$$;
