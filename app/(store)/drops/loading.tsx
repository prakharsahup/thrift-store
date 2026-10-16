// Drops list skeleton: heading, intro and three rows.
export default function DropsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="site-container animate-pulse py-6 md:py-10"
    >
      <div className="h-3 w-32 rounded-sm bg-surface" />
      <div className="mt-6 h-12 w-56 rounded-sm bg-surface" />
      <div className="mt-4 h-5 w-full max-w-md rounded-sm bg-surface" />
      <div className="mt-12 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-sm bg-surface" />
        ))}
      </div>
    </div>
  );
}
