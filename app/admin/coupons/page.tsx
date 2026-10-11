import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/CatalogueForms";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ListEditor, editorParams } from "@/components/admin/ListEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { deleteCoupon } from "@/lib/actions/admin/catalogue";
import { requireAdmin } from "@/lib/server/auth";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { formatINR } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage({ searchParams }: PageProps<"/admin/coupons">) {
  const { supabase } = await requireAdmin();
  const { edit, isNew, notice } = editorParams(await searchParams);
  const { data: coupons, error } = await supabase
    .from("coupons")
    .select("code, type, value, min_order_paise, max_uses, used_count, expires_at, active")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`coupons: ${error.message}`);

  const now = new Date().toISOString();
  const selected = coupons.find((c) => c.code === edit) ?? null;
  const describe = (c: (typeof coupons)[number]) =>
    [
      c.type === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off`,
      c.min_order_paise > 0 ? `over ${formatINR(c.min_order_paise)}` : null,
      `used ${c.used_count}${c.max_uses ? `/${c.max_uses}` : ""}`,
      c.expires_at ? `until ${formatIstDateTime(c.expires_at)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <ListEditor
      title="Coupons"
      noun="coupon"
      basePath="/admin/coupons"
      notice={notice}
      emptyText="No coupons yet."
      selected={selected?.code ?? null}
      rows={coupons.map((c) => ({
        key: c.code,
        href: `/admin/coupons?edit=${c.code}`,
        title: c.code,
        meta: describe(c),
        aside: !c.active ? (
          <StatusBadge label="Off" />
        ) : c.expires_at && c.expires_at <= now ? (
          <StatusBadge label="Expired" tone="muted" />
        ) : c.max_uses !== null && c.used_count >= c.max_uses ? (
          <StatusBadge label="Used up" tone="muted" />
        ) : (
          <StatusBadge label="Active" tone="good" />
        ),
      }))}
      editorTitle={selected ? `Edit ${selected.code}` : "New coupon"}
      editor={
        selected || isNew ? (
          <>
            <CouponForm key={selected?.code ?? "new"} coupon={selected} />
            {selected ? (
              <div className="mt-6 border-t border-border pt-4">
                <DeleteButton
                  action={deleteCoupon.bind(null, selected.code)}
                  label="Delete coupon"
                />
              </div>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
