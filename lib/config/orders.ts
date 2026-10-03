import type { Database } from "@/lib/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

/** Customer-facing order statuses. */
export const orderStatuses: Record<OrderStatus, { label: string; body: string }> = {
  pending: {
    label: "Awaiting payment",
    body: "We haven't received your payment yet. If you've just paid, this updates in a moment.",
  },
  paid: { label: "Confirmed", body: "Payment received. We're getting your pieces ready." },
  packed: { label: "Packed", body: "Packed and waiting for the courier." },
  shipped: { label: "Shipped", body: "On its way to you." },
  delivered: { label: "Delivered", body: "Delivered. Enjoy wearing it!" },
  cancelled: { label: "Cancelled", body: "This order was cancelled and nothing was charged." },
  refunded: {
    label: "Refunded",
    body: "We've refunded this order to your original payment method.",
  },
};

/** "#7F3A2C1B": the short order number shown to shoppers and in emails. */
export function shortOrderId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

const orderDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export function formatOrderDate(iso: string): string {
  return orderDate.format(new Date(iso));
}
