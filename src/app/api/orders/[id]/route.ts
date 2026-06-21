import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { audit } from "@/lib/security/audit";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "PREPARING", "READY", "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    const ctx = await requireStoreAccess(store.id);
    assertPermission(ctx.staff, "orders:update");

    const data = schema.parse(await req.json());
    const order = await prisma.order.findFirst({ where: { id, storeId: store.id } });
    if (!order) throw new ApiError(404, "Pedido no encontrado", "NOT_FOUND");

    const history = Array.isArray(order.history) ? (order.history as unknown[]) : [];
    if (data.status) {
      history.push({ at: new Date().toISOString(), status: data.status, by: ctx.user.id });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
        ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
        history: history as object[],
      },
    });
    await audit({ storeId: store.id, userId: ctx.user.id, action: "order.update", entityId: id, metadata: { ...data } });
    return ok({ id: updated.id, status: updated.status, paymentStatus: updated.paymentStatus });
  }
);
