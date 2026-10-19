"use client";

import { FormFooter } from "./FormFooter";
import { StatusBadge, productStatusBadge } from "./StatusBadge";
import { useAdminForm } from "./useAdminForm";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Input } from "@/components/ui/Input";
import { saveProductCosts } from "@/lib/actions/admin/products";
import { formatMoney } from "@/lib/utils/money";

type Props = {
  products: {
    id: string;
    title: string;
    brand: string | null;
    status: keyof typeof productStatusBadge;
    price_paise: number;
    source: string | null;
    image_url: string | null;
    image_alt: string | null;
  }[];
};

// One row per piece with a cost and a source field, saved together by saveProductCosts. Rows left
// blank are skipped. Saved pieces drop off the list when the page refreshes.
export function CostEntryForm({ products }: Props) {
  const { state, pending, formProps, errors: e } = useAdminForm(saveProductCosts);

  return (
    <form {...formProps}>
      <div
        aria-hidden
        className="hidden gap-3 px-4 pb-2 text-xs font-semibold text-muted md:grid md:grid-cols-[1fr_9rem_14rem]"
      >
        <span>Piece</span>
        <span>Cost (₹)</span>
        <span>Sourced from</span>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {products.map((p) => {
          const costError = e[`cost_${p.id}`];
          const sourceError = e[`cost_source_${p.id}`];
          return (
            <li key={p.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_9rem_14rem]">
              <input type="hidden" name="product_id" value={p.id} />
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative aspect-3/4 w-10 shrink-0 overflow-hidden rounded-sm bg-surface">
                  <ImageWithFallback
                    src={p.image_url ?? undefined}
                    alt={p.image_alt ?? ""}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    {p.brand ? <span>{p.brand}</span> : null}
                    <span>Sells at {formatMoney(p.price_paise)}</span>
                    <StatusBadge {...productStatusBadge[p.status]} />
                  </p>
                </div>
              </div>
              <div>
                <label
                  htmlFor={`cost-${p.id}`}
                  className="mb-1 block text-xs font-semibold md:sr-only"
                >
                  Cost (₹)<span className="sr-only"> for {p.title}</span>
                </label>
                <Input
                  id={`cost-${p.id}`}
                  name={`cost_${p.id}`}
                  inputMode="decimal"
                  placeholder="Cost ₹"
                  aria-invalid={costError ? true : undefined}
                  aria-describedby={costError ? `cost-${p.id}-error` : undefined}
                />
                {costError ? (
                  <p id={`cost-${p.id}-error`} className="mt-1 text-xs text-sale">
                    {costError}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor={`source-${p.id}`}
                  className="mb-1 block text-xs font-semibold md:sr-only"
                >
                  Sourced from<span className="sr-only"> for {p.title}</span>
                </label>
                <Input
                  id={`source-${p.id}`}
                  name={`cost_source_${p.id}`}
                  defaultValue={p.source ?? ""}
                  placeholder="Sourced from"
                  aria-invalid={sourceError ? true : undefined}
                  aria-describedby={sourceError ? `source-${p.id}-error` : undefined}
                />
                {sourceError ? (
                  <p id={`source-${p.id}-error`} className="mt-1 text-xs text-sale">
                    {sourceError}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-6">
        <FormFooter state={state} pending={pending} submitLabel="Save costs" />
      </div>
    </form>
  );
}
