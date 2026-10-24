import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { resolveRange } from "@/lib/utils/insights";
import { insightsParamsSchema } from "@/lib/validators/insights";

// CSV downloads for the accountant: /admin/insights/export?type=orders|items plus the usual range
// params. Real orders only, using the same definition of a sale as the reports (paid in the range,
// status paid/packed/shipped/delivered) plus refunded orders, marked as such. Admin-only through
// requireAdmin and RLS.

const SALE_STATUSES = ["paid", "packed", "shipped", "delivered", "refunded"] as const;
const PAGE = 1000;

const istDateTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "2026-10-19 21:05" in IST: sorts correctly and spreadsheets read it as a date. */
function istStamp(iso: string | null): string {
  return iso ? istDateTime.format(new Date(iso)).replace(", ", " ") : "";
}

/** Paise → "499.00", a plain number any spreadsheet can sum. */
function rupees(paise: number | null): string {
  return paise === null ? "" : (paise / 100).toFixed(2);
}

/**
 * One CSV cell. Free text (titles, brands, cities) that starts with = + - @ is prefixed with ' so
 * a spreadsheet never runs it as a formula.
 */
function cell(value: string | number | null, text = false): string {
  let s = value === null ? "" : String(value);
  if (text && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function csv(header: string[], rows: string[][]): string {
  // The BOM makes Excel open the file as UTF-8 (₹, accented brand names).
  return `﻿${[header.join(","), ...rows.map((r) => r.join(","))].join("\r\n")}\r\n`;
}

function address(value: unknown): {
  city: string;
  state: string;
  pincode: string;
  country: string;
} {
  const a = (value ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof a[key] === "string" ? (a[key] as string) : "");
  // Snapshots from before international shipping have no country: they're Indian.
  return {
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),
    country: text("country") || "IN",
  };
}

export async function GET(request: NextRequest) {
  const { supabase } = await requireAdmin();
  const query = Object.fromEntries(request.nextUrl.searchParams);
  const params = insightsParamsSchema.parse(query);
  if (params.demo) {
    return new NextResponse("Exports cover real orders only. Turn off demo data and try again.", {
      status: 400,
    });
  }
  const type = query.type === "items" ? "items" : "orders";
  const range = resolveRange(params);
  const from = range.from.toISOString();
  const to = range.to.toISOString();
  const filename = `${type}-${range.fromDate}-to-${range.toDate}.csv`;

  let body: string;
  if (type === "orders") {
    const rows: string[][] = [];
    for (let start = 0; ; start += PAGE) {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, paid_at, status, subtotal_paise, shipping_paise, discount_paise, total_paise, coupon_code, payment_method, address, order_items(count)",
        )
        .gte("paid_at", from)
        .lt("paid_at", to)
        .in("status", [...SALE_STATUSES])
        .order("paid_at")
        .range(start, start + PAGE - 1);
      if (error) throw new Error(`export orders: ${error.message}`);
      for (const o of data) {
        const a = address(o.address);
        rows.push([
          cell(o.id),
          cell(istStamp(o.paid_at)),
          cell(o.status),
          cell(o.order_items[0]?.count ?? 0),
          cell(rupees(o.subtotal_paise)),
          cell(rupees(o.shipping_paise)),
          cell(rupees(o.discount_paise)),
          cell(rupees(o.total_paise)),
          cell(o.coupon_code, true),
          cell(o.payment_method, true),
          cell(a.city, true),
          cell(a.state, true),
          cell(a.pincode, true),
          cell(a.country),
        ]);
      }
      if (data.length < PAGE) break;
    }
    body = csv(
      [
        "Order ID",
        "Paid at (IST)",
        "Status",
        "Pieces",
        "Subtotal (₹)",
        "Shipping (₹)",
        "Discount (₹)",
        "Total (₹)",
        "Coupon",
        "Payment method",
        "City",
        "State",
        "Pincode",
        "Country",
      ],
      rows,
    );
  } else {
    const rows: { paidAt: string; cells: string[] }[] = [];
    for (let start = 0; ; start += PAGE) {
      const { data, error } = await supabase
        .from("order_items")
        .select(
          "order_id, title_snapshot, price_paise_snapshot, unavailable, orders!inner(paid_at, status), product:products(slug, brand, category:categories(name), cost:product_costs(cost_paise))",
        )
        .gte("orders.paid_at", from)
        .lt("orders.paid_at", to)
        .in("orders.status", [...SALE_STATUSES])
        .order("order_id")
        .range(start, start + PAGE - 1);
      if (error) throw new Error(`export items: ${error.message}`);
      for (const i of data) {
        const cost = i.product?.cost?.cost_paise ?? null;
        const counts = !i.unavailable && i.orders.status !== "refunded";
        rows.push({
          paidAt: i.orders.paid_at ?? "",
          cells: [
            cell(i.order_id),
            cell(istStamp(i.orders.paid_at)),
            cell(i.unavailable ? "unavailable (refunded)" : i.orders.status),
            cell(i.title_snapshot, true),
            cell(i.product?.brand ?? "", true),
            cell(i.product?.category?.name ?? "", true),
            cell(rupees(i.price_paise_snapshot)),
            cell(rupees(cost)),
            cell(counts && cost !== null ? rupees(i.price_paise_snapshot - cost) : ""),
          ],
        });
      }
      if (data.length < PAGE) break;
    }
    rows.sort((a, b) => a.paidAt.localeCompare(b.paidAt));
    body = csv(
      [
        "Order ID",
        "Paid at (IST)",
        "Status",
        "Piece",
        "Brand",
        "Category",
        "Price (₹)",
        "Cost (₹)",
        "Profit (₹)",
      ],
      rows.map((r) => r.cells),
    );
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
