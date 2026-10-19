-- Insights, phase I1: the data the /admin/insights reports need that the store didn't record yet.
--   * product_costs: what each piece cost to acquire, for profit and margin.
--   * order_status_events: when each order changed status, for pack/ship/deliver times.
--   * Indexes for the date-range scans the reports run.

-- ---------------------------------------------------------------------------
-- Acquisition cost
-- ---------------------------------------------------------------------------

-- Its own table rather than a products column: products are publicly readable and RLS can't hide
-- a single column, so the cost lives where only admins can reach it. One row per piece, written
-- from the admin product form; no row (or a null cost) means "not entered yet".
create table public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost_paise integer check (cost_paise >= 0),
  source text check (char_length(source) between 1 and 120),
  acquired_on date,
  updated_at timestamptz not null default now()
);

alter table public.product_costs enable row level security;

create policy "Product costs: admins only"
  on public.product_costs for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create trigger product_costs_set_updated_at
  before update on public.product_costs
  for each row execute function public.set_updated_at();

-- The bulk cost-entry page (/admin/products/costs): pieces with no cost yet, sold ones first since
-- they already count towards profit. A function rather than a query from the app because it needs
-- a left join and each piece's first photo.
create function public.admin_products_missing_cost(p_limit integer, p_offset integer)
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
  select
    p.id, p.slug, p.title, p.brand, p.status, p.price_paise, p.sold_at, c.source,
    i.url, i.alt
  from public.products p
  left join public.product_costs c on c.product_id = p.id
  left join lateral (
    select pi.url, pi.alt
    from public.product_images pi
    where pi.product_id = p.id
    order by pi.sort_order
    limit 1
  ) i on true
  where c.cost_paise is null
    and (select public.is_admin())
  order by p.sold_at desc nulls last, p.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

revoke execute on function public.admin_products_missing_cost(integer, integer) from public, anon;
grant execute on function public.admin_products_missing_cost(integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Order status history
-- ---------------------------------------------------------------------------

create table public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_at timestamptz not null default now(),
  -- The admin who changed it; null for server code (payments, cron).
  changed_by uuid references auth.users (id) on delete set null
);

create index order_status_events_order_idx on public.order_status_events (order_id, changed_at);

alter table public.order_status_events enable row level security;

-- Read-only through the API: only the trigger below writes here.
create policy "Order status events: admins read"
  on public.order_status_events for select to authenticated
  using ((select public.is_admin()));

-- security definer: the trigger writes the history row whoever changed the order (an admin through
-- RLS, or the service role from mark_order_paid and the cron jobs), so no code path can skip it.
create function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, from_status, to_status, changed_by)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.status end,
      new.status,
      (select auth.uid())
    );
  end if;
  return null;
end;
$$;

create trigger orders_log_status_change
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();

-- Backfill for orders placed before this migration. Only the creation and payment times are known
-- for sure; the current status is dated by updated_at, so older fulfilment times are approximate.
insert into public.order_status_events (order_id, from_status, to_status, changed_at)
select id, null::public.order_status, 'pending'::public.order_status, created_at
from public.orders
union all
select id, 'pending', 'paid', paid_at
from public.orders
where paid_at is not null
union all
select
  id,
  case when paid_at is not null then 'paid' else 'pending' end::public.order_status,
  status,
  updated_at
from public.orders
where status not in ('pending', 'paid');

-- ---------------------------------------------------------------------------
-- Report indexes
-- ---------------------------------------------------------------------------

-- Sales reports filter paid orders by when they were paid.
create index orders_paid_at_idx on public.orders (paid_at) where paid_at is not null;
-- Sell-through and days-to-sell filter sold pieces by when they sold.
create index products_sold_at_idx on public.products (sold_at) where sold_at is not null;
