import { redirect } from "next/navigation";

// The wishlist now lives at /wishlist and works signed out too; old links land there.
export default function AccountWishlistPage() {
  redirect("/wishlist");
}
