-- Admin (CLAUDE.md §8, Phase 8).
-- Images for products, drops, categories and banners live in one public bucket. Anyone can view
-- them (they're on the storefront); only admins can upload, replace or delete. Admin pages upload
-- straight from the browser with the admin's own session, so these policies are the gate.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogue',
  'catalogue',
  true,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Catalogue images: admins upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogue' and (select public.is_admin()));

create policy "Catalogue images: admins replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'catalogue' and (select public.is_admin()))
  with check (bucket_id = 'catalogue' and (select public.is_admin()));

create policy "Catalogue images: admins delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'catalogue' and (select public.is_admin()));

-- Listing objects (needed for upsert/remove through the API) is admin-only too; public reads of
-- the files themselves go through the public bucket URL and need no policy.
create policy "Catalogue images: admins list"
  on storage.objects for select to authenticated
  using (bucket_id = 'catalogue' and (select public.is_admin()));

-- The admin product editor needs to see who holds a piece (the column is hidden from the API
-- since the review fixes). Admins read it through this function instead of the column.
create function public.admin_product_holds(product_ids uuid[])
returns table (product_id uuid, reserved_until timestamptz, reserved_order_id uuid, holder_email text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.reserved_until, p.reserved_order_id, u.email::text
  from public.products p
  left join auth.users u on u.id = p.reserved_by
  where p.id = any (admin_product_holds.product_ids)
    and p.status = 'reserved'
    and (select public.is_admin());
$$;

revoke execute on function public.admin_product_holds(uuid[]) from public, anon;
grant execute on function public.admin_product_holds(uuid[]) to authenticated;
