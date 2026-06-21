import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { productSchema } from "@/lib/validations/product";
import { assertFeature } from "@/lib/plans/limits";
import { updateProduct } from "@/server/services/products";
import { audit } from "@/lib/security/audit";

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    const ctx = await requireStoreAccess(store.id);
    assertPermission(ctx.staff, "products:update");

    const input = productSchema.parse(await req.json());
    if (input.variants.length > 0) await assertFeature(store.id, "variants");
    if (input.trackInventory) await assertFeature(store.id, "inventory");

    const product = await updateProduct(store.id, id, input);
    if (!product) throw new ApiError(404, "Producto no encontrado", "NOT_FOUND");
    await audit({ storeId: store.id, userId: ctx.user.id, action: "product.update", entityId: id });
    return ok(product);
  }
);

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    const ctx = await requireStoreAccess(store.id);
    assertPermission(ctx.staff, "products:delete");

    const existing = await prisma.product.findFirst({ where: { id, storeId: store.id } });
    if (!existing) throw new ApiError(404, "Producto no encontrado", "NOT_FOUND");

    await prisma.product.delete({ where: { id } });
    await audit({ storeId: store.id, userId: ctx.user.id, action: "product.delete", entityId: id });
    return ok({ id });
  }
);
