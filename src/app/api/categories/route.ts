import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { categorySchema } from "@/lib/validations/product";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);
  return ok(
    await prisma.category.findMany({ where: { storeId: store.id }, orderBy: { sortOrder: "asc" } })
  );
});

export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "products:create");

  const data = categorySchema.parse(await req.json());
  const category = await prisma.category.create({
    data: {
      storeId: store.id,
      name: data.name,
      slug: slugify(data.name),
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  return ok(category, { status: 201 });
});
