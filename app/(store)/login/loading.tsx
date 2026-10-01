// Account pages load per request (they read your session), so show the page's rough shape.
export default function AccountLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="site-container animate-pulse py-6 md:py-10"
    >
      <div className="h-3 w-32 rounded-sm bg-surface" />
      <div className="mt-6 h-8 w-48 rounded-md bg-surface" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-24 rounded-lg bg-surface" />
        ))}
      </div>
    </div>
  );
}
