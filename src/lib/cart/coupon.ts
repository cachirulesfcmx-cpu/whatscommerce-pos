import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import type { AppliedCoupon } from "@/lib/cart/pricing";

/**
 * Validate a coupon for a store + subtotal. Throws ApiError(422) when invalid.
 * Does NOT increment usage — that happens atomically at order creation.
 */
export async function validateCoupon(
  storeId: string,
  code: string,
  subtotal: number
): Promise<AppliedCoupon> {
  const coupon = await prisma.coupon.findUnique({
    where: { storeId_code: { storeId, code: code.toUpperCase().trim() } },
  });

  if (!coupon || !coupon.isActive)
    throw new ApiError(422, "Cupón no válido", "COUPON_INVALID");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now)
    throw new ApiError(422, "El cupón aún no está activo", "COUPON_NOT_STARTED");
  if (coupon.endsAt && coupon.endsAt < now)
    throw new ApiError(422, "El cupón expiró", "COUPON_EXPIRED");
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
    throw new ApiError(422, "El cupón alcanzó su límite de usos", "COUPON_EXHAUSTED");
  if (coupon.minOrderAmount != null && subtotal < Number(coupon.minOrderAmount))
    throw new ApiError(
      422,
      `Compra mínima de $${Number(coupon.minOrderAmount)} para este cupón`,
      "COUPON_MIN_ORDER"
    );

  return {
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
  };
}
