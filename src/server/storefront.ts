import { prisma } from "@/lib/prisma";

export async function getStorefrontBySlug(slug: string) {
  const store = await prisma.store.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      settings: true,
      whatsappSettings: true,
      categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      products: {
        where: { isActive: true },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true }, include: { options: true } },
          inventory: true,
          modifiers: { include: { modifier: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  return store;
}

export async function getStorefrontByHost(host: string) {
  const domain = await prisma.domain.findUnique({
    where: { host: host.toLowerCase() },
    select: { storeId: true, status: true, store: { select: { slug: true } } },
  });
  if (!domain || domain.status !== "ACTIVE") return null;
  return getStorefrontBySlug(domain.store.slug);
}

export type Storefront = NonNullable<Awaited<ReturnType<typeof getStorefrontBySlug>>>;

/** Serialize Decimals → numbers for client components. */
export function serializeStorefront(store: Storefront) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logoUrl: store.logoUrl,
    bannerUrl: store.bannerUrl,
    currency: store.currency,
    locale: store.locale ?? "es",
    primaryColor: store.primaryColor,
    templateKey: store.templateKey,
    whatsappPhone: store.whatsappSettings?.phone ?? null,
    showBranding: store.settings?.showBranding ?? true,
    deliveryMethods: (store.settings?.deliveryMethods as unknown[]) ?? [],
    paymentMethods: (store.settings?.paymentMethods as unknown[]) ?? [],
    categories: store.categories.map((c) => ({ id: c.id, name: c.name })),
    products: store.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      categoryId: p.categoryId,
      isFeatured: p.isFeatured,
      image: p.images[0]?.url ?? null,
      images: p.images.map((im) => im.url),
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price ? Number(v.price) : null,
      })),
      extras: p.modifiers.flatMap((m) =>
        ((m.modifier.options as { name: string; price: number }[]) ?? []).map((o) => ({
          name: o.name,
          price: Number(o.price ?? 0),
        }))
      ),
    })),
  };
}

export type StorefrontDTO = ReturnType<typeof serializeStorefront>;
