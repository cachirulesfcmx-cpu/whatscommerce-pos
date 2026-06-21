import { NextRequest } from "next/server";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { productSchema } from "@/lib/validations/product";
import { assertCanCreateProduct, assertFeature } from "@/lib/plans/limits";
import { createProduct, listProducts } from "@/server/services/products";
import { audit } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);
  return ok(await listProducts(store.id));
});

export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "products:create");

  const input = productSchema.parse(await req.json());

  // plan gating
  await assertCanCreateProduct(store.id);
  if (input.variants.length > 0) await assertFeature(store.id, "variants");
  if (input.trackInventory) await assertFeature(store.id, "inventory");

  const product = await createProduct(store.id, input);
  await audit({ storeId: store.id, userId: ctx.user.id, action: "product.create", entityId: product.id });
  return ok(product, { status: 201 });
});
