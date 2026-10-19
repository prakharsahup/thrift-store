import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ImageManager } from "@/components/admin/ImageManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductActions } from "@/components/admin/ProductActions";
import { ProductForm } from "@/components/admin/ProductForm";
import { StatusBadge, productStatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/server/auth";
import { getAdminProduct, getCategoryOptions, getDropOptions } from "@/lib/server/admin";
import { formatIstDateTime } from "@/lib/utils/datetime";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireAdmin();
  const [product, categories, drops, query] = await Promise.all([
    getAdminProduct(supabase, id),
    getCategoryOptions(supabase),
    getDropOptions(supabase),
    searchParams,
  ]);
  if (!product) notFound();

  const notice = query.cost_failed
    ? "Product created, but its cost didn't save. Enter it again below."
    : query.created
      ? "Product created. Now add its photos."
      : query.duplicated
        ? "Copied into a new draft. Change what's different, add photos, then publish."
        : null;
  const holdNote = product.hold
    ? `${product.hold.holder_email ?? "A shopper"} is checking out with this piece until ${formatIstDateTime(product.hold.reserved_until)} IST. Status changes are paused until the hold ends or the order completes.`
    : undefined;

  return (
    <>
      <PageHeader
        title={product.title}
        crumbs={[{ label: "Products", href: "/admin/products" }]}
        actions={<ProductActions productId={product.id} />}
      >
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
          <StatusBadge {...productStatusBadge[product.status]} />
          {product.status !== "draft" ? (
            <Link href={`/p/${product.slug}`} className="text-primary underline" target="_blank">
              View in shop
            </Link>
          ) : null}
          {product.sold_at ? <span>Sold {formatIstDateTime(product.sold_at)}</span> : null}
        </div>
        {notice ? (
          <p role="status" className="mt-4 rounded-md bg-surface p-3 text-sm">
            {notice}
          </p>
        ) : null}
      </PageHeader>

      <div className="space-y-12">
        <ImageManager
          productId={product.id}
          productTitle={product.title}
          images={product.product_images.map(({ id, url, alt }) => ({ id, url, alt }))}
        />
        <ProductForm
          product={{
            ...product,
            measurements: z.record(z.string(), z.number()).catch({}).parse(product.measurements),
          }}
          categories={categories}
          drops={drops}
          holdNote={holdNote}
        />
      </div>
    </>
  );
}
