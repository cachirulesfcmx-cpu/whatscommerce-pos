import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().nullable(),
  businessType: z.string().optional().nullable(),
  currency: z.string().default("MXN"),
  country: z.string().default("MX"),
  timezone: z.string().default("America/Mexico_City"),
  whatsappPhone: z.string().min(7).max(20),
  templateKey: z.string().default("minimal-store"),
  primaryColor: z.string().default("#16a34a"),
});

export const storeSettingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(1000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  templateKey: z.string().optional(),
  locale: z.enum(["es", "en"]).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  deliveryMethods: z.array(z.any()).optional(),
  paymentMethods: z.array(z.any()).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  blockOutOfStock: z.boolean().optional(),
  // profile / social proof
  addressText: z.string().max(160).optional().nullable(),
  hoursText: z.string().max(120).optional().nullable(),
  instagramUrl: z.string().url().optional().nullable().or(z.literal("")),
  instagramFollowers: z.number().int().min(0).optional().nullable(),
  facebookFollowers: z.number().int().min(0).optional().nullable(),
  tiktokFollowers: z.number().int().min(0).optional().nullable(),
  // promo popup
  promoEnabled: z.boolean().optional(),
  promoTitle: z.string().max(80).optional().nullable(),
  promoText: z.string().max(300).optional().nullable(),
  promoCtaLabel: z.string().max(40).optional().nullable(),
  promoCtaUrl: z.string().url().optional().nullable().or(z.literal("")),
  promoImageUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
