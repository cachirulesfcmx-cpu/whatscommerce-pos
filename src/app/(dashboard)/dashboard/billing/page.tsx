import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { isStripeEnabled } from "@/lib/env";
import { PLAN_CONFIG, PLAN_ORDER } from "@/lib/plans/plans";
import { BillingPanel } from "@/components/dashboard/billing-panel";

export const metadata = { title: "Facturación" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { store } = await getDashboardContext();
  const sub = await prisma.subscription.findUnique({
    where: { storeId: store.id },
    include: { plan: true },
  });

  return (
    <BillingPanel
      currentTier={sub?.plan.tier ?? "BASIC"}
      status={sub?.status ?? "TRIALING"}
      currentPeriodEnd={sub?.currentPeriodEnd?.toISOString() ?? null}
      stripeEnabled={isStripeEnabled}
      plans={PLAN_ORDER.map((t) => ({
        tier: t,
        name: PLAN_CONFIG[t].name,
        description: PLAN_CONFIG[t].description,
        priceMonthly: PLAN_CONFIG[t].priceMonthly,
        currency: PLAN_CONFIG[t].currency,
        highlight: PLAN_CONFIG[t].highlight ?? false,
      }))}
    />
  );
}
