import { z } from "zod";

export const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO"]),
});

export const confirmCheckoutSchema = z.object({
  sessionId: z.string().trim().min(6).max(255),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ConfirmCheckoutInput = z.infer<typeof confirmCheckoutSchema>;
