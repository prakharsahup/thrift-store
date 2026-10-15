"use client";

import { SelectField, TextAreaField, TextField } from "./FormField";
import { FormFooter } from "./FormFooter";
import { useAdminForm } from "./useAdminForm";
import { saveProduct } from "@/lib/actions/admin/products";
import { conditions } from "@/lib/config/conditions";
import { measurementKeys } from "@/lib/validators/admin";

export type ProductFormValues = {
  id: string;
  slug: string;
  title: string;
  description: string;
  brand: string | null;
  category_id: string;
  drop_id: string | null;
  gender: string;
  tagged_size: string | null;
  condition: string;
  measurements: Partial<Record<(typeof measurementKeys)[number], number>>;
  flaws: string | null;
  country_of_origin: string | null;
  style_tags: string[];
  price_paise: number;
  original_price_paise: number | null;
  status: string;
};

type Props = {
  product: ProductFormValues | null;
  categories: { id: string; label: string }[];
  drops: { id: string; name: string }[];
  /** Shown instead of the status picker while a shopper holds the piece. */
  holdNote?: string;
};

const rupees = (paise: number | null) => (paise === null ? "" : String(paise / 100));

const statusOptions = [
  { value: "draft", label: "Draft — hidden from the shop" },
  { value: "available", label: "Available — on sale" },
  { value: "sold", label: "Sold — sold elsewhere / offline" },
];

// Every thrift field from CLAUDE.md §4. Saved by the saveProduct server action, which validates
// with the same schema (lib/validators/admin.ts).
export function ProductForm({ product, categories, drops, holdNote }: Props) {
  const {
    state,
    pending,
    formProps,
    errors: e,
  } = useAdminForm(saveProduct.bind(null, product?.id ?? null));

  return (
    <form {...formProps} className="max-w-3xl space-y-10">
      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">The piece</legend>
        <TextField
          name="title"
          label="Title"
          defaultValue={product?.title}
          error={e.title}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="brand" label="Brand" defaultValue={product?.brand} error={e.brand} />
          <TextField
            name="tagged_size"
            label="Tagged size"
            hint="As printed on the label."
            defaultValue={product?.tagged_size}
            error={e.tagged_size}
          />
          <TextField
            name="country_of_origin"
            label="Country of origin"
            hint="From the label, e.g. India, Bangladesh. Leave blank if it isn’t stated."
            defaultValue={product?.country_of_origin}
            error={e.country_of_origin}
          />
        </div>
        <TextAreaField
          name="description"
          label="Description"
          rows={5}
          defaultValue={product?.description}
          error={e.description}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">Where it shows</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="category_id"
            label="Category"
            placeholder="Choose a category"
            options={categories.map((c) => ({ value: c.id, label: c.label }))}
            defaultValue={product?.category_id}
            error={e.category_id}
          />
          <SelectField
            name="gender"
            label="For"
            placeholder="Choose"
            options={[
              { value: "men", label: "Men" },
              { value: "women", label: "Women" },
              { value: "unisex", label: "Unisex" },
            ]}
            defaultValue={product?.gender}
            error={e.gender}
          />
          <SelectField
            name="drop_id"
            label="Drop"
            hint="Pieces in a drop stay hidden until it goes live."
            placeholder="Not in a drop"
            options={drops.map((d) => ({ value: d.id, label: d.name }))}
            defaultValue={product?.drop_id}
            error={e.drop_id}
          />
          <TextField
            name="style_tags"
            label="Style tags"
            hint="Comma-separated, e.g. y2k, streetwear."
            defaultValue={product?.style_tags.join(", ")}
            error={e.style_tags}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">Condition and measurements</legend>
        <SelectField
          name="condition"
          label="Condition"
          placeholder="Choose a grade"
          options={Object.entries(conditions).map(([value, c]) => ({ value, label: c.label }))}
          defaultValue={product?.condition}
          error={e.condition}
        />
        <TextAreaField
          name="flaws"
          label="Flaws"
          hint="Be honest — shown on the product page."
          rows={2}
          defaultValue={product?.flaws}
          error={e.flaws}
        />
        <div>
          <p className="mb-2 text-sm font-semibold">
            Measurements (cm, laid flat — leave blank if not relevant)
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {measurementKeys.map((key) => (
              <TextField
                key={key}
                name={`m_${key}`}
                label={key[0].toUpperCase() + key.slice(1)}
                inputMode="decimal"
                defaultValue={product?.measurements[key]}
                error={e[`m_${key}`]}
              />
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">Price and status</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="price"
            label="Price ($)"
            inputMode="decimal"
            defaultValue={product ? rupees(product.price_paise) : ""}
            error={e.price}
          />
          <TextField
            name="original_price"
            label="Est. retail ($)"
            hint="Optional. Shown with the saving."
            inputMode="decimal"
            defaultValue={product ? rupees(product.original_price_paise) : ""}
            error={e.original_price}
          />
        </div>
        {holdNote ? (
          <div className="rounded-md bg-surface p-3 text-sm">
            <input type="hidden" name="status" value="reserved" />
            <p className="font-semibold">On hold</p>
            <p className="text-muted">{holdNote}</p>
          </div>
        ) : (
          <SelectField
            name="status"
            label="Status"
            options={statusOptions}
            defaultValue={product?.status ?? "draft"}
            error={e.status}
          />
        )}
        <TextField
          name="slug"
          label="URL"
          hint={product ? `/p/${product.slug}` : "Leave blank to make one from the title."}
          defaultValue={product?.slug}
          error={e.slug}
        />
      </fieldset>

      <FormFooter
        state={state}
        pending={pending}
        submitLabel={product ? "Save changes" : "Create product"}
      />
    </form>
  );
}
