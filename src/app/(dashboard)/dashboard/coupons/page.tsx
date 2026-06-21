import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { CouponsManager } from "@/components/dashboard/coupons-manager";
import { FeatureGate } from "@/components/dashboard/feature-gate";

export const metadata = { title: "Cupones" };
export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const { store, plan } = await getDashboardContext();
  if (!plan.features.coupons) {
    return <FeatureGate title="Cupones y promociones" description="Crea descuentos por porcentaje, monto fijo o envío gratis con el plan Pro." />;
  }
  const coupons = await prisma.coupon.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } });
  const data = coupons.map((c) => ({
    id: c.id, code: c.code, type: c.type, value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxUses: c.maxUses, usedCount: c.usedCount, isActive: c.isActive,
  }));
  return <CouponsManager currency={store.currency} coupons={data} />;
}
