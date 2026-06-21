import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).default([]),
  marketingOptIn: z.boolean().default(false),
});

export type CustomerInput = z.infer<typeof customerSchema>;
