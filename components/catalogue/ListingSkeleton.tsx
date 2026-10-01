// Loading state for listing pages: matches the real layout so nothing jumps when results arrive.
export function ListingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className="site-container animate-pulse py-6 md:py-10"
    >
      <div className="h-3 w-40 rounded-sm bg-surface" />
      <div className="mt-6 h-8 w-56 rounded-md bg-surface" />
      <div className="mt-6 h-16 border-y border-border" />
      <div className="mt-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-10 rounded-md bg-surface" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] rounded-md bg-surface" />
              <div className="mt-3 h-3 w-2/3 rounded-sm bg-surface" />
              <div className="mt-2 h-3 w-1/3 rounded-sm bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
