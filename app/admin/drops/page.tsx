import type { Metadata } from "next";
import { DropForm } from "@/components/admin/CatalogueForms";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ListEditor, editorParams } from "@/components/admin/ListEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { deleteDrop } from "@/lib/actions/admin/catalogue";
import { requireAdmin } from "@/lib/server/auth";
import { formatIstDateTime } from "@/lib/utils/datetime";

export const metadata: Metadata = { title: "Drops" };

export default async function AdminDropsPage({ searchParams }: PageProps<"/admin/drops">) {
  const { supabase } = await requireAdmin();
  const { edit, isNew, notice } = editorParams(await searchParams);
  const { data: drops, error } = await supabase
    .from("drops")
    .select("id, name, slug, description, banner_url, go_live_at, is_published, products(count)")
    .order("go_live_at", { ascending: false });
  if (error) throw new Error(`drops: ${error.message}`);

  const now = new Date().toISOString();
  const selected = drops.find((d) => d.id === edit) ?? null;

  return (
    <ListEditor
      title="Drops"
      noun="drop"
      basePath="/admin/drops"
      notice={notice}
      emptyText="No drops yet."
      selected={selected?.id ?? null}
      rows={drops.map((d) => ({
        key: d.id,
        href: `/admin/drops?edit=${d.id}`,
        title: d.name,
        meta: `${formatIstDateTime(d.go_live_at)} · ${d.products[0]?.count ?? 0} pieces`,
        aside: !d.is_published ? (
          <StatusBadge label="Unpublished" />
        ) : d.go_live_at > now ? (
          <StatusBadge label="Upcoming" tone="warn" />
        ) : (
          <StatusBadge label="Live" tone="good" />
        ),
      }))}
      editorTitle={selected ? `Edit ${selected.name}` : "New drop"}
      editor={
        selected || isNew ? (
          <>
            <DropForm key={selected?.id ?? "new"} drop={selected} />
            {selected ? (
              <div className="mt-6 border-t border-border pt-4">
                <DeleteButton action={deleteDrop.bind(null, selected.id)} label="Delete drop" />
              </div>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
