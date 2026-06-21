import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { isStripeEnabled } from "@/lib/env";
import { PLAN_CONFIG, PLAN_ORDER } from "@/lib/plans/plans";
import { getPlanUsage } from "@/lib/plans/usage";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { PlanUsageCard } from "@/components/dashboard/plan-usage-card";

export const metadata = { title: "Mejorar plan" };
export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const { store } = await getDashboardContext();
  const [sub, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { storeId: store.id }, include: { plan: true } }),
    getPlanUsage(store.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mejora tu plan</h1>
        <p className="text-sm text-muted-foreground">
          Desbloquea pagos con tarjeta, dominio propio, cupones, inventario y más.
        </p>
      </div>

      <div className="max-w-md">
        <PlanUsageCard
          planName={usage.planName}
          tier={usage.tier}
          metrics={usage.metrics}
          anyNear={usage.anyNear}
          anyReached={usage.anyReached}
        />
      </div>

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
    </div>
  );
}
