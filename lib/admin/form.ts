import type { z } from "zod";

// What every admin form action returns (used with React's useActionState).
export type FormState = {
  status: "idle" | "error" | "saved";
  message: string;
  /** First error message per field name. */
  fieldErrors?: Record<string, string>;
};

export const idleForm: FormState = { status: "idle", message: "" };

export function invalidForm(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return { status: "error", message: "Check the highlighted fields.", fieldErrors };
}

export function failedForm(message: string): FormState {
  return { status: "error", message };
}
