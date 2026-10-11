export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-md bg-surface" />
      <div className="h-40 rounded-lg bg-surface" />
      <div className="h-40 rounded-lg bg-surface" />
    </div>
  );
}
