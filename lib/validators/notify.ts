import { z } from "zod";

/** "Get the drop alert": an email address and the drop it's for. */
export const dropAlertSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address, like name@example.com.").max(254)),
  dropId: z.uuid("That drop isn't available any more."),
});
