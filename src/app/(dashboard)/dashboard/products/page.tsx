import { getDashboardContext } from "@/server/dashboard";
import { listProducts } from "@/server/services/products";
import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/dashboard/product-manager";

export const metadata = { title: "Productos" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { store, plan } = await getDashboardContext();
  const [products, categories] = await Promise.all([
    listProducts(store.id),
    prisma.category.findMany({ where: { storeId: store.id }, orderBy: { sortOrder: "asc" } }),
  ]);

  // serialize Decimals to numbers for the client
  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    type: p.type,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    sku: p.sku,
    trackInventory: p.trackInventory,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    tags: p.tags,
    images: p.images.map((im) => ({ url: im.url, alt: im.alt ?? "", sortOrder: im.sortOrder })),
    variants: p.variants.map((v) => ({
      name: v.name,
      price: v.price ? Number(v.price) : null,
      options: v.options.map((o) => ({ type: o.type, value: o.value })),
    })),
    stock: p.inventory.reduce((s, i) => s + i.quantity, 0),
  }));

  return (
    <ProductManager
      currency={store.currency}
      initialProducts={data}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      features={{ variants: plan.features.variants, inventory: plan.features.inventory }}
      limit={plan.limits.maxProducts}
    />
  );
}
