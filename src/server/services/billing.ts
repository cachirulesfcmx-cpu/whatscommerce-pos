import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/payments/stripe";
import { env } from "@/lib/env";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

const PRICE_BY_TIER: Record<string, string | undefined> = {
  PRO: process.env.STRIPE_PRICE_PRO_MONTHLY,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
};

/** Create a Stripe Checkout session to subscribe a store to a paid plan. */
export async function createSubscriptionCheckout(storeId: string, tier: PlanTier, email?: string | null) {
  const stripe = getStripe();
  const price = PRICE_BY_TIER[tier];
  if (!price) throw new Error(`No hay price configurado para el plan ${tier}.`);

  const sub = await prisma.subscription.findUnique({ where: { storeId } });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer: sub?.stripeCustomerId || undefined,
    customer_email: sub?.stripeCustomerId ? undefined : email || undefined,
    client_reference_id: storeId,
    subscription_data: { metadata: { storeId, tier } },
    metadata: { storeId, tier, kind: "subscription" },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=cancel`,
  });
  return session.url;
}

/** Stripe billing portal for managing/cancelling subscription. */
export async function createBillingPortal(storeId: string) {
  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { storeId } });
  if (!sub?.stripeCustomerId) throw new Error("No hay suscripción activa con Stripe.");
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });
  return session.url;
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
};

export async function syncSubscriptionFromStripe(args: {
  storeId: string;
  tier?: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: string;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const plan = args.tier
    ? await prisma.plan.findUnique({ where: { tier: args.tier } })
    : null;

  await prisma.subscription.update({
    where: { storeId: args.storeId },
    data: {
      ...(plan ? { planId: plan.id } : {}),
      status: STATUS_MAP[args.status] ?? "INCOMPLETE",
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      currentPeriodEnd: args.currentPeriodEnd ? new Date(args.currentPeriodEnd * 1000) : undefined,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? undefined,
    },
  });
}
