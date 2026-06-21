import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG, type FeatureKey, type PlanConfig } from "@/lib/plans/plans";
import { currentPeriod } from "@/lib/utils";
import type { PlanTier } from "@prisma/client";

/** Resolve the effective plan config for a store (defaults to BASIC). */
export async function getStorePlan(storeId: string): Promise<PlanConfig> {
  const sub = await prisma.subscription.findUnique({
    where: { storeId },
    include: { plan: true },
  });
  const tier = (sub?.plan.tier ?? "BASIC") as PlanTier;
  // active/trialing get full plan; otherwise downgrade features to BASIC limits
  const usable =
    sub && ["ACTIVE", "TRIALING"].includes(sub.status) ? tier : "BASIC";
  return PLAN_CONFIG[usable];
}

export async function hasFeature(
  storeId: string,
  feature: FeatureKey
): Promise<boolean> {
  const plan = await getStorePlan(storeId);
  return plan.features[feature];
}

export class PlanLimitError extends Error {
  code = "PLAN_LIMIT";
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export class FeatureLockedError extends Error {
  code = "FEATURE_LOCKED";
  constructor(message: string) {
    super(message);
    this.name = "FeatureLockedError";
  }
}

export async function assertFeature(storeId: string, feature: FeatureKey) {
  if (!(await hasFeature(storeId, feature))) {
    throw new FeatureLockedError(
      "Esta función no está disponible en tu plan actual."
    );
  }
}

/** Enforce product count limit before creating a product. */
export async function assertCanCreateProduct(storeId: string) {
  const plan = await getStorePlan(storeId);
  if (plan.limits.maxProducts == null) return;
  const count = await prisma.product.count({ where: { storeId } });
  if (count >= plan.limits.maxProducts) {
    throw new PlanLimitError(
      `Tu plan permite hasta ${plan.limits.maxProducts} productos. Mejora tu plan para agregar más.`
    );
  }
}

/** Enforce monthly orders limit; call when creating an order. */
export async function assertCanCreateOrder(storeId: string) {
  const plan = await getStorePlan(storeId);
  if (plan.limits.maxOrdersMonth == null) return;
  const period = currentPeriod();
  const counter = await prisma.usageCounter.findUnique({
    where: { storeId_period_metric: { storeId, period, metric: "orders" } },
  });
  if ((counter?.count ?? 0) >= plan.limits.maxOrdersMonth) {
    throw new PlanLimitError(
      `Alcanzaste el límite de ${plan.limits.maxOrdersMonth} pedidos este mes. Mejora tu plan para seguir recibiendo pedidos.`
    );
  }
}

export async function incrementUsage(
  storeId: string,
  metric = "orders",
  by = 1
) {
  const period = currentPeriod();
  await prisma.usageCounter.upsert({
    where: { storeId_period_metric: { storeId, period, metric } },
    create: { storeId, period, metric, count: by },
    update: { count: { increment: by } },
  });
}

export async function assertCanCreateStaff(storeId: string) {
  const plan = await getStorePlan(storeId);
  if (plan.limits.maxStaff == null) return;
  const count = await prisma.staff.count({ where: { storeId } });
  if (count >= plan.limits.maxStaff) {
    throw new PlanLimitError(
      `Tu plan permite hasta ${plan.limits.maxStaff} miembros del equipo.`
    );
  }
}
