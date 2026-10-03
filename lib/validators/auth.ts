import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Enter a valid email address, like name@example.com." }));

/**
 * An Indian mobile number, typed any common way ("98765 43210", "+91 98765-43210", "098765…"),
 * normalised to E.164 ("+919876543210") for Supabase phone sign-in.
 */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, "").replace(/^(\+91|0091|91(?=\d{10}$)|0)/, ""))
  .refine((v) => /^[6-9]\d{9}$/.test(v), {
    message: "Enter a 10-digit Indian mobile number, like 98765 43210.",
  })
  .transform((v) => `+91${v}`);

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "Enter the 6-digit code we sent you." });

export const profileSchema = z.object({
  fullName: z.string().trim().max(120, { message: "Keep your name under 120 characters." }),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v === "" || /^\+?\d{10,15}$/.test(v), {
      message: "Enter a 10-digit mobile number (or leave it blank).",
    }),
});

/**
 * Where to send someone after signing in. Only same-site paths are allowed, so a crafted
 * ?next=https://evil.example can't turn our login page into an open redirect.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
