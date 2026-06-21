import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { couponSchema } from "@/lib/validations/coupon";

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    const ctx = await requireStoreAccess(store.id);
    assertPermission(ctx.staff, "coupons:update");

    const data = couponSchema.partial().parse(await req.json());
    const existing = await prisma.coupon.findFirst({ where: { id, storeId: store.id } });
    if (!existing) throw new ApiError(404, "Cupón no encontrado", "NOT_FOUND");

    const coupon = await prisma.coupon.update({ where: { id }, data });
    return ok(coupon);
  }
);

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    const ctx = await requireStoreAccess(store.id);
    assertPermission(ctx.staff, "coupons:delete");
    const existing = await prisma.coupon.findFirst({ where: { id, storeId: store.id } });
    if (!existing) throw new ApiError(404, "Cupón no encontrado", "NOT_FOUND");
    await prisma.coupon.delete({ where: { id } });
    return ok({ id });
  }
);
