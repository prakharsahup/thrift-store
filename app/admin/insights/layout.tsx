import { Suspense } from "react";
import { InsightsNav } from "@/components/admin/insights/InsightsNav";
import { PageHeader } from "@/components/admin/PageHeader";

// Insights: sales, stock and customer reports (supabase/migrations/…_insights_reports.sql).
// Each page reads its own range from the URL; the tabs carry it between pages.
export default function InsightsLayout({ children }: LayoutProps<"/admin/insights">) {
  return (
    <>
      <PageHeader title="Insights" />
      <Suspense fallback={<div className="h-10 border-b border-border" />}>
        <InsightsNav />
      </Suspense>
      <div className="mt-6">{children}</div>
    </>
  );
}
