import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PaymentPending } from "@/components/checkout/PaymentPending";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { returnsPolicy } from "@/lib/config/legal";
import { formatOrderDate, orderStatuses, shortOrderId } from "@/lib/config/orders";
import { requireUser } from "@/lib/server/auth";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const addressSnapshotSchema = z.object({
  name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
});

// Order confirmation and status (CLAUDE.md §9 step 7). RLS: shoppers only ever see their own
// orders; anyone else's id 404s.
export default async function OrderPage({ params }: PageProps<"/order/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireUser(`/order/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, created_at, subtotal_paise, shipping_paise, discount_paise, total_paise,
       coupon_code, address, payment_method, tracking_url, razorpay_payment_id,
       order_items(product_id, title_snapshot, price_paise_snapshot, image_snapshot, unavailable,
                   product:products(slug))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const status = orderStatuses[order.status];
  const address = addressSnapshotSchema.safeParse(order.address);
  const unavailable = order.order_items.filter((i) => i.unavailable);
  const refundPaise = unavailable.reduce((sum, i) => sum + i.price_paise_snapshot, 0);
  const paidLate = order.status === "cancelled" && order.razorpay_payment_id !== null;
  const justPaid = order.status === "paid";

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Orders", href: "/account/orders" },
          { label: shortOrderId(order.id) },
        ]}
      />

      <div className="mt-4 max-w-2xl">
        <p className="text-sm text-muted">
          Order {shortOrderId(order.id)} · {formatOrderDate(order.created_at)}
        </p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">
          {justPaid ? "Thanks — it's yours." : status.label}
        </h1>
        <p className="mt-2 text-muted">
          {paidLate
            ? "Your payment arrived after this checkout had expired, so we couldn't hold the pieces. We'll refund it in full within 5–7 working days."
            : status.body}
        </p>
        {order.status === "pending" ? (
          <div className="mt-4">
            <PaymentPending />
          </div>
        ) : null}
        {order.tracking_url ? (
          <ButtonLink
            href={order.tracking_url}
            variant="outline"
            className="mt-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Track your parcel
          </ButtonLink>
        ) : null}

        {unavailable.length > 0 ? (
          <p role="status" className="mt-6 rounded-md bg-surface p-4 text-sm">
            Sorry — {unavailable.length === 1 ? "one piece" : `${unavailable.length} pieces`} sold
            to someone else a moment before your payment landed. We&rsquo;ll refund{" "}
            <strong>{formatMoney(refundPaise)}</strong> to your original payment method within 5–7
            working days.
          </p>
        ) : null}

        <section aria-labelledby="order-items" className="mt-8 rounded-lg border border-border">
          <h2
            id="order-items"
            className="border-b border-border px-4 py-3 text-lg font-bold md:px-6"
          >
            {order.order_items.length === 1 ? "1 piece" : `${order.order_items.length} pieces`}
          </h2>
          <ul className="divide-y divide-border px-4 md:px-6">
            {order.order_items.map((item) => (
              <li key={item.product_id} className="flex gap-4 py-4">
                <div className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-md bg-surface">
                  {item.image_snapshot ? (
                    <Image
                      src={item.image_snapshot}
                      alt={item.title_snapshot}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  {item.product ? (
                    <Link
                      href={`/p/${item.product.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {item.title_snapshot}
                    </Link>
                  ) : (
                    <p className="font-semibold">{item.title_snapshot}</p>
                  )}
                  {item.unavailable ? (
                    <p className="text-sale">Sold to someone else — refunding</p>
                  ) : null}
                </div>
                <p
                  className={
                    item.unavailable ? "text-sm text-muted line-through" : "text-sm font-semibold"
                  }
                >
                  {formatMoney(item.price_paise_snapshot)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-border px-4 py-4 text-sm md:px-6">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal_paise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shipping_paise === 0 ? "Free" : formatMoney(order.shipping_paise)}</dd>
            </div>
            {order.discount_paise > 0 ? (
              <div className="flex justify-between text-sale">
                <dt>Coupon {order.coupon_code}</dt>
                <dd>−{formatMoney(order.discount_paise)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>
                {order.status === "pending" || order.status === "cancelled" ? "Total" : "Paid"}
              </dt>
              <dd>{formatMoney(order.total_paise)}</dd>
            </div>
            {order.payment_method ? (
              <p className="pt-1 text-xs text-muted">
                Paid by {order.payment_method.toUpperCase()}
              </p>
            ) : null}
          </dl>
        </section>

        {address.success ? (
          <section aria-labelledby="order-address" className="mt-8">
            <h2 id="order-address" className="text-lg font-bold">
              Shipping to
            </h2>
            <address className="mt-2 text-sm leading-relaxed text-muted not-italic">
              {address.data.name}
              <br />
              {address.data.line1}
              {address.data.line2 ? (
                <>
                  <br />
                  {address.data.line2}
                </>
              ) : null}
              <br />
              {address.data.city}, {address.data.state} {address.data.pincode}
              <br />
              +91 {address.data.phone}
            </address>
          </section>
        ) : null}

        {order.status !== "pending" && order.status !== "cancelled" ? (
          <section
            aria-labelledby="order-help"
            className="mt-8 rounded-lg bg-surface p-4 text-sm md:p-6"
          >
            <h2 id="order-help" className="text-lg font-bold">
              Need to cancel or return?
            </h2>
            <p className="mt-2">
              {order.status === "paid" || order.status === "packed"
                ? "You can cancel free of charge until your order ships."
                : order.status === "shipped"
                  ? `Once it arrives, you have ${returnsPolicy.windowDays} days to tell us if something's wrong${returnsPolicy.changeOfMind ? " or to return it" : ""}.`
                  : order.status === "delivered"
                    ? `You have ${returnsPolicy.windowDays} days from delivery to report a problem${returnsPolicy.changeOfMind ? " or return a piece" : ""}.`
                    : "This order has been refunded."}{" "}
              <Link href="/returns" className="underline hover:text-primary">
                Returns, refunds &amp; cancellation policy
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink
                href={`/contact?order=${order.id}&topic=${
                  order.status === "paid" || order.status === "packed"
                    ? "cancellation"
                    : order.status === "refunded"
                      ? "refund"
                      : "return"
                }`}
                variant="outline"
              >
                Cancel or get help
              </ButtonLink>
              <ButtonLink href={`/order/${order.id}/receipt`} variant="outline">
                Receipt
              </ButtonLink>
            </div>
          </section>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/search?sort=newest">Keep shopping</ButtonLink>
          <ButtonLink href="/account/orders" variant="outline">
            All orders
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
