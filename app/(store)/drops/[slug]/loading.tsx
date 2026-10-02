// Drop placeholder skeleton: breadcrumb, sticker, heading and two buttons.
export default function DropLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="site-container animate-pulse py-6 md:py-10"
    >
      <div className="h-3 w-40 rounded-sm bg-surface" />
      <div className="max-w-2xl py-12 md:py-20">
        <div className="h-6 w-28 rounded-sm bg-surface" />
        <div className="mt-4 h-10 w-2/3 rounded-md bg-surface" />
        <div className="mt-4 h-16 rounded-md bg-surface" />
      </div>
    </div>
  );
}
