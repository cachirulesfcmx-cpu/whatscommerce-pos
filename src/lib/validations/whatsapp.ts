import { z } from "zod";

export const whatsappSettingsSchema = z.object({
  phone: z.string().min(7).max(20),
  displayName: z.string().max(80).optional().nullable(),
  language: z.string().default("es"),
  notifyCustomer: z.boolean().default(false),
  templates: z.record(z.string(), z.string()).optional(),
});

export type WhatsAppSettingsInput = z.infer<typeof whatsappSettingsSchema>;
