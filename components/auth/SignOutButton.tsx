"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Signs out in the browser, so CartSync sees SIGNED_OUT and clears the account cart and wishlist.
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="inline-flex h-11 items-center rounded-md border border-fg px-5 text-sm font-semibold hover:bg-fg hover:text-bg disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
