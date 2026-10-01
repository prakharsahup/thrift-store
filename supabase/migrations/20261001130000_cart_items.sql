-- Signed-in carts (CLAUDE.md §8: "Guest cart lives in zustand + localStorage and merges into the
-- account on login"). One row per product a user has in their cart. Adding to the cart does NOT
-- reserve anything — reservations only happen at checkout (reserve_products).

create table public.cart_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index cart_items_product_id_idx on public.cart_items (product_id);

alter table public.cart_items enable row level security;

create policy "Cart items: users read their own, admins read all"
  on public.cart_items for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Only products the user can see (published, in a live drop) can be added.
create policy "Cart items: users add visible products"
  on public.cart_items for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = product_id)
  );

create policy "Cart items: users remove their own"
  on public.cart_items for delete to authenticated
  using (user_id = (select auth.uid()));

-- Keep carts small: a thrift cart is a handful of one-off pieces.
create function public.limit_cart_size()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.cart_items where user_id = new.user_id) >= 30 then
    raise exception 'Your cart is full (30 pieces max).' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger cart_items_limit
  before insert on public.cart_items
  for each row execute function public.limit_cart_size();
