import { site } from "./site";

// Legal identity and policy parameters, in one place. Every policy page, the footer, the contact
// page, order emails and receipts read from here, so a change lands everywhere at once.
//
// TODO(owner): every value in [SQUARE BRACKETS] is a placeholder. They render visibly on the site
// so nothing goes live by accident with made-up details. Fill them in before launch, then have a
// lawyer review the policy pages (docs/COMPLIANCE.md lists what each law asks for).

export const business = {
  /** Registered legal name (proprietor's name for a sole proprietorship, else the company/LLP). */
  legalName: "[LEGAL BUSINESS NAME]",
  /** e.g. "Sole proprietorship", "Limited liability partnership", "Private limited company". */
  entityType: "[ENTITY TYPE]",
  tradeName: site.name,
  /** Principal place of business (Consumer Protection (E-Commerce) Rules 2020, r. 4(2)). */
  address: {
    line1: "[ADDRESS LINE 1]",
    line2: "[ADDRESS LINE 2]",
    city: "[CITY]",
    state: "[STATE]",
    pincode: "[PINCODE]",
  },
  /** GSTIN, once registered. null hides the line. */
  gstin: "[GSTIN]" as string | null,
  /** CIN (companies) or LLPIN. null hides the line. */
  cin: null as string | null,
  /** Customer care (r. 4(2) asks for email plus landline and mobile numbers). */
  email: "[support@yourdomain.in]",
  phone: "[+91 XXXXX XXXXX]",
  /** Hours customer care answers the phone, IST. */
  hours: "Monday to Saturday, 10 AM to 6 PM IST (closed on public holidays)",
} as const;

/**
 * Grievance officer (E-Commerce Rules r. 4(4)–(5); IT Rules 2011 r. 5(9); DPDP Act s. 8(10)).
 * Complaints are acknowledged within 48 hours and resolved within one month.
 */
export const grievanceOfficer = {
  name: "[GRIEVANCE OFFICER NAME]",
  designation: "Grievance Officer",
  email: "[grievance@yourdomain.in]",
  phone: "[+91 XXXXX XXXXX]",
  acknowledgeWithinHours: 48,
  resolveWithinDays: 30,
} as const;

/** Courts with jurisdiction over disputes under the terms (consumer forums are unaffected). */
export const jurisdictionCity = "[CITY]";

/** The Returns, Refunds & Cancellation policy, as numbers the copy is built from. */
export const returnsPolicy = {
  /** Days after delivery to report a problem or request a return. */
  windowDays: 7,
  /**
   * Change-of-mind returns. When false, only "not as described" returns are accepted — the law
   * (E-Commerce Rules r. 6(6)) requires those either way. Owner decision.
   */
  changeOfMind: true,
  /** Deducted from change-of-mind refunds to cover the reverse pickup. 0 for free returns. */
  changeOfMindFeePaise: 9900,
  /** Measurements may differ by up to this much (cm) and still count as accurate. */
  measurementToleranceCm: 2,
  /** Business days, after the return reaches us, to inspect it and start the refund. */
  refundStartDays: 2,
  /** Business days banks usually take to show the refund. */
  bankDays: "5–7",
} as const;

export const shippingPolicy = {
  /** Business days from payment to handing the parcel to the courier. */
  dispatchDays: 2,
  /** Typical door-to-door time after dispatch, in business days. */
  deliveryDays: "3–7",
  /** Business days after the estimate after which the shopper may cancel for a full refund. */
  lateAfterDays: 7,
} as const;

/** Date each policy was last changed (ISO). Bump it whenever its wording changes. */
export const policyUpdated = {
  terms: "2026-10-06",
  privacy: "2026-10-06",
  returns: "2026-10-06",
  shipping: "2026-10-06",
} as const;

/** Customer-facing goods description for receipts. HSN 6309 = "worn clothing and other worn articles". */
export const tax = {
  hsn: "6309",
  /** TODO(owner): confirm the HSN, rate and whether you use the second-hand margin scheme with a CA. */
  pricesIncludeTax: true,
} as const;

/** Government helplines shoppers may approach if we don't resolve a complaint. */
export const externalRedress = {
  consumerHelpline: {
    label: "National Consumer Helpline",
    phone: "1915",
    url: "https://consumerhelpline.gov.in",
  },
  eDaakhil: { label: "e-Daakhil (consumer commission filing)", url: "https://edaakhil.nic.in" },
} as const;

export function formatAddress(a = business.address): string[] {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean);
}

const policyDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export function formatPolicyDate(iso: string): string {
  return policyDate.format(new Date(`${iso}T00:00:00+05:30`));
}
