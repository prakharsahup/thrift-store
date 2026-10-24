-- International orders can be charged in US dollars through Razorpay (owner decision,
-- 2026-10-24): Razorpay only offers PayPal, and cards in the buyer's own currency, when the order
-- isn't in INR. The *_paise columns stay the order's value in rupees (reports, coupons, insights);
-- these record what Razorpay actually charged, for reconciliation and refunds.
-- Existing orders were all charged in INR, so charge_amount is backfilled from total_paise.

alter table public.orders
  add column charge_currency text not null default 'INR' check (charge_currency in ('INR', 'USD')),
  add column charge_amount integer check (charge_amount > 0);

comment on column public.orders.charge_currency is
  'Currency of the Razorpay order: INR, or USD for international orders when enabled.';
comment on column public.orders.charge_amount is
  'Amount of the Razorpay order in the smallest unit of charge_currency (paise or cents).';

update public.orders set charge_amount = total_paise where charge_amount is null and total_paise > 0;
