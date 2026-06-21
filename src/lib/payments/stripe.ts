import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe no está configurado (STRIPE_SECRET_KEY).");
  }
  if (!_stripe) {
    // Use the SDK's pinned API version (avoids coupling to a specific literal).
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return _stripe;
}

export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRICE_PRO_MONTHLY,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
} as const;
