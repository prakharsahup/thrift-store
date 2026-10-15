"use client";

import { CheckboxField, SelectField, TextAreaField, TextField } from "./FormField";
import { FormFooter } from "./FormFooter";
import { ImageUrlField } from "./ImageUrlField";
import { useAdminForm } from "./useAdminForm";
import { saveBanner, saveCategory, saveCoupon, saveDrop } from "@/lib/actions/admin/catalogue";
import { toIstInputValue } from "@/lib/utils/datetime";

// Editor forms for drops, categories, banners and coupons (one file: they're small and alike).
// Dates are entered in IST (lib/utils/datetime.ts).

const genders = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];

export type DropValues = {
  id: string;
  name: string;
  slug: string;
  description: string;
  banner_url: string | null;
  go_live_at: string;
  is_published: boolean;
};

export function DropForm({ drop }: { drop: DropValues | null }) {
  const {
    state,
    pending,
    formProps,
    errors: e,
  } = useAdminForm(saveDrop.bind(null, drop?.id ?? null));
  return (
    <form {...formProps} className="space-y-4">
      <TextField name="name" label="Name" defaultValue={drop?.name} error={e.name} />
      <TextField
        name="slug"
        label="URL"
        hint={drop ? `/drops/${drop.slug}` : "Leave blank to make one from the name."}
        defaultValue={drop?.slug}
        error={e.slug}
      />
      <TextAreaField
        name="description"
        label="Description"
        defaultValue={drop?.description}
        error={e.description}
      />
      <ImageUrlField
        name="banner_url"
        label="Banner image"
        folder="drops"
        defaultValue={drop?.banner_url}
        error={e.banner_url}
      />
      <TextField
        name="go_live_at"
        label="Goes live (IST)"
        type="datetime-local"
        defaultValue={toIstInputValue(drop?.go_live_at)}
        error={e.go_live_at}
        hint="Its pieces stay hidden until then; the drop page shows a countdown."
      />
      <CheckboxField
        name="is_published"
        label="Published"
        hint="Unpublished drops are invisible, even after their go-live time."
        defaultChecked={drop?.is_published ?? false}
      />
      <FormFooter
        state={state}
        pending={pending}
        submitLabel={drop ? "Save drop" : "Create drop"}
      />
    </form>
  );
}

export type CategoryValues = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  gender: string;
  image_url: string | null;
  sort_order: number;
};

export function CategoryForm({
  category,
  parents,
}: {
  category: CategoryValues | null;
  parents: { id: string; label: string }[];
}) {
  const {
    state,
    pending,
    formProps,
    errors: e,
  } = useAdminForm(saveCategory.bind(null, category?.id ?? null));
  return (
    <form {...formProps} className="space-y-4">
      <TextField name="name" label="Name" defaultValue={category?.name} error={e.name} />
      <TextField
        name="slug"
        label="URL"
        hint={category ? `/c/${category.slug}` : "Leave blank to make one from the name."}
        defaultValue={category?.slug}
        error={e.slug}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="parent_id"
          label="Parent"
          placeholder="None (top level)"
          options={parents
            .filter((p) => p.id !== category?.id)
            .map((p) => ({ value: p.id, label: p.label }))}
          defaultValue={category?.parent_id}
          error={e.parent_id}
        />
        <SelectField
          name="gender"
          label="For"
          placeholder="Choose"
          options={genders}
          defaultValue={category?.gender}
          error={e.gender}
        />
      </div>
      <ImageUrlField
        name="image_url"
        label="Tile image"
        folder="categories"
        defaultValue={category?.image_url}
        error={e.image_url}
      />
      <TextField
        name="sort_order"
        label="Sort order"
        inputMode="numeric"
        hint="Lower numbers come first in menus."
        defaultValue={category?.sort_order ?? 0}
        error={e.sort_order}
      />
      <FormFooter
        state={state}
        pending={pending}
        submitLabel={category ? "Save category" : "Create category"}
      />
    </form>
  );
}

export type BannerValues = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  image_alt: string;
  link_url: string;
  cta_label: string;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export function BannerForm({ banner }: { banner: BannerValues | null }) {
  const {
    state,
    pending,
    formProps,
    errors: e,
  } = useAdminForm(saveBanner.bind(null, banner?.id ?? null));
  return (
    <form {...formProps} className="space-y-4">
      <TextField name="title" label="Headline" defaultValue={banner?.title} error={e.title} />
      <TextField
        name="subtitle"
        label="Subtitle"
        defaultValue={banner?.subtitle}
        error={e.subtitle}
      />
      <ImageUrlField
        name="image_url"
        label="Image"
        folder="banners"
        required
        defaultValue={banner?.image_url}
        error={e.image_url}
      />
      <TextField
        name="image_alt"
        label="Image description"
        hint="What the image shows, for people who can't see it."
        defaultValue={banner?.image_alt}
        error={e.image_alt}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="link_url"
          label="Link"
          placeholder="/c/men-jackets"
          defaultValue={banner?.link_url}
          error={e.link_url}
        />
        <TextField
          name="cta_label"
          label="Button text"
          defaultValue={banner?.cta_label ?? "Shop now"}
          error={e.cta_label}
        />
        <TextField
          name="starts_at"
          label="Show from (IST, optional)"
          type="datetime-local"
          defaultValue={toIstInputValue(banner?.starts_at)}
          error={e.starts_at}
        />
        <TextField
          name="ends_at"
          label="Show until (IST, optional)"
          type="datetime-local"
          defaultValue={toIstInputValue(banner?.ends_at)}
          error={e.ends_at}
        />
      </div>
      <TextField
        name="sort_order"
        label="Position"
        inputMode="numeric"
        hint="Lower numbers come first in the carousel."
        defaultValue={banner?.sort_order ?? 0}
        error={e.sort_order}
      />
      <CheckboxField name="is_active" label="Active" defaultChecked={banner?.is_active ?? true} />
      <FormFooter
        state={state}
        pending={pending}
        submitLabel={banner ? "Save banner" : "Create banner"}
      />
    </form>
  );
}

export type CouponValues = {
  code: string;
  type: "percent" | "flat";
  value: number;
  min_order_paise: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
};

export function CouponForm({ coupon }: { coupon: CouponValues | null }) {
  const {
    state,
    pending,
    formProps,
    errors: e,
  } = useAdminForm(saveCoupon.bind(null, coupon?.code ?? null));
  return (
    <form {...formProps} className="space-y-4">
      <TextField
        name="code"
        label="Code"
        defaultValue={coupon?.code}
        disabled={coupon !== null}
        hint={
          coupon ? "Codes can't be changed once created." : "Letters and numbers, e.g. WELCOME10."
        }
        error={e.code}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="type"
          label="Type"
          options={[
            { value: "percent", label: "Percent off" },
            { value: "flat", label: "Flat $ off" },
          ]}
          defaultValue={coupon?.type ?? "percent"}
          error={e.type}
        />
        <TextField
          name="value"
          label="Amount"
          inputMode="decimal"
          hint="Percent (1–100) or dollars, by type."
          defaultValue={coupon ? (coupon.type === "flat" ? coupon.value / 100 : coupon.value) : ""}
          error={e.value}
        />
        <TextField
          name="min_order"
          label="Minimum order ($)"
          inputMode="decimal"
          defaultValue={coupon && coupon.min_order_paise > 0 ? coupon.min_order_paise / 100 : ""}
          error={e.min_order}
        />
        <TextField
          name="max_uses"
          label="Max uses in total"
          inputMode="numeric"
          hint={
            coupon
              ? `Used ${coupon.used_count} time${coupon.used_count === 1 ? "" : "s"} so far. Each customer can use a code once.`
              : "Blank for unlimited. Each customer can use a code once."
          }
          defaultValue={coupon?.max_uses}
          error={e.max_uses}
        />
      </div>
      <TextField
        name="expires_at"
        label="Expires (IST, optional)"
        type="datetime-local"
        defaultValue={toIstInputValue(coupon?.expires_at)}
        error={e.expires_at}
      />
      <CheckboxField name="active" label="Active" defaultChecked={coupon?.active ?? true} />
      <FormFooter
        state={state}
        pending={pending}
        submitLabel={coupon ? "Save coupon" : "Create coupon"}
      />
    </form>
  );
}
