import { prisma } from "@/lib/prisma";
import { getStorePlan } from "@/lib/plans/limits";
import { currentPeriod } from "@/lib/utils";

export interface UsageMetric {
  key: string;
  label: string;
  used: number;
  limit: number | null; // null = unlimited
  percent: number; // 0-100 (0 when unlimited)
  reached: boolean;
  near: boolean; // >= 80%
}

export interface PlanUsage {
  tier: string;
  planName: string;
  metrics: UsageMetric[];
  anyReached: boolean;
  anyNear: boolean;
}

function build(key: string, label: string, used: number, limit: number | null): UsageMetric {
  if (limit == null) {
    return { key, label, used, limit: null, percent: 0, reached: false, near: false };
  }
  const percent = limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));
  return { key, label, used, limit, percent, reached: used >= limit, near: percent >= 80 };
}

/** Snapshot of plan usage for the dashboard (products, monthly orders, staff). */
export async function getPlanUsage(storeId: string): Promise<PlanUsage> {
  const plan = await getStorePlan(storeId);
  const period = currentPeriod();

  const [products, staff, orderCounter] = await Promise.all([
    prisma.product.count({ where: { storeId } }),
    prisma.staff.count({ where: { storeId } }),
    prisma.usageCounter.findUnique({
      where: { storeId_period_metric: { storeId, period, metric: "orders" } },
    }),
  ]);

  const metrics = [
    build("products", "Productos", products, plan.limits.maxProducts),
    build("orders", "Pedidos este mes", orderCounter?.count ?? 0, plan.limits.maxOrdersMonth),
    build("staff", "Equipo", staff, plan.limits.maxStaff),
  ];

  return {
    tier: plan.tier,
    planName: plan.name,
    metrics,
    anyReached: metrics.some((m) => m.reached),
    anyNear: metrics.some((m) => m.near),
  };
}
