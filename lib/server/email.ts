import "server-only";
import { business, formatAddress, grievanceOfficer, returnsPolicy } from "@/lib/config/legal";
import { site } from "@/lib/config/site";
import { formatMoney } from "@/lib/utils/money";
import { supportTopics, type SupportTopic } from "@/lib/validators/support";

// Transactional email. Email clients ignore CSS variables, so the templates inline the brand
// colours from app/globals.css (keep them in sync).
//
// Delivery: with RESEND_API_KEY set, mail goes out through Resend's REST API. Without it, it's
// skipped with a console warning: an email failing must never fail a paid order.

type Email = { to: string; subject: string; html: string; text: string };

function fromAddress(): { email: string; name: string } {
  // EMAIL_FROM may be "Name <address>" or just an address.
  const raw = process.env.EMAIL_FROM ?? `${site.name} <orders@example.test>`;
  const match = /^(.*)<(.+)>$/.exec(raw.trim());
  return match
    ? { name: match[1].trim() || site.name, email: match[2].trim() }
    : { name: site.name, email: raw.trim() };
}

/** Sends an email. Resolves to true if it was handed to Resend, false otherwise. */
export async function sendEmail(email: Email): Promise<boolean> {
  const from = fromAddress();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY is not set; skipped "${email.subject}" to ${email.to}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${from.name} <${from.email}>`,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
    return true;
  } catch (error) {
    console.error(`[email] "${email.subject}" to ${email.to} failed:`, error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Seller details and help links at the foot of every email (E-Commerce Rules 2020 r. 4(2): legal
 * name, address and customer-care contacts).
 */
function legalFooter(): { html: string; text: string } {
  const address = formatAddress().join(", ");
  const links: [string, string][] = [
    ["Help & contact", `${site.url}/contact`],
    ["Returns & refunds", `${site.url}/returns`],
    ["Privacy notice", `${site.url}/privacy`],
  ];
  const text = [
    "",
    "—",
    `${site.name} is run by ${business.legalName}, ${address}.`,
    `Customer care: ${business.email} · ${business.phone}`,
    ...links.map(([label, url]) => `${label}: ${url}`),
  ].join("\n");
  const html = `<hr style="border:none;border-top:1px solid #e2d8c8;margin:32px 0 16px">
  <p style="font-size:12px;color:#675e53;line-height:1.6;margin:0">
    ${escapeHtml(site.name)} is run by ${escapeHtml(business.legalName)}, ${escapeHtml(address)}.<br>
    Customer care: ${escapeHtml(business.email)} · ${escapeHtml(business.phone)}<br>
    ${links.map(([label, url]) => `<a href="${url}" style="color:#675e53">${escapeHtml(label)}</a>`).join(" · ")}
  </p>`;
  return { html, text };
}

export type ConfirmationOrder = {
  id: string;
  items: { title: string; pricePaise: number; unavailable: boolean }[];
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  address: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
};

/** "Order confirmed" email. Flags any piece that sold to someone else first (refund due). */
export function orderConfirmationEmail(order: ConfirmationOrder): Omit<Email, "to"> {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const url = `${site.url}/order/${order.id}`;
  const unavailable = order.items.filter((i) => i.unavailable);
  const refundPaise = unavailable.reduce((sum, i) => sum + i.pricePaise, 0);
  const a = order.address;
  const addressLines = [a.name, a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(
    (l): l is string => Boolean(l),
  );

  const rows: [string, string][] = [
    ["Subtotal", formatMoney(order.subtotalPaise)],
    ["Shipping", order.shippingPaise === 0 ? "Free" : formatMoney(order.shippingPaise)],
    ...(order.discountPaise > 0
      ? ([["Discount", `−${formatMoney(order.discountPaise)}`]] as [string, string][])
      : []),
    ["Paid", formatMoney(order.totalPaise)],
  ];

  const refundNote = unavailable.length
    ? `Sorry — ${unavailable.length === 1 ? "one piece" : `${unavailable.length} pieces`} sold to someone else a moment before your payment landed. We'll refund ${formatMoney(refundPaise)} to your original payment method within 5–7 working days.`
    : null;

  const text = [
    `Thanks for your order! (#${shortId})`,
    "",
    ...order.items.map(
      (i) =>
        `- ${i.title}: ${formatMoney(i.pricePaise)}${i.unavailable ? " (sold out, refunding)" : ""}`,
    ),
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(refundNote ? ["", refundNote] : []),
    "",
    "Shipping to:",
    ...addressLines,
    "",
    `Track it here: ${url}`,
    "",
    `You can cancel free of charge until your order ships, and return pieces within ${returnsPolicy.windowDays} days of delivery: ${site.url}/returns`,
    legalFooter().text,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#fbf8f3;color:#17140f;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
  <p style="font-size:24px;font-weight:bold;margin:0 0 4px">${escapeHtml(site.name)}</p>
  <h1 style="font-size:20px;margin:24px 0 4px">Thanks — your order is confirmed</h1>
  <p style="color:#675e53;margin:0 0 24px">Order #${shortId}. Every piece is one of one, and these ones are yours.</p>
  ${refundNote ? `<p style="background:#f1ebe0;padding:12px;border-radius:8px;margin:0 0 24px">${escapeHtml(refundNote)}</p>` : ""}
  <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px">
    ${order.items
      .map(
        (i) =>
          `<tr><td style="padding:8px 0;border-bottom:1px solid #e2d8c8">${escapeHtml(i.title)}${
            i.unavailable ? ' <span style="color:#b3123a">(sold out — refunding)</span>' : ""
          }</td><td align="right" style="padding:8px 0;border-bottom:1px solid #e2d8c8">${formatMoney(i.pricePaise)}</td></tr>`,
      )
      .join("")}
    ${rows
      .map(
        ([label, value], index) =>
          `<tr><td style="padding:4px 0${index === rows.length - 1 ? ";font-weight:bold" : ""}">${label}</td><td align="right" style="padding:4px 0${index === rows.length - 1 ? ";font-weight:bold" : ""}">${value}</td></tr>`,
      )
      .join("")}
  </table>
  <p style="font-size:14px;margin:24px 0 4px;font-weight:bold">Shipping to</p>
  <p style="font-size:14px;margin:0;line-height:1.5">${addressLines.map(escapeHtml).join("<br>")}</p>
  <p style="margin:32px 0"><a href="${url}" style="background:#b93a0e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">View your order</a></p>
  <p style="font-size:14px;color:#675e53;margin:0">You can cancel free of charge until your order ships, and return pieces within ${returnsPolicy.windowDays} days of delivery. <a href="${site.url}/returns" style="color:#b93a0e">Returns, refunds &amp; cancellation policy</a>.</p>
  ${legalFooter().html}
</div>
</body></html>`;

  return { subject: `Order confirmed — #${shortId}`, html, text };
}

// No email for "cancelled": only unpaid (abandoned) checkouts can be cancelled.
const statusCopy = {
  packed: {
    subject: "Your order is packed",
    body: "Your pieces are packed and waiting for the courier.",
  },
  shipped: { subject: "Your order is on its way", body: "Your parcel has shipped." },
  delivered: {
    subject: "Your order was delivered",
    body: "Your parcel has been delivered. We hope you love wearing it.",
  },
  refunded: {
    subject: "Your refund is on its way",
    body: "We've refunded this order to your original payment method. Banks usually take 5–7 working days to show it.",
  },
} as const;

export type NotifiableStatus = keyof typeof statusCopy;

export function isNotifiableStatus(status: string): status is NotifiableStatus {
  return status in statusCopy;
}

/** Sent when an admin moves an order along (CLAUDE.md §8: "Changing the status emails the customer"). */
export function orderStatusEmail(order: {
  id: string;
  status: NotifiableStatus;
  trackingUrl: string | null;
}): Omit<Email, "to"> {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const copy = statusCopy[order.status];
  const url = `${site.url}/order/${order.id}`;
  const tracking = order.status === "shipped" && order.trackingUrl ? order.trackingUrl : null;

  const text = [
    `${copy.body} (Order #${shortId})`,
    ...(tracking ? ["", `Track your parcel: ${tracking}`] : []),
    "",
    `Your order: ${url}`,
    legalFooter().text,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#fbf8f3;color:#17140f;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
  <p style="font-size:24px;font-weight:bold;margin:0 0 4px">${escapeHtml(site.name)}</p>
  <h1 style="font-size:20px;margin:24px 0 4px">${escapeHtml(copy.subject)}</h1>
  <p style="color:#675e53;margin:0 0 24px">Order #${shortId}. ${escapeHtml(copy.body)}</p>
  ${tracking ? `<p style="margin:0 0 16px"><a href="${escapeHtml(tracking)}" style="color:#b93a0e;font-weight:bold">Track your parcel</a></p>` : ""}
  <p style="margin:32px 0"><a href="${url}" style="background:#b93a0e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">View your order</a></p>
  ${legalFooter().html}
</div>
</body></html>`;

  return { subject: `${copy.subject} — #${shortId}`, html, text };
}

// ---------------------------------------------------------------------------
// Order notifications (internal)
// ---------------------------------------------------------------------------

/**
 * Where new-order alerts go: ORDER_NOTIFICATION_EMAIL, else the customer-care address in
 * lib/config/legal.ts once it's a real address. Null while both are still placeholders.
 */
export function orderNotificationInbox(): string | null {
  const candidate = process.env.ORDER_NOTIFICATION_EMAIL ?? business.email;
  return /^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/.test(candidate) ? candidate : null;
}

export type OrderNotification = {
  id: string;
  status: string;
  customerEmail: string | null;
  items: { title: string; pricePaise: number; unavailable: boolean }[];
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  paymentMethod: string | null;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  adminUrl: string;
  /** Only set for a late payment (status "cancelled"): the order row never gets one. */
  razorpayPaymentId?: string;
};

/** Internal alert sent to the owner every time an order is paid (one per order, see orders.ts). */
export function orderNotificationEmail(o: OrderNotification): Omit<Email, "to"> {
  const shortId = o.id.slice(0, 8).toUpperCase();
  const a = o.address;
  const addressLines = [a.name, a.phone, a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(
    (l): l is string => Boolean(l),
  );
  const unavailable = o.items.filter((i) => i.unavailable);
  const needsManualRefund = o.status === "cancelled";

  const lines = [
    needsManualRefund
      ? `⚠ Payment landed after this order's reservation expired — refund ${formatMoney(o.totalPaise)} by hand in the Razorpay dashboard${o.razorpayPaymentId ? ` (payment ${o.razorpayPaymentId})` : ""}.`
      : `New order paid — #${shortId}`,
    "",
    ...o.items.map(
      (i) => `- ${i.title}: ${formatMoney(i.pricePaise)}${i.unavailable ? " (sold out — refunding)" : ""}`,
    ),
    "",
    `Subtotal: ${formatMoney(o.subtotalPaise)}`,
    `Shipping: ${o.shippingPaise === 0 ? "Free" : formatMoney(o.shippingPaise)}`,
    ...(o.discountPaise > 0 ? [`Discount: -${formatMoney(o.discountPaise)}`] : []),
    `Total: ${formatMoney(o.totalPaise)}`,
    `Payment method: ${o.paymentMethod ?? "unknown"}`,
    "",
    `Customer: ${o.customerEmail ?? "no email on file"}`,
    "",
    "Ship to:",
    ...addressLines,
    "",
    ...(unavailable.length
      ? [
          `Refund due: ${formatMoney(unavailable.reduce((sum, i) => sum + i.pricePaise, 0))} for ${unavailable.length} unavailable item(s).`,
          "",
        ]
      : []),
    `Open in admin: ${o.adminUrl}`,
  ];

  return {
    subject: `${needsManualRefund ? "[NEEDS REFUND] " : ""}New order #${shortId} — ${formatMoney(o.totalPaise)}`,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>`,
  };
}

// ---------------------------------------------------------------------------
// Support and grievances
// ---------------------------------------------------------------------------

/**
 * Where new contact-form messages are forwarded: SUPPORT_INBOX, else the customer-care address in
 * lib/config/legal.ts once it's a real address. Null while both are still placeholders.
 */
export function supportInbox(): string | null {
  const candidate = process.env.SUPPORT_INBOX ?? business.email;
  return /^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/.test(candidate) ? candidate : null;
}

export type SupportMessage = {
  ticket: string;
  name: string;
  email: string;
  phone: string | null;
  topic: SupportTopic;
  orderRef: string | null;
  message: string;
};

/**
 * The automatic acknowledgement with a ticket number, sent the moment a message arrives
 * (E-Commerce Rules 2020 r. 4(5): acknowledge every complaint within 48 hours).
 */
export function supportAcknowledgementEmail(m: SupportMessage): Omit<Email, "to"> {
  const intro = `Hi ${m.name}, we've received your message and given it the ticket number ${m.ticket}. Quote it if you write to us again.`;
  const timing =
    m.topic === "grievance"
      ? `Our Grievance Officer, ${grievanceOfficer.name}, will look into it and resolve it within ${grievanceOfficer.resolveWithinDays} days — usually much sooner.`
      : "We reply within one business day.";

  const text = [
    intro,
    "",
    timing,
    "",
    `Topic: ${supportTopics[m.topic]}`,
    ...(m.orderRef ? [`Order: ${m.orderRef}`] : []),
    "",
    "Your message:",
    m.message,
    legalFooter().text,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#fbf8f3;color:#17140f;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
  <p style="font-size:24px;font-weight:bold;margin:0 0 4px">${escapeHtml(site.name)}</p>
  <h1 style="font-size:20px;margin:24px 0 4px">We've got your message — ticket ${escapeHtml(m.ticket)}</h1>
  <p style="margin:0 0 16px">${escapeHtml(intro)}</p>
  <p style="margin:0 0 24px">${escapeHtml(timing)}</p>
  <p style="font-size:14px;margin:0 0 4px;font-weight:bold">${escapeHtml(supportTopics[m.topic])}${m.orderRef ? ` · Order ${escapeHtml(m.orderRef)}` : ""}</p>
  <p style="font-size:14px;margin:0;white-space:pre-wrap;background:#f1ebe0;padding:12px;border-radius:8px">${escapeHtml(m.message)}</p>
  ${legalFooter().html}
</div>
</body></html>`;

  return { subject: `We've received your message — ticket ${m.ticket}`, html, text };
}

/** Internal alert to the support inbox when a message arrives. */
export function supportAlertEmail(m: SupportMessage & { adminUrl: string }): Omit<Email, "to"> {
  const lines = [
    `Ticket: ${m.ticket}${m.topic === "grievance" ? ` (GRIEVANCE — resolve within ${grievanceOfficer.resolveWithinDays} days)` : ""}`,
    `Topic: ${supportTopics[m.topic]}`,
    `From: ${m.name} <${m.email}>${m.phone ? ` · ${m.phone}` : ""}`,
    ...(m.orderRef ? [`Order: ${m.orderRef}`] : []),
    "",
    m.message,
    "",
    `Open it in admin: ${m.adminUrl}`,
  ];
  return {
    subject: `[${m.ticket}] ${supportTopics[m.topic]} — ${m.name}`,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>`,
  };
}

/** Sent when an admin marks a ticket resolved, saying what was done and how to escalate. */
export function supportResolvedEmail(m: {
  ticket: string;
  name: string;
  resolution: string;
}): Omit<Email, "to"> {
  const escalate = `Not happy with the outcome? Write to our Grievance Officer at ${grievanceOfficer.email}, or contact the National Consumer Helpline on 1915 (consumerhelpline.gov.in).`;
  const text = [
    `Hi ${m.name}, we've marked ticket ${m.ticket} as resolved. Here's what we did:`,
    "",
    m.resolution,
    "",
    escalate,
    legalFooter().text,
  ].join("\n");
  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#fbf8f3;color:#17140f;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
  <p style="font-size:24px;font-weight:bold;margin:0 0 4px">${escapeHtml(site.name)}</p>
  <h1 style="font-size:20px;margin:24px 0 4px">Ticket ${escapeHtml(m.ticket)} resolved</h1>
  <p style="margin:0 0 16px">Hi ${escapeHtml(m.name)}, here's what we did:</p>
  <p style="font-size:14px;margin:0 0 24px;white-space:pre-wrap;background:#f1ebe0;padding:12px;border-radius:8px">${escapeHtml(m.resolution)}</p>
  <p style="font-size:14px;color:#675e53;margin:0">${escapeHtml(escalate)}</p>
  ${legalFooter().html}
</div>
</body></html>`;
  return { subject: `Ticket ${m.ticket} resolved`, html, text };
}
