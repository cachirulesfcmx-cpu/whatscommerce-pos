import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { assertFeature } from "@/lib/plans/limits";
import { couponSchema } from "@/lib/validations/coupon";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);
  return ok(await prisma.coupon.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } }));
});

export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "coupons:create");
  await assertFeature(store.id, "coupons");

  const data = couponSchema.parse(await req.json());
  const coupon = await prisma.coupon.create({
    data: {
      storeId: store.id,
      code: data.code,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount ?? null,
      maxUses: data.maxUses ?? null,
      perCustomerLimit: data.perCustomerLimit ?? null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      isActive: data.isActive,
    },
  });
  return ok(coupon, { status: 201 });
});
