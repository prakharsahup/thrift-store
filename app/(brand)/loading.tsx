// Shown while a brand page's data loads: a calm skeleton in the page's rough shape.
export default function BrandLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="site-container animate-pulse py-12">
      <div className="h-72 rounded-lg bg-surface md:h-96" />
      <div className="mt-12 h-8 w-48 rounded-md bg-surface" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-md bg-surface" />
        ))}
      </div>
    </div>
  );
}
