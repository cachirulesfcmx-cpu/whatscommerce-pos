import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { audit } from "@/lib/security/audit";

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    const ctx = await requireStoreAccess(store.id);
    assertPermission(ctx.staff, "settings:manage");

    const key = await prisma.apiKey.findFirst({ where: { id, storeId: store.id } });
    if (!key) throw new ApiError(404, "API key no encontrada", "NOT_FOUND");
    await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    await audit({ storeId: store.id, userId: ctx.user.id, action: "apikey.revoke", entityId: id });
    return ok({ id });
  }
);
