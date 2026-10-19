-- Insights, phase I2: the reporting functions behind /admin/insights, and demo data so the pages
-- can be built and previewed before the store has real orders.
--
-- Every public insights_* function:
--   * is security definer and checks is_admin() first: only admins get numbers back;
--   * takes a [p_from, p_to) range (the app passes India-time midnights) and p_demo, which swaps
--     the real orders for the generated ones in private.demo_*. Demo numbers go through exactly the
--     same queries, so previewing them also exercises the real reports;
--   * returns jsonb with raw sums in paise, parsed with zod in lib/server/insights.ts (ratios such
--     as average order value and margin are derived there).
--
-- Definitions used everywhere:
--   * A sale is an order paid in the range whose status is paid, packed, shipped or delivered.
--     Refunded orders are reported separately; cancelled ones never count.
--   * Pieces marked unavailable (sold to someone else first, refunded) are not sales.
--   * Profit is item price minus cost, over the pieces that have a cost; coverage is reported
--     alongside so a part-filled cost list never reads as the whole picture.
--   * Days, weeks and hours are India time.

-- ---------------------------------------------------------------------------
-- Private schema: helpers and demo data, unreachable through the API
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.assert_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

-- Demo orders: same shape as the columns the reports read from public.orders, plus the fulfilment
-- times that real orders keep in order_status_events.
create table private.demo_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  customer_email text not null,
  status public.order_status not null,
  subtotal_paise integer not null,
  shipping_paise integer not null,
  discount_paise integer not null,
  total_paise integer not null,
  coupon_code text,
  address jsonb not null,
  payment_method text,
  created_at timestamptz not null,
  paid_at timestamptz,
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);

-- Demo sales reuse real products (so categories, brands and styles are the store's own), each with
-- its own listing date: the real catalogue is too new for realistic days-to-sell.
create table private.demo_order_items (
  order_id uuid not null references private.demo_orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  price_paise integer not null,
  unavailable boolean not null default false,
  listed_at timestamptz not null,
  primary key (order_id, product_id)
);

create table private.demo_product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost_paise integer not null
);

-- No policies: only the security definer functions below (run as the owner) read these.
alter table private.demo_orders enable row level security;
alter table private.demo_order_items enable row level security;
alter table private.demo_product_costs enable row level security;

-- ---------------------------------------------------------------------------
-- Sources: real or demo rows, one shape
-- ---------------------------------------------------------------------------

create function private.all_orders(p_demo boolean)
returns table (
  id uuid,
  user_id uuid,
  customer_email text,
  status public.order_status,
  subtotal_paise integer,
  shipping_paise integer,
  discount_paise integer,
  total_paise integer,
  coupon_code text,
  address jsonb,
  payment_method text,
  created_at timestamptz,
  paid_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    o.id, o.user_id, u.email::text, o.status, o.subtotal_paise, o.shipping_paise,
    o.discount_paise, o.total_paise, o.coupon_code, o.address, o.payment_method, o.created_at,
    o.paid_at
  from public.orders o
  left join auth.users u on u.id = o.user_id
  where not p_demo
  union all
  select
    d.id, d.user_id, d.customer_email, d.status, d.subtotal_paise, d.shipping_paise,
    d.discount_paise, d.total_paise, d.coupon_code, d.address, d.payment_method, d.created_at,
    d.paid_at
  from private.demo_orders d
  where p_demo;
$$;

create function private.all_order_items(p_demo boolean)
returns table (
  order_id uuid,
  product_id uuid,
  price_paise integer,
  unavailable boolean,
  listed_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select i.order_id, i.product_id, i.price_paise_snapshot, i.unavailable, p.published_at
  from public.order_items i
  join public.products p on p.id = i.product_id
  where not p_demo
  union all
  select d.order_id, d.product_id, d.price_paise, d.unavailable, d.listed_at
  from private.demo_order_items d
  where p_demo;
$$;

-- Costs that have been entered (pieces without one are simply absent).
create function private.all_costs(p_demo boolean)
returns table (product_id uuid, cost_paise integer)
language sql
stable
set search_path = ''
as $$
  select c.product_id, c.cost_paise
  from public.product_costs c
  where not p_demo and c.cost_paise is not null
  union all
  select d.product_id, d.cost_paise
  from private.demo_product_costs d
  where p_demo;
$$;

-- When each order first reached packed, shipped and delivered.
create function private.order_milestones(p_demo boolean)
returns table (
  order_id uuid,
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    e.order_id,
    min(e.changed_at) filter (where e.to_status = 'packed'),
    min(e.changed_at) filter (where e.to_status = 'shipped'),
    min(e.changed_at) filter (where e.to_status = 'delivered')
  from public.order_status_events e
  where not p_demo
  group by e.order_id
  union all
  select d.id, d.packed_at, d.shipped_at, d.delivered_at
  from private.demo_orders d
  where p_demo;
$$;

-- Orders that count as sales in [p_from, p_to).
create function private.sale_orders(p_from timestamptz, p_to timestamptz, p_demo boolean)
returns table (
  id uuid,
  user_id uuid,
  customer_email text,
  status public.order_status,
  subtotal_paise integer,
  shipping_paise integer,
  discount_paise integer,
  total_paise integer,
  coupon_code text,
  address jsonb,
  payment_method text,
  created_at timestamptz,
  paid_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select o.*
  from private.all_orders(p_demo) o
  where o.paid_at >= p_from
    and o.paid_at < p_to
    and o.status in ('paid', 'packed', 'shipped', 'delivered');
$$;

-- Price bands sized around the catalogue (median ~₹180). Keys are labelled in the app.
create function private.price_band(p_price_paise integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_price_paise < 15000 then 'under_150'
    when p_price_paise < 30000 then '150_299'
    when p_price_paise < 50000 then '300_499'
    when p_price_paise < 100000 then '500_999'
    else '1000_plus'
  end;
$$;

-- The keys a product falls under for a breakdown dimension: one key, except style, where a piece
-- counts once under each of its tags.
create function private.product_dimension_keys(p public.products, p_dimension text)
returns text[]
language sql
stable
set search_path = ''
as $$
  select case p_dimension
    when 'category' then array[(
      select coalesce(parent.name || ' › ', '') || c.name
      from public.categories c
      left join public.categories parent on parent.id = c.parent_id
      where c.id = p.category_id
    )]
    when 'brand' then array[coalesce(nullif(btrim(p.brand), ''), 'Unbranded')]
    when 'style' then
      case when cardinality(p.style_tags) > 0 then p.style_tags else array['untagged'] end
    -- like_new is a retired grade that the shop shows as Good.
    when 'condition' then
      array[case p.condition when 'like_new' then 'good' else p.condition::text end]
    when 'size' then array[coalesce(nullif(upper(btrim(p.tagged_size)), ''), 'No size')]
    when 'gender' then array[p.gender::text]
    when 'price_band' then array[private.price_band(p.price_paise)]
    when 'drop' then array[coalesce(
      (select d.name from public.drops d where d.id = p.drop_id),
      'Not in a drop'
    )]
  end;
$$;

-- ---------------------------------------------------------------------------
-- Summary KPIs
-- ---------------------------------------------------------------------------

create function private.kpis(p_from timestamptz, p_to timestamptz, p_demo boolean)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with orders as (
    select * from private.all_orders(p_demo)
  ),
  sales as (
    select * from private.sale_orders(p_from, p_to, p_demo)
  ),
  items as (
    select i.*, c.cost_paise
    from private.all_order_items(p_demo) i
    join sales s on s.id = i.order_id
    left join private.all_costs(p_demo) c on c.product_id = i.product_id
  ),
  first_paid as (
    select o.user_id, min(o.paid_at) as first_paid_at
    from orders o
    where o.user_id is not null
      and o.status in ('paid', 'packed', 'shipped', 'delivered', 'refunded')
    group by o.user_id
  ),
  buyers as (
    select distinct s.user_id from sales s where s.user_id is not null
  ),
  checkouts as (
    select o.status, o.paid_at
    from orders o
    where o.created_at >= p_from and o.created_at < p_to
  )
  select jsonb_build_object(
    'orders', (select count(*) from sales),
    'gross_paise', (select coalesce(sum(total_paise), 0) from sales),
    'discount_paise', (select coalesce(sum(discount_paise), 0) from sales),
    'shipping_paise', (select coalesce(sum(shipping_paise), 0) from sales),
    'items_sold', (select count(*) from items where not unavailable),
    'merchandise_paise', (select coalesce(sum(price_paise), 0) from items where not unavailable),
    'unavailable_items', (select count(*) from items where unavailable),
    'unavailable_paise', (select coalesce(sum(price_paise), 0) from items where unavailable),
    'costed_items', (select count(cost_paise) from items where not unavailable),
    'costed_revenue_paise',
      (select coalesce(sum(price_paise), 0) from items where not unavailable and cost_paise is not null),
    'cost_paise', (select coalesce(sum(cost_paise), 0) from items where not unavailable),
    'buyers', (select count(*) from buyers),
    'new_buyers', (
      select count(*) from buyers b join first_paid f using (user_id)
      where f.first_paid_at >= p_from
    ),
    'refunded_orders', (
      select count(*) from orders
      where status = 'refunded' and paid_at >= p_from and paid_at < p_to
    ),
    'refunded_paise', (
      select coalesce(sum(total_paise), 0) from orders
      where status = 'refunded' and paid_at >= p_from and paid_at < p_to
    ),
    'checkouts', (select count(*) from checkouts),
    'checkouts_paid', (select count(*) from checkouts where paid_at is not null)
  );
$$;

-- KPIs for the range and for the period of the same length just before it.
create function public.insights_summary(
  p_from timestamptz,
  p_to timestamptz,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin();
  return jsonb_build_object(
    'current', private.kpis(p_from, p_to, p_demo),
    'previous', private.kpis(p_from - (p_to - p_from), p_from, p_demo)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Sales over time
-- ---------------------------------------------------------------------------

-- One row per day, week (from Monday) or month in the range, empty buckets included.
create function public.insights_timeseries(
  p_from timestamptz,
  p_to timestamptz,
  p_bucket text,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.assert_admin();
  if p_bucket not in ('day', 'week', 'month') then
    raise exception 'unknown bucket %', p_bucket using errcode = '22023';
  end if;
  if p_bucket = 'day' and p_to - p_from > interval '800 days' then
    raise exception 'range too long for daily buckets' using errcode = '22023';
  end if;

  with buckets as (
    select g as bucket
    from generate_series(
      date_trunc(p_bucket, p_from at time zone 'Asia/Kolkata'),
      (p_to at time zone 'Asia/Kolkata') - interval '1 second',
      ('1 ' || p_bucket)::interval
    ) g
  ),
  sales as (
    select s.id, s.total_paise, date_trunc(p_bucket, s.paid_at at time zone 'Asia/Kolkata') as bucket
    from private.sale_orders(p_from, p_to, p_demo) s
  ),
  by_order as (
    select bucket, count(*) as orders, sum(total_paise) as gross_paise
    from sales
    group by bucket
  ),
  by_item as (
    select
      s.bucket,
      count(*) filter (where not i.unavailable) as items,
      coalesce(sum(i.price_paise) filter (where i.unavailable), 0) as unavailable_paise,
      coalesce(sum(i.price_paise - c.cost_paise) filter (where not i.unavailable), 0) as profit_paise
    from sales s
    join private.all_order_items(p_demo) i on i.order_id = s.id
    left join private.all_costs(p_demo) c on c.product_id = i.product_id
    group by s.bucket
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'bucket', to_char(b.bucket, 'YYYY-MM-DD'),
    'orders', coalesce(o.orders, 0),
    'revenue_paise', coalesce(o.gross_paise, 0) - coalesce(i.unavailable_paise, 0),
    'items', coalesce(i.items, 0),
    'profit_paise', coalesce(i.profit_paise, 0)
  ) order by b.bucket), '[]'::jsonb)
  into result
  from buckets b
  left join by_order o using (bucket)
  left join by_item i using (bucket);

  return result;
end;
$$;

-- Orders by weekday (1 = Monday) and hour, India time. Only non-empty cells are returned.
create function public.insights_heatmap(
  p_from timestamptz,
  p_to timestamptz,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.assert_admin();
  select coalesce(jsonb_agg(jsonb_build_object(
    'dow', t.dow, 'hour', t.hour, 'orders', t.orders, 'revenue_paise', t.revenue_paise
  )), '[]'::jsonb)
  into result
  from (
    select
      extract(isodow from s.paid_at at time zone 'Asia/Kolkata')::integer as dow,
      extract(hour from s.paid_at at time zone 'Asia/Kolkata')::integer as hour,
      count(*) as orders,
      sum(s.total_paise) as revenue_paise
    from private.sale_orders(p_from, p_to, p_demo) s
    group by 1, 2
  ) t;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- What sells
-- ---------------------------------------------------------------------------

-- Sales in the range grouped by p_dimension: a product attribute (category, brand, style,
-- condition, size, gender, price_band, drop) or an order attribute (state, city, payment_method).
-- Product attributes also report what's listed right now, for sell-through.
create function public.insights_breakdown(
  p_from timestamptz,
  p_to timestamptz,
  p_dimension text,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  product_dim constant boolean := p_dimension in (
    'category', 'brand', 'style', 'condition', 'size', 'gender', 'price_band', 'drop'
  );
  result jsonb;
begin
  perform private.assert_admin();
  if not product_dim and p_dimension not in ('state', 'city', 'payment_method') then
    raise exception 'unknown dimension %', p_dimension using errcode = '22023';
  end if;

  with sold as (
    select
      s.id as order_id, s.paid_at, s.address, s.payment_method,
      i.price_paise, i.listed_at, c.cost_paise, p
    from private.sale_orders(p_from, p_to, p_demo) s
    join private.all_order_items(p_demo) i on i.order_id = s.id and not i.unavailable
    join public.products p on p.id = i.product_id
    left join private.all_costs(p_demo) c on c.product_id = i.product_id
  ),
  keyed as (
    select sold.*, k.key
    from sold
    cross join lateral unnest(
      case
        when product_dim then private.product_dimension_keys(sold.p, p_dimension)
        when p_dimension = 'state' then
          array[coalesce(initcap(nullif(btrim(sold.address ->> 'state'), '')), 'Unknown')]
        when p_dimension = 'city' then
          array[coalesce(initcap(nullif(btrim(sold.address ->> 'city'), '')), 'Unknown')]
        else array[coalesce(nullif(sold.payment_method, ''), 'unknown')]
      end
    ) as k(key)
  ),
  sales as (
    select
      coalesce(key, 'Unknown') as key,
      count(*) as items_sold,
      count(distinct order_id) as orders,
      sum(price_paise) as revenue_paise,
      count(cost_paise) as costed_items,
      coalesce(sum(price_paise) filter (where cost_paise is not null), 0) as costed_revenue_paise,
      coalesce(sum(cost_paise), 0) as cost_paise,
      avg(extract(epoch from paid_at - listed_at) / 86400)
        filter (where listed_at is not null and paid_at > listed_at) as avg_days_to_sell,
      avg(price_paise::numeric / (p).original_price_paise)
        filter (where (p).original_price_paise is not null) as avg_retail_ratio
    from keyed
    group by 1
  ),
  live as (
    select coalesce(k.key, 'Unknown') as key, count(*) as listed_now
    from public.products p
    cross join lateral unnest(private.product_dimension_keys(p, p_dimension)) as k(key)
    where product_dim and p.status in ('available', 'reserved')
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', key,
    'items_sold', coalesce(s.items_sold, 0),
    'orders', coalesce(s.orders, 0),
    'revenue_paise', coalesce(s.revenue_paise, 0),
    'costed_items', coalesce(s.costed_items, 0),
    'costed_revenue_paise', coalesce(s.costed_revenue_paise, 0),
    'cost_paise', coalesce(s.cost_paise, 0),
    'avg_days_to_sell', round(s.avg_days_to_sell::numeric, 1),
    'avg_retail_ratio', round(s.avg_retail_ratio, 3),
    'listed_now', case when product_dim then coalesce(l.listed_now, 0) end
  ) order by coalesce(s.revenue_paise, 0) desc, coalesce(l.listed_now, 0) desc, key), '[]'::jsonb)
  into result
  from sales s
  full join live l using (key);

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stock on hand
-- ---------------------------------------------------------------------------

-- What's listed right now: value, cost tied up, age, and the pieces that have sat longest.
create function public.insights_inventory(p_demo boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.assert_admin();

  with live as (
    select
      p.id, p.slug, p.title, p.brand, p.price_paise, c.cost_paise,
      greatest(0, floor(extract(epoch from now() - coalesce(p.published_at, p.created_at)) / 86400))::integer
        as days_listed
    from public.products p
    left join private.all_costs(p_demo) c on c.product_id = p.id
    where p.status in ('available', 'reserved')
  )
  select jsonb_build_object(
    'live_count', (select count(*) from live),
    'list_value_paise', (select coalesce(sum(price_paise), 0) from live),
    'costed_count', (select count(cost_paise) from live),
    'cost_paise', (select coalesce(sum(cost_paise), 0) from live),
    'draft_count', (select count(*) from public.products where status = 'draft'),
    'ages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'bucket', bucket, 'count', n, 'value_paise', value_paise
      ) order by bucket), '[]'::jsonb)
      from (
        select
          case
            when days_listed <= 14 then '0_14'
            when days_listed <= 30 then '15_30'
            when days_listed <= 60 then '31_60'
            else '61_plus'
          end as bucket,
          count(*) as n,
          sum(price_paise) as value_paise
        from live
        group by 1
      ) a
    ),
    'oldest', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'title', title, 'brand', brand, 'price_paise', price_paise,
        'days_listed', days_listed, 'image_url', image_url
      ) order by days_listed desc, title), '[]'::jsonb)
      from (
        select
          live.*,
          (
            select pi.url from public.product_images pi
            where pi.product_id = live.id
            order by pi.sort_order
            limit 1
          ) as image_url
        from live
        order by days_listed desc, title
        limit 25
      ) o
    )
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

-- Buyers in the range, how many came back, the top spenders (masked) and where orders ship.
create function public.insights_customers(
  p_from timestamptz,
  p_to timestamptz,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.assert_admin();

  with orders as (
    select * from private.all_orders(p_demo)
  ),
  sales as (
    select * from private.sale_orders(p_from, p_to, p_demo)
  ),
  lifetime as (
    select user_id, count(*) as orders, min(paid_at) as first_paid_at
    from orders
    where user_id is not null and status in ('paid', 'packed', 'shipped', 'delivered', 'refunded')
    group by user_id
  ),
  per_buyer as (
    select
      s.user_id,
      max(s.customer_email) as email,
      count(*) as orders,
      sum(s.total_paise) as spent_paise
    from sales s
    where s.user_id is not null
    group by s.user_id
  ),
  places as (
    select
      coalesce(initcap(nullif(btrim(address ->> 'state'), '')), 'Unknown') as state,
      coalesce(initcap(nullif(btrim(address ->> 'city'), '')), 'Unknown') as city,
      total_paise
    from sales
  )
  select jsonb_build_object(
    'buyers', (select count(*) from per_buyer),
    'new_buyers', (
      select count(*) from per_buyer b join lifetime l using (user_id)
      where l.first_paid_at >= p_from
    ),
    'orders_from_returning', (
      select count(*) from sales s join lifetime l using (user_id)
      where l.first_paid_at < s.paid_at
    ),
    'lifetime_buyers', (select count(*) from lifetime),
    'lifetime_repeat_buyers', (select count(*) from lifetime where orders >= 2),
    'top_buyers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'email', regexp_replace(coalesce(email, 'unknown'), '^(.{1,2})[^@]*(@.*)?$', '\1•••\2'),
        'orders', orders,
        'spent_paise', spent_paise
      ) order by spent_paise desc), '[]'::jsonb)
      from (select * from per_buyer order by spent_paise desc limit 10) t
    ),
    'states', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', state, 'orders', n, 'revenue_paise', revenue_paise
      ) order by n desc, revenue_paise desc), '[]'::jsonb)
      from (
        select state, count(*) as n, sum(total_paise) as revenue_paise
        from places group by state order by n desc, revenue_paise desc limit 10
      ) t
    ),
    'cities', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', city, 'orders', n, 'revenue_paise', revenue_paise
      ) order by n desc, revenue_paise desc), '[]'::jsonb)
      from (
        select city, count(*) as n, sum(total_paise) as revenue_paise
        from places group by city order by n desc, revenue_paise desc limit 10
      ) t
    )
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Checkout funnel
-- ---------------------------------------------------------------------------

-- What happened to the checkouts started in the range.
create function public.insights_funnel(
  p_from timestamptz,
  p_to timestamptz,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.assert_admin();

  with started as (
    select o.id, o.status, o.paid_at
    from private.all_orders(p_demo) o
    where o.created_at >= p_from and o.created_at < p_to
  )
  select jsonb_build_object(
    'started', (select count(*) from started),
    'paid', (
      select count(*) from started
      where status in ('paid', 'packed', 'shipped', 'delivered', 'refunded')
    ),
    'pending', (select count(*) from started where status = 'pending'),
    'abandoned', (select count(*) from started where status = 'cancelled' and paid_at is null),
    'late_payments', (select count(*) from started where status = 'cancelled' and paid_at is not null),
    'refunded', (select count(*) from started where status = 'refunded'),
    'pieces_lost', (
      select count(*) from private.all_order_items(p_demo) i
      join started s on s.id = i.order_id
      where i.unavailable
    )
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Coupons and drops
-- ---------------------------------------------------------------------------

-- Coupons used on sales in the range, and drops that went live in it.
create function public.insights_marketing(
  p_from timestamptz,
  p_to timestamptz,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.assert_admin();

  with sales as (
    select * from private.sale_orders(p_from, p_to, p_demo)
  ),
  all_sales as (
    select * from private.sale_orders('-infinity', 'infinity', p_demo)
  ),
  drop_items as (
    select p.drop_id, i.price_paise, s.paid_at
    from all_sales s
    join private.all_order_items(p_demo) i on i.order_id = s.id and not i.unavailable
    join public.products p on p.id = i.product_id
    where p.drop_id is not null
  )
  select jsonb_build_object(
    'coupons', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', t.code, 'type', c.type, 'value', c.value, 'uses', t.uses,
        'discount_paise', t.discount_paise, 'revenue_paise', t.revenue_paise
      ) order by t.uses desc, t.code), '[]'::jsonb)
      from (
        select
          coupon_code as code,
          count(*) as uses,
          sum(discount_paise) as discount_paise,
          sum(total_paise) as revenue_paise
        from sales
        where coupon_code is not null
        group by coupon_code
      ) t
      left join public.coupons c on c.code = t.code
    ),
    'coupon_orders', (select count(*) from sales where coupon_code is not null),
    'drops', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id,
        'name', d.name,
        'slug', d.slug,
        'go_live_at', d.go_live_at,
        'pieces', (select count(*) from public.products p where p.drop_id = d.id),
        'sold', (select count(*) from drop_items di where di.drop_id = d.id),
        'sold_first_day', (
          select count(*) from drop_items di
          where di.drop_id = d.id and di.paid_at < d.go_live_at + interval '1 day'
        ),
        'sold_first_week', (
          select count(*) from drop_items di
          where di.drop_id = d.id and di.paid_at < d.go_live_at + interval '7 days'
        ),
        'revenue_paise', (
          select coalesce(sum(di.price_paise), 0) from drop_items di where di.drop_id = d.id
        ),
        'notify_signups', (
          select count(*) from public.notify_requests n
          where n.drop_id = d.id and n.confirmed_at is not null
        )
      ) order by d.go_live_at desc), '[]'::jsonb)
      from public.drops d
      where d.is_published and d.go_live_at >= p_from and d.go_live_at < p_to
    )
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fulfilment
-- ---------------------------------------------------------------------------

-- How long orders paid in the range took to pack, ship and arrive (median and slowest 10%, in
-- hours), plus paid orders still not packed after 48 hours, whenever they were paid.
create function public.insights_fulfilment(
  p_from timestamptz,
  p_to timestamptz,
  p_demo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.assert_admin();

  with timed as (
    select
      extract(epoch from m.packed_at - s.paid_at) / 3600 as to_pack,
      extract(epoch from m.shipped_at - s.paid_at) / 3600 as to_ship,
      extract(epoch from m.delivered_at - m.shipped_at) / 3600 as in_transit,
      extract(epoch from m.delivered_at - s.paid_at) / 3600 as to_deliver
    from private.sale_orders(p_from, p_to, p_demo) s
    left join private.order_milestones(p_demo) m on m.order_id = s.id
  )
  select jsonb_build_object(
    'orders', (select count(*) from timed),
    'to_pack', jsonb_build_object(
      'count', count(to_pack),
      'median', round((percentile_cont(0.5) within group (order by to_pack))::numeric, 1),
      'p90', round((percentile_cont(0.9) within group (order by to_pack))::numeric, 1)
    ),
    'to_ship', jsonb_build_object(
      'count', count(to_ship),
      'median', round((percentile_cont(0.5) within group (order by to_ship))::numeric, 1),
      'p90', round((percentile_cont(0.9) within group (order by to_ship))::numeric, 1)
    ),
    'in_transit', jsonb_build_object(
      'count', count(in_transit),
      'median', round((percentile_cont(0.5) within group (order by in_transit))::numeric, 1),
      'p90', round((percentile_cont(0.9) within group (order by in_transit))::numeric, 1)
    ),
    'to_deliver', jsonb_build_object(
      'count', count(to_deliver),
      'median', round((percentile_cont(0.5) within group (order by to_deliver))::numeric, 1),
      'p90', round((percentile_cont(0.9) within group (order by to_deliver))::numeric, 1)
    ),
    'stuck', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'paid_at', o.paid_at, 'total_paise', o.total_paise
      ) order by o.paid_at), '[]'::jsonb)
      from (
        select o.id, o.paid_at, o.total_paise
        from private.all_orders(p_demo) o
        where o.status = 'paid' and o.paid_at < now() - interval '48 hours'
        order by o.paid_at
        limit 20
      ) o
    )
  )
  into result
  from timed;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Demo data
-- ---------------------------------------------------------------------------

-- Regenerates ~6 months of demo sales ending now: growing volume, busier weekends and evenings,
-- repeat buyers, coupons, refunds, abandoned checkouts and a few orders stuck unpacked. Seeded,
-- so the pattern is the same each time; only the dates move.
create function private.seed_insights_demo()
returns void
language plpgsql
volatile
set search_path = ''
as $$
declare
  cities constant text[] := array[
    'Mumbai', 'Maharashtra', 'Pune', 'Maharashtra', 'Bengaluru', 'Karnataka',
    'New Delhi', 'Delhi', 'Gurugram', 'Haryana', 'Hyderabad', 'Telangana',
    'Chennai', 'Tamil Nadu', 'Kolkata', 'West Bengal', 'Ahmedabad', 'Gujarat',
    'Jaipur', 'Rajasthan', 'Lucknow', 'Uttar Pradesh', 'Indore', 'Madhya Pradesh',
    'Kochi', 'Kerala', 'Chandigarh', 'Chandigarh', 'Guwahati', 'Assam'
  ];
  hours constant integer[] := array[
    10, 11, 12, 13, 13, 14, 15, 16, 17, 18, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23
  ];
  methods constant text[] := array[
    'upi', 'upi', 'upi', 'upi', 'upi', 'upi', 'card', 'card', 'netbanking', 'wallet'
  ];
  buyer_count constant integer := 140;
  product_ids uuid[];
  product_prices integer[];
  buyer_ids uuid[];
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  day_start timestamptz;
  days_ago integer;
  order_count integer;
  item_count integer;
  order_no integer;
  idx integer;
  buyer integer;
  city integer;
  pick integer;
  new_order_id uuid;
  created timestamptz;
  paid timestamptz;
  packed timestamptz;
  shipped timestamptz;
  delivered timestamptz;
  new_status public.order_status;
  item_ids uuid[];
  item_prices integer[];
  subtotal integer;
  discount integer;
  coupon text;
begin
  perform setseed(0.42);
  truncate private.demo_order_items, private.demo_orders, private.demo_product_costs;

  select array_agg(id order by id), array_agg(price_paise order by id)
  into product_ids, product_prices
  from public.products
  where status <> 'draft';
  if product_ids is null then
    return;
  end if;

  insert into private.demo_product_costs (product_id, cost_paise)
  select id, round(price_paise * (0.18 + random() * 0.32))::integer
  from public.products
  order by id;

  select array_agg(gen_random_uuid()) into buyer_ids from generate_series(1, buyer_count);

  for days_ago in reverse 179..0 loop
    day_start := today - make_interval(days => days_ago);
    -- Volume grows over the six months; weekends are busier.
    order_count := floor(
      random() * (1.0 + (179 - days_ago) / 55.0)
      + case when extract(isodow from day_start at time zone 'Asia/Kolkata') >= 6 then 1.3 else 0.2 end
    )::integer;

    for order_no in 1..order_count loop
      created := day_start + make_interval(
        hours => hours[1 + floor(random() * array_length(hours, 1))::integer],
        mins => floor(random() * 60)::integer
      );
      continue when created > now();

      -- Low numbers come back more often, so a core of buyers order repeatedly.
      buyer := 1 + floor(power(random(), 1.8) * buyer_count)::integer;
      city := (buyer * 7) % (array_length(cities, 1) / 2);

      item_ids := '{}';
      item_prices := '{}';
      subtotal := 0;
      item_count := case when random() < 0.7 then 1 when random() < 0.75 then 2 else 3 end;
      for pick in 1..item_count loop
        idx := 1 + floor(random() * array_length(product_ids, 1))::integer;
        continue when product_ids[idx] = any (item_ids);
        item_ids := item_ids || product_ids[idx];
        item_prices := item_prices || product_prices[idx];
        subtotal := subtotal + product_prices[idx];
      end loop;

      coupon := case
        when random() < 0.15 then (array['WELCOME10', 'FLAT150', 'DROPNIGHT15'])[1 + floor(random() * 3)::integer]
      end;
      discount := case coupon
        when 'WELCOME10' then round(subtotal * 0.10)::integer
        when 'DROPNIGHT15' then round(subtotal * 0.15)::integer
        when 'FLAT150' then least(15000, subtotal)
        else 0
      end;

      paid := null;
      packed := null;
      shipped := null;
      delivered := null;
      if random() < 0.09 then
        new_status := 'cancelled';
      else
        paid := created + make_interval(mins => 2 + floor(random() * 8)::integer);
        if random() >= 0.03 then
          packed := paid + make_interval(hours => 3 + floor(random() * 36)::integer);
          shipped := packed + make_interval(hours => 10 + floor(random() * 40)::integer);
          delivered := shipped + make_interval(hours => 40 + floor(random() * 110)::integer);
        end if;
        if packed > now() then
          packed := null;
          shipped := null;
          delivered := null;
        elsif shipped > now() then
          shipped := null;
          delivered := null;
        elsif delivered > now() then
          delivered := null;
        end if;
        new_status := case
          when delivered is not null and random() < 0.04 then 'refunded'
          when delivered is not null then 'delivered'
          when shipped is not null then 'shipped'
          when packed is not null then 'packed'
          else 'paid'
        end;
      end if;

      insert into private.demo_orders (
        user_id, customer_email, status, subtotal_paise, shipping_paise, discount_paise,
        total_paise, coupon_code, address, payment_method, created_at, paid_at, packed_at,
        shipped_at, delivered_at
      )
      values (
        buyer_ids[buyer],
        format('buyer%s@demo.example', buyer),
        new_status,
        subtotal,
        case when subtotal >= 99900 then 0 else 7900 end,
        discount,
        subtotal + case when subtotal >= 99900 then 0 else 7900 end - discount,
        coupon,
        jsonb_build_object(
          'name', format('Demo buyer %s', buyer),
          'city', cities[city * 2 + 1],
          'state', cities[city * 2 + 2]
        ),
        case when paid is not null then methods[1 + floor(random() * array_length(methods, 1))::integer] end,
        created,
        paid,
        packed,
        shipped,
        delivered
      )
      returning id into new_order_id;

      insert into private.demo_order_items (order_id, product_id, price_paise, unavailable, listed_at)
      select
        new_order_id,
        item_ids[i],
        item_prices[i],
        paid is not null and random() < 0.02,
        created - make_interval(days => 1 + floor(power(random(), 1.6) * 50)::integer)
      from generate_subscripts(item_ids, 1) as i;
    end loop;
  end loop;
end;
$$;

-- Makes sure demo data exists and ends today; regenerates it when it's a day old.
create function public.insights_prepare_demo()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin();
  -- Two admins opening demo mode at once regenerate it once, not twice.
  perform pg_advisory_xact_lock(hashtext('insights_prepare_demo'));
  if not exists (
    select 1 from private.demo_orders where created_at > now() - interval '1 day'
  ) then
    perform private.seed_insights_demo();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function
  public.insights_summary(timestamptz, timestamptz, boolean),
  public.insights_timeseries(timestamptz, timestamptz, text, boolean),
  public.insights_heatmap(timestamptz, timestamptz, boolean),
  public.insights_breakdown(timestamptz, timestamptz, text, boolean),
  public.insights_inventory(boolean),
  public.insights_customers(timestamptz, timestamptz, boolean),
  public.insights_funnel(timestamptz, timestamptz, boolean),
  public.insights_marketing(timestamptz, timestamptz, boolean),
  public.insights_fulfilment(timestamptz, timestamptz, boolean),
  public.insights_prepare_demo()
from public, anon;

grant execute on function
  public.insights_summary(timestamptz, timestamptz, boolean),
  public.insights_timeseries(timestamptz, timestamptz, text, boolean),
  public.insights_heatmap(timestamptz, timestamptz, boolean),
  public.insights_breakdown(timestamptz, timestamptz, text, boolean),
  public.insights_inventory(boolean),
  public.insights_customers(timestamptz, timestamptz, boolean),
  public.insights_funnel(timestamptz, timestamptz, boolean),
  public.insights_marketing(timestamptz, timestamptz, boolean),
  public.insights_fulfilment(timestamptz, timestamptz, boolean),
  public.insights_prepare_demo()
to authenticated;

-- The status-history trigger function from the previous migration only ever runs as a trigger
-- (privileges aren't checked when a trigger fires), so nobody needs to call it through the API.
revoke execute on function public.log_order_status_change() from public, anon, authenticated;
