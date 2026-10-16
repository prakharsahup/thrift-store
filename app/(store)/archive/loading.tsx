// Archive skeleton: heading, intro and one contact sheet on bone.
export default function ArchiveLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="site-container py-6 md:py-10">
        <div className="h-3 w-32 rounded-sm bg-surface" />
        <div className="mt-6 h-12 w-56 rounded-sm bg-surface" />
        <div className="mt-4 h-5 w-full max-w-md rounded-sm bg-surface" />
      </div>
      <div className="h-96 bg-surface" />
    </div>
  );
}
