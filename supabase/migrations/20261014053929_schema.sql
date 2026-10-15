-- Core schema for the thrift store (CLAUDE.md §4 and §7).
-- Every product is ONE physical item: no variants, no stock counts. Money is integer paise.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.gender as enum ('men', 'women', 'unisex');
create type public.user_role as enum ('customer', 'admin');
create type public.product_condition as enum ('new_with_tags', 'like_new', 'good', 'fair');
create type public.product_status as enum ('draft', 'available', 'reserved', 'sold');
create type public.order_status as enum (
  'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'
);
create type public.coupon_type as enum ('percent', 'flat');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Lowercase words joined by single hyphens: "men-t-shirts", "faded-denim-jacket-7f3a".
create function public.is_slug(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~ '^[a-z0-9]+(-[a-z0-9]+)*$';
$$;

-- Flat garment measurements in cm, e.g. {"chest": 56, "length": 70}. Only known keys, positive numbers.
create function public.measurements_are_valid(m jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(m) = 'object'
    and not exists (
      select 1
      from jsonb_each(m) as e(key, value)
      where e.key not in ('chest', 'length', 'shoulder', 'sleeve', 'waist', 'hip', 'inseam')
        or jsonb_typeof(e.value) <> 'number'
        or (e.value #>> '{}')::numeric <= 0
        or (e.value #>> '{}')::numeric > 300
    );
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (phone ~ '^\+?[0-9]{10,15}$'),
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'customer | admin. Users can never change this themselves (column privileges in the RLS migration).';

-- Create a profile whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (public.is_slug(slug)),
  parent_id uuid references public.categories (id) on delete restrict,
  gender public.gender not null,
  image_url text,
  sort_order integer not null default 0,
  check (parent_id is distinct from id)
);

create index categories_parent_id_idx on public.categories (parent_id);

create table public.drops (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (public.is_slug(slug)),
  description text not null default '',
  banner_url text,
  go_live_at timestamptz not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Full-text search document. Declared immutable so it can feed a generated column
-- (array_to_string is only "stable" in general, but is immutable for text[]).
create function public.product_search_document(
  title text, brand text, style_tags text[], description text
)
returns tsvector
language sql
immutable
set search_path = ''
as $$
  select
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(brand, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(array_to_string(style_tags, ' '), '')), 'B')
    || setweight(to_tsvector('english', coalesce(description, '')), 'C');
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.is_slug(slug)),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  brand text check (char_length(brand) <= 80),
  category_id uuid not null references public.categories (id) on delete restrict,
  drop_id uuid references public.drops (id) on delete set null,
  gender public.gender not null,
  tagged_size text check (char_length(tagged_size) <= 20),
  condition public.product_condition not null,
  measurements jsonb not null default '{}'::jsonb check (public.measurements_are_valid(measurements)),
  flaws text,
  style_tags text[] not null default '{}',
  price_paise integer not null check (price_paise > 0),
  original_price_paise integer check (original_price_paise > price_paise),
  status public.product_status not null default 'draft',
  reserved_until timestamptz,
  reserved_by uuid references auth.users (id) on delete set null,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    public.product_search_document(title, brand, style_tags, description)
  ) stored,

  -- A reservation always has an expiry; nothing else carries reservation data.
  constraint products_reservation_consistent check (
    (status = 'reserved' and reserved_until is not null)
    or (status <> 'reserved' and reserved_until is null and reserved_by is null)
  ),
  constraint products_sold_at_consistent check ((status = 'sold') = (sold_at is not null)),
  constraint products_style_tags_lowercase check (style_tags = lower(style_tags::text)::text[])
);

comment on column public.products.measurements is
  'Flat measurements in cm. Keys: chest, length, shoulder, sleeve, waist, hip, inseam.';
comment on column public.products.reserved_until is
  'Checkout hold (15 min). Expired holds are released by cron, and read as available meanwhile.';

create index products_listing_idx on public.products (status, published_at desc);
create index products_category_id_idx on public.products (category_id);
create index products_drop_id_idx on public.products (drop_id);
create index products_gender_idx on public.products (gender);
create index products_price_idx on public.products (price_paise);
create index products_brand_idx on public.products (lower(brand));
create index products_style_tags_idx on public.products using gin (style_tags);
create index products_search_idx on public.products using gin (search);
create index products_reserved_until_idx on public.products (reserved_until)
  where status = 'reserved';

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- published_at is stamped the first time a product leaves draft.
create function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'draft' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger products_stamp_published_at
  before insert or update of status on public.products
  for each row execute function public.stamp_published_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0
);

create index product_images_product_id_idx on public.product_images (product_id, sort_order);

-- Home hero carousel (CLAUDE.md §8: "admin-managed banners").
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  subtitle text,
  image_url text not null,
  image_alt text not null default '',
  link_url text not null,
  cta_label text not null default 'Shop now',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1 text not null check (char_length(line1) between 1 and 200),
  line2 text check (char_length(line2) <= 200),
  city text not null check (char_length(city) between 1 and 80),
  state text not null check (char_length(state) between 1 and 80),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

create table public.wishlists (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- "Watch" emails look up everyone who saved a product that came back.
create index wishlists_product_id_idx on public.wishlists (product_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.coupons (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  type public.coupon_type not null,
  value integer not null check (value > 0),
  min_order_paise integer not null default 0 check (min_order_paise >= 0),
  max_uses integer check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (type <> 'percent' or value <= 100)
);

comment on column public.coupons.value is 'percent: 1–100. flat: discount in paise.';

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal_paise integer not null check (subtotal_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  coupon_code text references public.coupons (code) on delete set null,
  address jsonb not null check (jsonb_typeof(address) = 'object'),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  payment_method text,
  tracking_url text check (tracking_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  check (total_paise = subtotal_paise + shipping_paise - discount_paise),
  check ((status = 'pending') or paid_at is not null or status = 'cancelled')
);

comment on column public.orders.address is 'Snapshot of the shipping address at checkout.';

create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  title_snapshot text not null,
  price_paise_snapshot integer not null check (price_paise_snapshot > 0),
  image_snapshot text,
  primary key (order_id, product_id)
);

create index order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- Notify-me (drops going live, sold items coming back)
-- ---------------------------------------------------------------------------

create table public.notify_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and email = lower(email)),
  drop_id uuid references public.drops (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  check (num_nonnulls(drop_id, product_id) = 1)
);

create unique index notify_requests_drop_unique on public.notify_requests (email, drop_id)
  where drop_id is not null;
create unique index notify_requests_product_unique on public.notify_requests (email, product_id)
  where product_id is not null;
