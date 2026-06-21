import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { getSampleCatalog } from "@/lib/sample-catalog";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

// POST /api/stores/sample-data — precarga categorías y productos de ejemplo del giro.
export const POST = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "products:create");

  const catalog = getSampleCatalog(store.businessType);
  if (!catalog) throw new ApiError(400, "No hay catálogo de ejemplo para este giro.", "NO_CATALOG");

  const existing = await prisma.product.count({ where: { storeId: store.id } });
  if (existing > 0) throw new ApiError(409, "Tu tienda ya tiene productos.", "HAS_PRODUCTS");

  // categories
  const catMap = new Map<string, string>();
  for (let i = 0; i < catalog.categories.length; i++) {
    const name = catalog.categories[i];
    const c = await prisma.category.create({
      data: { storeId: store.id, name, slug: slugify(name) || `cat-${i}`, sortOrder: i },
    });
    catMap.set(name, c.id);
  }

  // products
  let count = 0;
  for (let i = 0; i < catalog.products.length; i++) {
    const p = catalog.products[i];
    await prisma.product.create({
      data: {
        storeId: store.id,
        name: p.name,
        slug: (slugify(p.name) || `prod-${i}`) + `-${i}`,
        price: p.price,
        categoryId: catMap.get(p.category) ?? null,
        isFeatured: p.featured ?? false,
        sortOrder: i,
        images: { create: [{ url: p.img, alt: p.name, sortOrder: 0 }] },
      },
    });
    count++;
  }

  await audit({ storeId: store.id, userId: ctx.user.id, action: "store.sample_data", metadata: { count } });
  return ok({ categories: catalog.categories.length, products: count });
});
