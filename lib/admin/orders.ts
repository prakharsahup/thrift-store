import type { OrderStatus } from "@/lib/config/orders";

/**
 * Where an admin may move an order from each status. Pending orders can only be cancelled (they
 * are paid by the payment webhook, never by hand); refunds are recorded here after being issued
 * in the Razorpay dashboard.
 */
export const nextOrderStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ["cancelled"],
  paid: ["packed", "shipped", "refunded"],
  packed: ["shipped", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};
