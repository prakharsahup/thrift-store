export default function InsightsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-10 max-w-xl rounded-md bg-surface" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-lg bg-surface" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-surface" />
    </div>
  );
}
