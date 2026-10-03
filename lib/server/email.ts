import "server-only";
import { site } from "@/lib/config/site";
import { formatINR } from "@/lib/utils/money";

// Transactional email. Email clients ignore CSS variables, so the templates inline the brand
// colours from app/globals.css (keep them in sync).
//
// Delivery: With RESEND_API_KEY set, mail goes out through Resend's REST API.
// Without it, in development, it lands in the local Mailpit inbox (http://127.0.0.1:54324), the
// same place as sign-in codes. In production without a key it's skipped with a warning: an email
// failing must never fail a paid order.

type Email = { to: string; subject: string; html: string; text: string };

const MAILPIT_URL = "http://127.0.0.1:54324";

function fromAddress(): { email: string; name: string } {
  // EMAIL_FROM may be "Name <address>" or just an address.
  const raw = process.env.EMAIL_FROM ?? `${site.name} <orders@example.test>`;
  const match = /^(.*)<(.+)>$/.exec(raw.trim());
  return match
    ? { name: match[1].trim() || site.name, email: match[2].trim() }
    : { name: site.name, email: raw.trim() };
}

export async function sendEmail(email: Email): Promise<void> {
  const from = fromAddress();
  const apiKey = process.env.RESEND_API_KEY;

  try {
    if (apiKey) {
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
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      const response = await fetch(`${MAILPIT_URL}/api/v1/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          From: { Email: from.email, Name: from.name },
          To: [{ Email: email.to }],
          Subject: email.subject,
          HTML: email.html,
          Text: email.text,
        }),
      });
      if (!response.ok) throw new Error(`Mailpit ${response.status}: ${await response.text()}`);
      return;
    }

    console.warn(`[email] RESEND_API_KEY is not set; skipped "${email.subject}" to ${email.to}`);
  } catch (error) {
    console.error(`[email] "${email.subject}" to ${email.to} failed:`, error);
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
    ["Subtotal", formatINR(order.subtotalPaise)],
    ["Shipping", order.shippingPaise === 0 ? "Free" : formatINR(order.shippingPaise)],
    ...(order.discountPaise > 0
      ? ([["Discount", `−${formatINR(order.discountPaise)}`]] as [string, string][])
      : []),
    ["Paid", formatINR(order.totalPaise)],
  ];

  const refundNote = unavailable.length
    ? `Sorry — ${unavailable.length === 1 ? "one piece" : `${unavailable.length} pieces`} sold to someone else a moment before your payment landed. We'll refund ${formatINR(refundPaise)} to your original payment method within 5–7 working days.`
    : null;

  const text = [
    `Thanks for your order! (#${shortId})`,
    "",
    ...order.items.map(
      (i) =>
        `- ${i.title}: ${formatINR(i.pricePaise)}${i.unavailable ? " (sold out, refunding)" : ""}`,
    ),
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(refundNote ? ["", refundNote] : []),
    "",
    "Shipping to:",
    ...addressLines,
    "",
    `Track it here: ${url}`,
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
          }</td><td align="right" style="padding:8px 0;border-bottom:1px solid #e2d8c8">${formatINR(i.pricePaise)}</td></tr>`,
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
</div>
</body></html>`;

  return { subject: `Order confirmed — #${shortId}`, html, text };
}
