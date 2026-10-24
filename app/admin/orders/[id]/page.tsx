import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { z } from "zod";
import { OrderForm } from "@/components/admin/OrderForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, orderStatusBadge } from "@/components/admin/StatusBadge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { shortOrderId } from "@/lib/config/orders";
import { requireAdmin } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { addressLines, displayPhone } from "@/lib/utils/address";
import { formatMoney, formatUsdCharge } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Order" };

const addressSchema = z.object({
  country: z.string().optional(),
  name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
});

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, user_id, status, created_at, paid_at, subtotal_paise, shipping_paise, discount_paise,
       total_paise, coupon_code, address, razorpay_order_id, razorpay_payment_id, payment_method,
       tracking_url, charge_currency, charge_amount, order_items(product_id, title_snapshot, price_paise_snapshot, image_snapshot, unavailable)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  // Customer contact lives in auth.users, which only the service role can read.
  const customer = order.user_id
    ? (await createAdminClient().auth.admin.getUserById(order.user_id)).data.user
    : null;
  const address = addressSchema.safeParse(order.address);
  const unavailable = order.order_items.filter((i) => i.unavailable);
  const refundPaise = unavailable.reduce((sum, i) => sum + i.price_paise_snapshot, 0);
  const paidLate = order.status === "cancelled" && order.razorpay_payment_id !== null;

  return (
    <>
      <PageHeader
        title={`Order ${shortOrderId(order.id)}`}
        crumbs={[{ label: "Orders", href: "/admin/orders" }]}
      >
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
          <StatusBadge {...orderStatusBadge[order.status]} />
          <span>Placed {formatIstDateTime(order.created_at)}</span>
          {order.paid_at ? <span>Paid {formatIstDateTime(order.paid_at)}</span> : null}
        </div>
      </PageHeader>

      {unavailable.length > 0 || paidLate ? (
        <div role="alert" className="mb-8 rounded-lg border-2 border-sale p-4 text-sm">
          <p className="font-bold text-sale">
            Refund due: {formatMoney(paidLate ? order.total_paise : refundPaise)}
          </p>
          <p className="mt-1">
            {paidLate
              ? "The payment arrived after this checkout was cancelled. Refund it in full."
              : `${unavailable.length === 1 ? "One piece" : `${unavailable.length} pieces`} sold to someone else before this payment landed. Don't pack ${unavailable.length === 1 ? "it" : "them"}.`}{" "}
            Issue the refund in the Razorpay dashboard (payment {order.razorpay_payment_id}).
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section aria-labelledby="items" className="rounded-lg border border-border">
            <h2 id="items" className="border-b border-border px-4 py-3 font-bold">
              Pieces
            </h2>
            <ul className="divide-y divide-border px-4">
              {order.order_items.map((item) => (
                <li key={item.product_id} className="flex items-center gap-4 py-3">
                  <div className="relative aspect-3/4 w-12 shrink-0 overflow-hidden rounded-sm bg-surface">
                    <ImageWithFallback
                      src={item.image_snapshot}
                      alt={item.title_snapshot}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link
                      href={`/admin/products/${item.product_id}`}
                      className="font-semibold hover:underline"
                    >
                      {item.title_snapshot}
                    </Link>
                    {item.unavailable ? (
                      <p className="font-semibold text-sale">
                        Sold to someone else: don&rsquo;t pack, refund
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold">{formatMoney(item.price_paise_snapshot)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-border px-4 py-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(order.subtotal_paise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{formatMoney(order.shipping_paise)}</dd>
              </div>
              {order.discount_paise > 0 ? (
                <div className="flex justify-between">
                  <dt>Coupon {order.coupon_code}</dt>
                  <dd>−{formatMoney(order.discount_paise)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(order.total_paise)}</dd>
              </div>
              {formatUsdCharge(order) ? (
                <div className="flex justify-between text-muted">
                  <dt>Charged in USD (refund in this currency)</dt>
                  <dd>{formatUsdCharge(order)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section aria-labelledby="ship-to">
              <h2 id="ship-to" className="mb-2 font-bold">
                Ship to
              </h2>
              {address.success ? (
                <address className="text-sm leading-relaxed not-italic">
                  {address.data.name}
                  {addressLines(address.data).map((line) => (
                    <Fragment key={line}>
                      <br />
                      {line}
                    </Fragment>
                  ))}
                  <br />
                  {displayPhone(address.data)}
                </address>
              ) : (
                <p className="text-sm text-muted">No address on record.</p>
              )}
            </section>
            <section aria-labelledby="payment">
              <h2 id="payment" className="mb-2 font-bold">
                Customer and payment
              </h2>
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="inline text-muted">Account: </dt>
                  <dd className="inline">
                    {customer?.email ?? (customer?.phone ? `+${customer.phone}` : "—")}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-muted">Method: </dt>
                  <dd className="inline">{order.payment_method?.toUpperCase() ?? "—"}</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Razorpay payment: </dt>
                  <dd className="inline break-all">{order.razorpay_payment_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Razorpay order: </dt>
                  <dd className="inline break-all">{order.razorpay_order_id ?? "—"}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <section
          aria-labelledby="update"
          className="rounded-lg border border-border p-4 xl:self-start"
        >
          <h2 id="update" className="mb-4 font-bold">
            Update
          </h2>
          <OrderForm orderId={order.id} status={order.status} trackingUrl={order.tracking_url} />
        </section>
      </div>
    </>
  );
}
