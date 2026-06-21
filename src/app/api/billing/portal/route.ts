import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { isStripeEnabled } from "@/lib/env";
import { createBillingPortal } from "@/server/services/billing";

export const POST = handle(async () => {
  if (!isStripeEnabled) throw new ApiError(503, "Stripe no está configurado.", "STRIPE_OFF");
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "billing:manage");
  const url = await createBillingPortal(store.id);
  return ok({ url });
});
