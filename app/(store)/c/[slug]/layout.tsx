import { notFound } from "next/navigation";
import { getCategoryPage } from "@/lib/server/catalogue";

// Checks the category exists before the listing streams behind loading.tsx, so unknown categories
// get a real 404 status. (Cached: the page reuses this query.)
export default async function CategoryLayout({ children, params }: LayoutProps<"/c/[slug]">) {
  const { slug } = await params;
  if (!(await getCategoryPage(slug))) notFound();
  return children;
}
