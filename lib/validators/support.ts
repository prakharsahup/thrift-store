import { z } from "zod";
import { emailSchema, indianMobileDigits, isIndianMobile } from "./auth";

export const supportTopics = {
  order: "A question about an order",
  cancellation: "Cancel an order",
  return: "Return a piece",
  refund: "A refund",
  privacy: "My personal data (access, correction, deletion)",
  grievance: "A complaint (Grievance Officer)",
  other: "Something else",
} as const;

export type SupportTopic = keyof typeof supportTopics;

export function isSupportTopic(value: unknown): value is SupportTopic {
  return typeof value === "string" && value in supportTopics;
}

/** The contact form (components/legal/ContactForm.tsx → lib/actions/support.ts). */
export const supportRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Tell us your name." })
    .max(120, { message: "Keep your name under 120 characters." }),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .transform((v) => (v ? indianMobileDigits(v) : ""))
    .refine((v) => v === "" || isIndianMobile(v), {
      message: "Enter a 10-digit Indian mobile number, or leave it blank.",
    })
    .transform((v) => (v ? `+91${v}` : null)),
  topic: z.enum(Object.keys(supportTopics) as [SupportTopic, ...SupportTopic[]], {
    message: "Choose what it's about.",
  }),
  orderRef: z
    .string()
    .trim()
    .max(20, { message: "That doesn't look like an order number." })
    .transform((v) => v || null),
  message: z
    .string()
    .trim()
    .min(10, { message: "Tell us a little more (at least 10 characters)." })
    .max(5000, { message: "Keep it under 5,000 characters." }),
});

export const supportStatuses = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
} as const;

export type SupportStatus = keyof typeof supportStatuses;

/** Admin: move a ticket along. A resolution note is required to resolve it (it's emailed). */
export const supportUpdateSchema = z
  .object({
    status: z.enum(Object.keys(supportStatuses) as [SupportStatus, ...SupportStatus[]], {
      message: "Choose a status.",
    }),
    resolution: z
      .string()
      .trim()
      .max(5000, { message: "Keep it under 5,000 characters." })
      .transform((v) => v || null),
  })
  .refine((v) => v.status !== "resolved" || v.resolution, {
    path: ["resolution"],
    message: "Say what you did — the customer is emailed this note.",
  });
