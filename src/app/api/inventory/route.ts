import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { assertFeature } from "@/lib/plans/limits";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);
  const items = await prisma.inventory.findMany({
    where: { storeId: store.id },
    include: { product: { select: { name: true } }, variant: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return ok(items);
});

const adjustSchema = z.object({
  inventoryId: z.string(),
  delta: z.number().int(),
  reason: z.string().optional(),
});

export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "inventory:update");
  await assertFeature(store.id, "inventory");

  const data = adjustSchema.parse(await req.json());
  const inv = await prisma.inventory.findFirst({ where: { id: data.inventoryId, storeId: store.id } });
  if (!inv) throw new ApiError(404, "Inventario no encontrado", "NOT_FOUND");

  const [updated] = await prisma.$transaction([
    prisma.inventory.update({ where: { id: inv.id }, data: { quantity: { increment: data.delta } } }),
    prisma.inventoryMovement.create({
      data: {
        storeId: store.id, productId: inv.productId, variantId: inv.variantId,
        type: "ADJUSTMENT", delta: data.delta, reason: data.reason,
      },
    }),
  ]);
  return ok({ id: updated.id, quantity: updated.quantity });
});

const thresholdSchema = z.object({
  inventoryId: z.string(),
  lowStockAt: z.number().int().min(0),
});

// Update the low-stock alert threshold for an inventory row.
export const PATCH = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "inventory:update");
  await assertFeature(store.id, "inventory");

  const data = thresholdSchema.parse(await req.json());
  const inv = await prisma.inventory.findFirst({ where: { id: data.inventoryId, storeId: store.id } });
  if (!inv) throw new ApiError(404, "Inventario no encontrado", "NOT_FOUND");

  const updated = await prisma.inventory.update({
    where: { id: inv.id },
    data: { lowStockAt: data.lowStockAt },
  });
  return ok({ id: updated.id, lowStockAt: updated.lowStockAt });
});
