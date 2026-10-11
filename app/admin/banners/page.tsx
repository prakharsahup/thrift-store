import type { Metadata } from "next";
import { BannerForm } from "@/components/admin/CatalogueForms";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ListEditor, editorParams } from "@/components/admin/ListEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { deleteBanner } from "@/lib/actions/admin/catalogue";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Banners" };

export default async function AdminBannersPage({ searchParams }: PageProps<"/admin/banners">) {
  const { supabase } = await requireAdmin();
  const { edit, isNew, notice } = editorParams(await searchParams);
  const { data: banners, error } = await supabase
    .from("banners")
    .select(
      "id, title, subtitle, image_url, image_alt, link_url, cta_label, sort_order, is_active, starts_at, ends_at",
    )
    .order("sort_order");
  if (error) throw new Error(`banners: ${error.message}`);

  const now = new Date().toISOString();
  const selected = banners.find((b) => b.id === edit) ?? null;
  const showing = (b: (typeof banners)[number]) =>
    b.is_active && (!b.starts_at || b.starts_at <= now) && (!b.ends_at || b.ends_at > now);

  return (
    <ListEditor
      title="Home banners"
      noun="banner"
      basePath="/admin/banners"
      notice={notice}
      emptyText="No banners yet. The home page hero needs at least one."
      selected={selected?.id ?? null}
      rows={banners.map((b) => ({
        key: b.id,
        href: `/admin/banners?edit=${b.id}`,
        title: b.title,
        meta: `Position ${b.sort_order} · links to ${b.link_url}`,
        aside: showing(b) ? (
          <StatusBadge label="Showing" tone="good" />
        ) : (
          <StatusBadge label="Hidden" />
        ),
      }))}
      editorTitle={selected ? `Edit "${selected.title}"` : "New banner"}
      editor={
        selected || isNew ? (
          <>
            <BannerForm key={selected?.id ?? "new"} banner={selected} />
            {selected ? (
              <div className="mt-6 border-t border-border pt-4">
                <DeleteButton action={deleteBanner.bind(null, selected.id)} label="Delete banner" />
              </div>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
