import { handle, ok, ApiError } from "@/server/api";
import { prisma } from "@/lib/prisma";
import { getActiveStore, requireStoreAccess } from "@/server/context";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  const moves = await prisma.inventoryMovement.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // resolve product names (best-effort)
  const productIds = Array.from(new Set(moves.map((m) => m.productId).filter(Boolean))) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return ok(
    moves.map((m) => ({
      id: m.id,
      productName: m.productId ? nameById.get(m.productId) ?? "—" : "—",
      type: m.type,
      delta: m.delta,
      reason: m.reason,
      reference: m.reference,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});
