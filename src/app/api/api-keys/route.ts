import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { assertFeature } from "@/lib/plans/limits";
import { generateApiKey } from "@/lib/api-keys";
import { audit } from "@/lib/security/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);
  const keys = await prisma.apiKey.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
  });
  return ok(keys);
});

export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "settings:manage");
  await assertFeature(store.id, "api");

  const { name } = z.object({ name: z.string().min(1).max(60) }).parse(await req.json());
  const { key, prefix, hashedKey } = generateApiKey();
  const created = await prisma.apiKey.create({
    data: { storeId: store.id, name, prefix, hashedKey },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });
  await audit({ storeId: store.id, userId: ctx.user.id, action: "apikey.create", entityId: created.id });

  // plaintext returned ONCE
  return ok({ ...created, key }, { status: 201 });
});
