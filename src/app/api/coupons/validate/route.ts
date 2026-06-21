import { NextRequest } from "next/server";
import { handle, ok } from "@/server/api";
import { validateCoupon } from "@/lib/cart/coupon";
import { z } from "zod";

const schema = z.object({
  storeId: z.string(),
  code: z.string(),
  subtotal: z.number().nonnegative(),
});

export const POST = handle(async (req: NextRequest) => {
  const { storeId, code, subtotal } = schema.parse(await req.json());
  const coupon = await validateCoupon(storeId, code, subtotal);
  return ok(coupon);
});
