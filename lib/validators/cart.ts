import { z } from "zod";

// Shared by client and server: the browser validates before calling, the server validates again.
export const productIdSchema = z.uuid();

/** A cart is small; anything longer than this is not a real cart. */
export const productIdsSchema = z.array(productIdSchema).max(50);
