import { NextRequest } from "next/server";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { isStripeEnabled } from "@/lib/env";
import { createSubscriptionCheckout } from "@/server/services/billing";
import { z } from "zod";

const schema = z.object({ tier: z.enum(["PRO", "ENTERPRISE"]) });

export const POST = handle(async (req: NextRequest) => {
  if (!isStripeEnabled) throw new ApiError(503, "Stripe no está configurado en este entorno.", "STRIPE_OFF");
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "billing:manage");

  const { tier } = schema.parse(await req.json());
  const url = await createSubscriptionCheckout(store.id, tier, ctx.user.email);
  return ok({ url });
});
