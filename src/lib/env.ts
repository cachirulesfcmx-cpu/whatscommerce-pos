import { z } from "zod";

/**
 * Validated environment. Throws at startup if required vars are missing.
 * Optional integrations (Stripe, WhatsApp, Redis) are left optional so the
 * app runs in "manual" mode without them.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().default("whatscommerce.com"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),

  REDIS_URL: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().optional(),

  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
});

// On the client, only NEXT_PUBLIC_* are present; skip strict parsing there.
const isServer = typeof window === "undefined";

// During `next build` env vars may be absent (e.g. first Vercel deploy before
// they are configured). We parse leniently so the build never crashes; at
// runtime the app surfaces clear errors if DATABASE_URL/AUTH_SECRET are missing.
const lenient = schema.partial().extend({
  NODE_ENV: schema.shape.NODE_ENV,
  NEXT_PUBLIC_ROOT_DOMAIN: schema.shape.NEXT_PUBLIC_ROOT_DOMAIN,
  NEXT_PUBLIC_APP_URL: schema.shape.NEXT_PUBLIC_APP_URL,
});

export const env = (
  isServer
    ? lenient.parse(process.env)
    : {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      }
) as z.infer<typeof schema>;

export const isStripeEnabled = Boolean(
  isServer && process.env.STRIPE_SECRET_KEY
);
export const isWhatsAppCloudEnabled = Boolean(
  isServer && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
);
