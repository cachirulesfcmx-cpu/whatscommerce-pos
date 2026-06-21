import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { checkoutSchema } from "@/lib/validations/checkout";
import { createOrder } from "@/server/services/orders";
import { audit } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: { storeId: store.id, ...(status ? { status: status as never } : {}) },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return ok(orders);
});

// Manual order creation (POS)
export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "pos:create");

  const input = checkoutSchema.parse({ ...(await req.json()), storeId: store.id });
  const { order, ticket, waLink } = await createOrder({
    storeId: store.id,
    input,
    channel: "POS",
    assignedToId: ctx.user.id,
  });
  await audit({ storeId: store.id, userId: ctx.user.id, action: "order.create", entityId: order.id, metadata: { channel: "POS" } });
  return ok({ orderId: order.id, number: order.number, ticket, waLink }, { status: 201 });
});
