"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// Signs out in the browser, so CartSync sees SIGNED_OUT and clears the account cart and wishlist.
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}
