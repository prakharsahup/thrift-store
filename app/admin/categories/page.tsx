import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/CatalogueForms";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ListEditor, editorParams } from "@/components/admin/ListEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { deleteCategory } from "@/lib/actions/admin/catalogue";
import { requireAdmin } from "@/lib/server/auth";
import { getCategoryOptions } from "@/lib/server/admin";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: PageProps<"/admin/categories">) {
  const { supabase } = await requireAdmin();
  const { edit, isNew, notice } = editorParams(await searchParams);
  const categories = await getCategoryOptions(supabase);
  const selected = categories.find((c) => c.id === edit) ?? null;
  // Two levels only (Men › Jackets): parents are top-level categories.
  const parents = categories.filter((c) => c.parent_id === null);

  return (
    <ListEditor
      title="Categories"
      noun="category"
      basePath="/admin/categories"
      notice={notice}
      emptyText="No categories yet."
      selected={selected?.id ?? null}
      rows={categories.map((c) => ({
        key: c.id,
        href: `/admin/categories?edit=${c.id}`,
        title: c.label,
        meta: `/c/${c.slug}`,
        aside: <StatusBadge label={c.gender} />,
      }))}
      editorTitle={selected ? `Edit ${selected.label}` : "New category"}
      editor={
        selected || isNew ? (
          <>
            <CategoryForm key={selected?.id ?? "new"} category={selected} parents={parents} />
            {selected ? (
              <div className="mt-6 border-t border-border pt-4">
                <DeleteButton
                  action={deleteCategory.bind(null, selected.id)}
                  label="Delete category"
                />
              </div>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
