import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";
import { syncSubscriptionFromStripe } from "@/server/services/billing";
import type { PlanTier } from "@prisma/client";

// Stripe needs the raw body — disable any parsing.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig!, secret);
  } catch (err) {
    console.error("[stripe] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "stripe", eventId: event.id } },
  });
  if (existing?.processedAt) return NextResponse.json({ received: true });

  await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider: "stripe", eventId: event.id } },
    create: { provider: "stripe", eventId: event.id, type: event.type, payload: event as unknown as object },
    update: {},
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.metadata?.storeId) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          await syncSubscriptionFromStripe({
            storeId: session.metadata.storeId,
            tier: session.metadata.tier as PlanTier,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
        } else if (session.metadata?.kind === "order_payment" && session.metadata.orderId) {
          await markOrderPaid(session.metadata.orderId, session.payment_intent as string);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const storeId = sub.metadata?.storeId;
        if (storeId) {
          await syncSubscriptionFromStripe({
            storeId,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            status: event.type.endsWith("deleted") ? "canceled" : sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string | null;
        if (subId) {
          const sub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: subId } });
          if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: "PAST_DUE" } });
        }
        break;
      }
    }

    await prisma.webhookEvent.update({
      where: { provider_eventId: { provider: "stripe", eventId: event.id } },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    console.error("[stripe] handler error", err);
    await prisma.webhookEvent.update({
      where: { provider_eventId: { provider: "stripe", eventId: event.id } },
      data: { error: err instanceof Error ? err.message : "unknown" },
    });
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function markOrderPaid(orderId: string, paymentIntent: string) {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    }),
    prisma.payment.updateMany({
      where: { orderId },
      data: { status: "PAID", provider: "STRIPE", providerRef: paymentIntent, paidAt: new Date() },
    }),
  ]);
}
