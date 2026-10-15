-- Reconciliation only: this was applied directly against the hosted project on 2026-10-14
-- (see commit 38b5d19) before migration files were the source of truth for it. Re-created here,
-- at its real applied version, so `supabase migration list --linked` and `db push` agree with the
-- hosted project's history. Guarded so it's a no-op if ever run again.

alter table public.products
  add column if not exists currency text not null default 'INR';

alter table public.products
  drop constraint if exists products_currency_check;

alter table public.products
  add constraint products_currency_check check (currency = any (array['INR', 'USD']));

comment on column public.products.currency is
  'Display currency for price_paise/original_price_paise. Imported items may be priced in USD '
  'pending repricing to INR; price_paise still holds the smallest unit (cents for USD, paise for INR).';
