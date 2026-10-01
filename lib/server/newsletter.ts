"use server";

type NewsletterState = { status: "idle" | "success" | "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(
  _previous: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    return { status: "error", message: "Enter a valid email address, like name@example.com." };
  }

  // TODO(owner): newsletter storage isn't in the CLAUDE.md §7 data model yet (a table, or a
  // Resend audience). Until it is decided, nothing is saved and the message says so honestly.
  return {
    status: "success",
    message: "Thanks! Newsletter sign-ups open at launch — nothing has been saved yet.",
  };
}
