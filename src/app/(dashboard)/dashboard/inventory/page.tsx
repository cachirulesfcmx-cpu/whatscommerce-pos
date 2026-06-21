import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { InventoryManager } from "@/components/dashboard/inventory-manager";
import { FeatureGate } from "@/components/dashboard/feature-gate";

export const metadata = { title: "Inventario" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { store, plan } = await getDashboardContext();
  if (!plan.features.inventory) {
    return (
      <FeatureGate
        title="Inventario profesional"
        description="Controla stock por producto y variante, movimientos, alertas de bajo stock y bloqueo de venta sin existencias con el plan Pro."
      />
    );
  }

  const [items, moves, settings] = await Promise.all([
    prisma.inventory.findMany({
      where: { storeId: store.id },
      include: { product: { select: { name: true } }, variant: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.inventoryMovement.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.storeSettings.findUnique({ where: { storeId: store.id }, select: { blockOutOfStock: true } }),
  ]);

  const productIds = Array.from(new Set(moves.map((m) => m.productId).filter(Boolean))) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  const data = items.map((i) => ({
    id: i.id,
    productName: i.product?.name ?? "—",
    variantName: i.variant?.name ?? null,
    quantity: i.quantity,
    lowStockAt: i.lowStockAt,
  }));

  const movements = moves.map((m) => ({
    id: m.id,
    productName: m.productId ? nameById.get(m.productId) ?? "—" : "—",
    type: m.type,
    delta: m.delta,
    reason: m.reason,
    reference: m.reference,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <InventoryManager
      items={data}
      movements={movements}
      blockOutOfStock={settings?.blockOutOfStock ?? false}
    />
  );
}
