// Checkout reads your session and holds per request, so show the page's rough shape.
export default function CheckoutLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="site-container animate-pulse py-6 md:py-10"
    >
      <div className="h-3 w-40 rounded-sm bg-surface" />
      <div className="mt-6 h-8 w-40 rounded-md bg-surface" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <div className="h-12 rounded-md bg-surface" />
          <div className="h-28 rounded-lg bg-surface" />
          <div className="h-28 rounded-lg bg-surface" />
        </div>
        <div className="h-80 rounded-lg bg-surface" />
      </div>
    </div>
  );
}
