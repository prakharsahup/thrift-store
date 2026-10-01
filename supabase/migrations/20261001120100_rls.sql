-- Row Level Security for every table (CLAUDE.md §7).
--   * The public reads published, non-draft products in live drops, published drops, and the catalogue.
--   * Users read/write only their own addresses and wishlist, and read only their own orders.
--   * Admins (profiles.role = 'admin') have full access through is_admin().
--   * Orders, reservations and payments are written only by server code (service role) through the
--     functions in the next migration — clients can never insert an order or set a price.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- security definer: reads profiles without recursing through profiles' own RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- A product with no drop is always live; a drop's products appear once it's published and live.
create function public.drop_is_live(drop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select drop_is_live.drop_id is null
    or exists (
      select 1 from public.drops d
      where d.id = drop_is_live.drop_id and d.is_published and d.go_live_at <= now()
    );
$$;

-- "Lazy release on read": an expired hold reads as available before cron gets to it.
-- Exposed to the API as a computed column: .select("*, effective_status").
create function public.effective_status(p public.products)
returns public.product_status
language sql
stable
set search_path = ''
as $$
  select case
    when p.status = 'reserved' and p.reserved_until <= now() then 'available'::public.product_status
    else p.status
  end;
$$;

-- What listings show: everything public except items sold more than 7 days ago. Those drop out of
-- listings but stay readable through `products`, so their URL never 404s (CLAUDE.md §4).
create view public.listed_products
with (security_invoker = true)
as
select p.*, public.effective_status(p) as effective_status
from public.products p
where p.status <> 'draft'
  and (p.status <> 'sold' or p.sold_at > now() - interval '7 days');

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.drops enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.banners enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notify_requests enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create policy "Profiles: users read their own, admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Profiles: users update their own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- RLS can't limit columns, so privileges do: through the API, nobody can change `role` (not even
-- admins — promote someone with SQL or the service role). Rows are created by handle_new_user().
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create policy "Categories: anyone can read"
  on public.categories for select to anon, authenticated
  using (true);

create policy "Categories: admins manage"
  on public.categories for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Drops: anyone can read published drops"
  on public.drops for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "Drops: admins manage"
  on public.drops for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Products: anyone can read published products in live drops"
  on public.products for select to anon, authenticated
  using (
    (status <> 'draft' and public.drop_is_live(drop_id))
    or (select public.is_admin())
  );

create policy "Products: admins manage"
  on public.products for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Images follow their product: the subquery is itself filtered by the products policy above.
create policy "Product images: readable when the product is"
  on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

create policy "Product images: admins manage"
  on public.product_images for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Banners: anyone can read active banners"
  on public.banners for select to anon, authenticated
  using (
    (
      is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
    )
    or (select public.is_admin())
  );

create policy "Banners: admins manage"
  on public.banners for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Customer data
-- ---------------------------------------------------------------------------

create policy "Addresses: users manage their own"
  on public.addresses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Addresses: admins read"
  on public.addresses for select to authenticated
  using ((select public.is_admin()));

create policy "Wishlists: users read their own"
  on public.wishlists for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Wishlists: users add visible products"
  on public.wishlists for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = product_id)
  );

create policy "Wishlists: users remove their own"
  on public.wishlists for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Orders and coupons (written by the server only)
-- ---------------------------------------------------------------------------

-- No public policy: codes can't be listed or guessed through the API. Checkout validates them
-- on the server.
create policy "Coupons: admins manage"
  on public.coupons for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Orders: users read their own, admins read all"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Orders: admins update (status, tracking)"
  on public.orders for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Order items: readable with their order"
  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- ---------------------------------------------------------------------------
-- Notify-me
-- ---------------------------------------------------------------------------

-- Anyone may sign up for a published drop or a visible product, but can't read the list back.
create policy "Notify requests: anyone can sign up"
  on public.notify_requests for insert to anon, authenticated
  with check (
    notified_at is null
    and (
      drop_id is null
      or exists (select 1 from public.drops d where d.id = drop_id and d.is_published)
    )
    and (product_id is null or exists (select 1 from public.products p where p.id = product_id))
  );

create policy "Notify requests: admins manage"
  on public.notify_requests for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
