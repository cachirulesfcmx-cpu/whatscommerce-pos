import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(2).max(40).transform((s) => s.toUpperCase().trim()),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().nonnegative().default(0),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  perCustomerLimit: z.number().int().positive().optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponSchema>;
