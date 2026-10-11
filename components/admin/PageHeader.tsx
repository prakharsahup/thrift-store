import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

type Props = {
  title: string;
  /** Parent pages, e.g. [{ label: "Products", href: "/admin/products" }]. */
  crumbs?: { label: string; href: string }[];
  /** Buttons on the right, e.g. "New product". */
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ title, crumbs, actions, children }: Props) {
  return (
    <div className="mb-6">
      {crumbs?.length ? (
        <Breadcrumbs items={[...crumbs, { label: title }]} className="mb-3" />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
