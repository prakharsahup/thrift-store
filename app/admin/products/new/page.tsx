import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/server/auth";
import { getCategoryOptions, getDropOptions } from "@/lib/server/admin";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const [categories, drops] = await Promise.all([
    getCategoryOptions(supabase),
    getDropOptions(supabase),
  ]);
  return (
    <>
      <PageHeader title="New product" crumbs={[{ label: "Products", href: "/admin/products" }]}>
        <p className="mt-2 text-sm text-muted">Save the details first, then add photos.</p>
      </PageHeader>
      <ProductForm product={null} categories={categories} drops={drops} />
    </>
  );
}
