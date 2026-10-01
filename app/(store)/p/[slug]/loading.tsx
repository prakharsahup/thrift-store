// Product page skeleton: gallery on the left, details on the right (stacked on phones).
export default function ProductLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product"
      className="site-container animate-pulse py-6 md:py-10"
    >
      <div className="h-3 w-48 rounded-sm bg-surface" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
        <div className="aspect-[3/4] rounded-md bg-surface" />
        <div className="space-y-4">
          <div className="h-4 w-24 rounded-sm bg-surface" />
          <div className="h-8 w-3/4 rounded-md bg-surface" />
          <div className="h-7 w-32 rounded-md bg-surface" />
          <div className="h-20 rounded-md bg-surface" />
          <div className="h-12 rounded-md bg-surface" />
          <div className="h-40 rounded-md bg-surface" />
        </div>
      </div>
    </div>
  );
}
