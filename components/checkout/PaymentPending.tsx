"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 3000;
const MAX_TRIES = 20;

// On the order page while the payment is still being confirmed (verify and the webhook race the
// redirect): re-renders the server page every few seconds, for about a minute.
export function PaymentPending() {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (tries > MAX_TRIES) {
        window.clearInterval(id);
        setGaveUp(true);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <p role="status" className="text-sm text-muted">
      {gaveUp
        ? "Still waiting on the bank. If you were charged, your order confirms automatically — we'll email you, and this page will update when you reload it."
        : "Confirming your payment…"}
    </p>
  );
}
