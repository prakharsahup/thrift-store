import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrintButton } from "@/components/checkout/PrintButton";
import { business, formatAddress, tax } from "@/lib/config/legal";
import { formatOrderDate, shortOrderId } from "@/lib/config/orders";
import { site } from "@/lib/config/site";
import { requireUser } from "@/lib/server/auth";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Order receipt", robots: { index: false } };

const addressSnapshotSchema = z.object({
  name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
});

/** Orders that were paid (receipts don't exist for unpaid or abandoned checkouts). */
const PAID_STATUSES = new Set(["paid", "packed", "shipped", "delivered", "refunded"]);

// A printable receipt for a paid order: seller, buyer, items, charges and payment reference.
// TODO(owner): if you're GST-registered, ask your CA whether this receipt can double as your tax
// invoice (it would need an invoice series and the tax split) or whether to issue invoices from
// your accounting software instead. lib/config/legal.ts → tax.
export default async function OrderReceiptPage({ params }: PageProps<"/order/[id]/receipt">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireUser(`/order/${id}/receipt`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, created_at, subtotal_paise, shipping_paise, discount_paise, total_paise,
       coupon_code, address, payment_method, razorpay_payment_id,
       order_items(product_id, title_snapshot, price_paise_snapshot, unavailable)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!order || !PAID_STATUSES.has(order.status)) notFound();

  const address = addressSnapshotSchema.safeParse(order.address);
  const unavailable = order.order_items.filter((i) => i.unavailable);
  const refundPaise = unavailable.reduce((sum, i) => sum + i.price_paise_snapshot, 0);
  const cell = "py-2 pr-3 align-top";

  return (
    <div className="site-container py-6 md:py-10 print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href={`/order/${order.id}`} className="text-sm underline hover:text-primary">
          ← Back to order {shortOrderId(order.id)}
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-3xl rounded-lg border border-border p-5 text-sm md:p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap justify-between gap-6 border-b border-border pb-6">
          <div>
            <p className="font-display text-2xl font-bold">{site.name}</p>
            <p className="mt-2 font-semibold">{business.legalName}</p>
            <address className="text-muted not-italic">
              {formatAddress().map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {business.gstin ? <p className="mt-1">GSTIN: {business.gstin}</p> : null}
            <p className="mt-1 text-muted">
              {business.email} · {business.phone}
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold">Order receipt</h1>
            <dl className="mt-2 space-y-0.5">
              <div>
                <dt className="inline text-muted">Receipt no. </dt>
                <dd className="inline font-semibold">{shortOrderId(order.id).slice(1)}</dd>
              </div>
              <div>
                <dt className="inline text-muted">Order date </dt>
                <dd className="inline">{formatOrderDate(order.created_at)}</dd>
              </div>
              {order.razorpay_payment_id ? (
                <div>
                  <dt className="inline text-muted">Payment ref. </dt>
                  <dd className="inline break-all">{order.razorpay_payment_id}</dd>
                </div>
              ) : null}
              {order.payment_method ? (
                <div>
                  <dt className="inline text-muted">Paid by </dt>
                  <dd className="inline">{order.payment_method.toUpperCase()}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </header>

        {address.success ? (
          <section aria-labelledby="receipt-to" className="border-b border-border py-6">
            <h2
              id="receipt-to"
              className="font-body text-xs font-semibold tracking-wider text-muted uppercase"
            >
              Billed and shipped to
            </h2>
            <address className="mt-2 not-italic">
              <span className="block font-semibold">{address.data.name}</span>
              {[
                address.data.line1,
                address.data.line2,
                `${address.data.city}, ${address.data.state} ${address.data.pincode}`,
              ]
                .filter(Boolean)
                .map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              <span className="block">+91 {address.data.phone}</span>
            </address>
            <p className="mt-2 text-muted">Place of supply: {address.data.state}</p>
          </section>
        ) : null}

        <div className="overflow-x-auto py-6">
          <table className="w-full min-w-[28rem] text-left">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th scope="col" className={cell}>
                  #
                </th>
                <th scope="col" className={cell}>
                  Item
                </th>
                <th scope="col" className={cell}>
                  HSN
                </th>
                <th scope="col" className={cell}>
                  Qty
                </th>
                <th scope="col" className="py-2 text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item, i) => (
                <tr key={item.product_id} className="border-b border-border">
                  <td className={cell}>{i + 1}</td>
                  <td className={cell}>
                    {item.title_snapshot}
                    <span className="block text-xs text-muted">
                      {item.unavailable
                        ? "Not supplied — refunded"
                        : "Pre-owned apparel, one of one"}
                    </span>
                  </td>
                  <td className={cell}>{tax.hsn}</td>
                  <td className={cell}>1</td>
                  <td
                    className={`py-2 text-right align-top ${item.unavailable ? "text-muted line-through" : ""}`}
                  >
                    {formatMoney(item.price_paise_snapshot)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto mt-4 max-w-xs space-y-1">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal_paise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shipping_paise === 0 ? "Free" : formatMoney(order.shipping_paise)}</dd>
            </div>
            {order.discount_paise > 0 ? (
              <div className="flex justify-between">
                <dt>Coupon {order.coupon_code}</dt>
                <dd>−{formatMoney(order.discount_paise)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Total paid</dt>
              <dd>{formatMoney(order.total_paise)}</dd>
            </div>
            {refundPaise > 0 ? (
              <div className="flex justify-between text-muted">
                <dt>Refund due</dt>
                <dd>−{formatMoney(refundPaise)}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <footer className="space-y-1 border-t border-border pt-4 text-xs text-muted">
          <p>All amounts are in US dollars and include all applicable taxes.</p>
          <p>
            Returns and cancellations: {site.url.replace(/^https?:\/\//, "")}/returns · Help:{" "}
            {site.url.replace(/^https?:\/\//, "")}/contact
          </p>
          <p>This is a computer-generated receipt and needs no signature.</p>
        </footer>
      </article>
    </div>
  );
}
