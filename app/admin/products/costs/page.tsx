import type { Metadata } from "next";
import Link from "next/link";
import { CostEntryForm } from "@/components/admin/CostEntryForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAdmin } from "@/lib/server/auth";
import { ADMIN_PAGE_SIZE, getProductsMissingCost } from "@/lib/server/admin";

export const metadata: Metadata = { title: "Enter costs" };

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// Fill in what each piece cost to acquire, many at a time, so Insights can show profit.
export default async function ProductCostsPage({
  searchParams,
}: PageProps<"/admin/products/costs">) {
  const { supabase } = await requireAdmin();
  const page = Math.max(1, Math.min(200, Number(one((await searchParams).page)) || 1));
  const { products, total, withCost } = await getProductsMissingCost(supabase, page);
  const missing = total - withCost;
  const pages = Math.max(1, Math.ceil(missing / ADMIN_PAGE_SIZE));
  const percent = total ? Math.round((withCost / total) * 100) : 0;

  return (
    <>
      <PageHeader title="Enter costs" crumbs={[{ label: "Products", href: "/admin/products" }]}>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          What you paid for each piece. It stays private and is only used to work out profit. Sold
          pieces are listed first. Leave a row blank to skip it.
        </p>
        <div className="mt-4 max-w-md">
          <p className="text-sm font-semibold">
            {withCost} of {total} pieces have a cost ({percent}%)
          </p>
          <div
            role="progressbar"
            aria-label="Pieces with a cost"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface"
          >
            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </PageHeader>

      {products.length ? (
        <CostEntryForm products={products} />
      ) : (
        <p className="rounded-lg border border-border p-8 text-center text-muted">
          {missing ? (
            <>
              Nothing on this page.{" "}
              <Link href="/admin/products/costs" className="text-primary underline">
                Back to the first page
              </Link>
            </>
          ) : (
            "Every piece has a cost. Nice."
          )}
        </p>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={`/admin/products/costs?page=${page - 1}`}
              className="font-semibold text-primary underline"
            >
              Previous
            </Link>
          ) : null}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              href={`/admin/products/costs?page=${page + 1}`}
              className="font-semibold text-primary underline"
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
