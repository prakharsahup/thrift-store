// Wishlist skeleton: heading, intro and four cards.
export default function WishlistLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="site-container animate-pulse py-6 md:py-10"
    >
      <div className="h-3 w-32 rounded-sm bg-surface" />
      <div className="mt-6 h-12 w-56 rounded-sm bg-surface" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] bg-surface" />
        ))}
      </div>
    </div>
  );
}
