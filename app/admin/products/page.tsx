import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, productStatusBadge } from "@/components/admin/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";
import { Input, inputVariants } from "@/components/ui/Input";
import { requireAdmin } from "@/lib/server/auth";
import { ADMIN_PAGE_SIZE, getAdminProducts, type ProductStatus } from "@/lib/server/admin";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Products" };

const statuses: ProductStatus[] = ["draft", "available", "reserved", "sold"];

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = one(params.q).slice(0, 80);
  const statusParam = one(params.status);
  const status = (statuses as string[]).includes(statusParam)
    ? (statusParam as ProductStatus)
    : null;
  const page = Math.max(1, Math.min(200, Number(one(params.page)) || 1));
  const { products, total } = await getAdminProducts(supabase, { q, status, page });
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const pageHref = (n: number) =>
    `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(n) })}`;

  return (
    <>
      <PageHeader
        title="Products"
        actions={<ButtonLink href="/admin/products/new">New product</ButtonLink>}
      >
        {one(params.deleted) ? (
          <p role="status" className="mt-4 rounded-md bg-surface p-3 text-sm">
            Product deleted.
          </p>
        ) : null}
      </PageHeader>

      <form className="mb-6 flex flex-wrap gap-2" role="search" aria-label="Filter products">
        <label htmlFor="products-q" className="sr-only">
          Search products
        </label>
        <Input
          id="products-q"
          name="q"
          defaultValue={q}
          placeholder="Title, brand or URL"
          className="max-w-xs"
        />
        <label htmlFor="products-status" className="sr-only">
          Status
        </label>
        <select
          id="products-status"
          name="status"
          defaultValue={status ?? ""}
          className={inputVariants({ className: "w-auto" })}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {productStatusBadge[s].label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <p className="mb-2 text-sm text-muted">
        {total} product{total === 1 ? "" : "s"}
      </p>
      {products.length === 0 ? (
        <p className="rounded-lg border border-border p-8 text-center text-muted">
          No products match.{" "}
          <Link href="/admin/products" className="text-primary underline">
            Clear filters
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {products.map((p) => {
            const image = p.product_images[0];
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface"
                >
                  <div className="relative aspect-3/4 w-12 shrink-0 overflow-hidden rounded-sm bg-surface">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="truncate text-sm text-muted">
                      {[p.brand, p.category?.name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="hidden text-right text-xs text-muted sm:block">
                    Updated {formatIstDateTime(p.updated_at)}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(p.price_paise)}</p>
                    <StatusBadge {...productStatusBadge[p.status]} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-semibold text-primary underline">
              Previous
            </Link>
          ) : null}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="font-semibold text-primary underline">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
