import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { ProductInput } from "@/lib/validations/product";

async function uniqueProductSlug(storeId: string, name: string, ignoreId?: string) {
  const base = slugify(name) || "producto";
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const exists = await prisma.product.findFirst({
      where: { storeId, slug: candidate, NOT: ignoreId ? { id: ignoreId } : undefined },
      select: { id: true },
    });
    if (!exists) return candidate;
    i += 1;
  }
}

export async function createProduct(storeId: string, input: ProductInput) {
  const slug = await uniqueProductSlug(storeId, input.name);

  const product = await prisma.product.create({
    data: {
      storeId,
      name: input.name,
      slug,
      description: input.description ?? null,
      type: input.type,
      categoryId: input.categoryId || null,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      sku: input.sku ?? null,
      trackInventory: input.trackInventory,
      prepTimeMinutes: input.prepTimeMinutes ?? null,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      tags: input.tags,
      instagramUrls: input.instagramUrls ?? [],
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      images: { create: input.images.map((im, i) => ({ url: im.url, alt: im.alt, sortOrder: im.sortOrder ?? i })) },
      variants: {
        create: input.variants.map((v, i) => ({
          name: v.name,
          sku: v.sku ?? null,
          price: v.price ?? null,
          compareAtPrice: v.compareAtPrice ?? null,
          sortOrder: i,
          options: { create: v.options.map((o) => ({ type: o.type, value: o.value })) },
        })),
      },
      modifiers: { create: input.modifierIds.map((modifierId) => ({ modifierId })) },
    },
    include: { variants: true },
  });

  await addLicenseCodes(storeId, product.id, input.licenseCodes ?? []);

  // initial inventory
  if (input.trackInventory) {
    if (product.variants.length > 0) {
      const variantsWithStock = input.variants.map((v, i) => ({ ...v, variantId: product.variants[i]?.id }));
      for (const v of variantsWithStock) {
        if (v.variantId) {
          await prisma.inventory.create({
            data: { storeId, productId: product.id, variantId: v.variantId, quantity: v.stock ?? 0 },
          });
        }
      }
    } else {
      await prisma.inventory.create({
        data: { storeId, productId: product.id, quantity: input.stock ?? 0 },
      });
    }
  }

  return product;
}

export async function updateProduct(storeId: string, id: string, input: ProductInput) {
  const existing = await prisma.product.findFirst({ where: { id, storeId } });
  if (!existing) return null;

  const slug =
    existing.name === input.name ? existing.slug : await uniqueProductSlug(storeId, input.name, id);

  // Replace images, variants, modifiers (simple, predictable strategy)
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.variant.deleteMany({ where: { productId: id } }),
    prisma.modifierOnProduct.deleteMany({ where: { productId: id } }),
  ]);

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      type: input.type,
      categoryId: input.categoryId || null,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      sku: input.sku ?? null,
      trackInventory: input.trackInventory,
      prepTimeMinutes: input.prepTimeMinutes ?? null,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      tags: input.tags,
      instagramUrls: input.instagramUrls ?? [],
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      images: { create: input.images.map((im, i) => ({ url: im.url, alt: im.alt, sortOrder: im.sortOrder ?? i })) },
      variants: {
        create: input.variants.map((v, i) => ({
          name: v.name, sku: v.sku ?? null, price: v.price ?? null,
          compareAtPrice: v.compareAtPrice ?? null, sortOrder: i,
          options: { create: v.options.map((o) => ({ type: o.type, value: o.value })) },
        })),
      },
      modifiers: { create: input.modifierIds.map((modifierId) => ({ modifierId })) },
    },
  });

  await addLicenseCodes(storeId, product.id, input.licenseCodes ?? []);

  return product;
}

/** Add new AVAILABLE license keys for a digital product, skipping duplicates. */
async function addLicenseCodes(storeId: string, productId: string, codes: string[]) {
  const clean = Array.from(new Set(codes.map((c) => c.trim()).filter(Boolean)));
  if (clean.length === 0) return;
  const existing = await prisma.licenseKey.findMany({
    where: { productId, code: { in: clean } },
    select: { code: true },
  });
  const have = new Set(existing.map((e) => e.code));
  const toCreate = clean.filter((c) => !have.has(c));
  if (toCreate.length === 0) return;
  await prisma.licenseKey.createMany({
    data: toCreate.map((code) => ({ storeId, productId, code })),
  });
}

/** Count available license keys per product (for the dashboard). */
export async function availableLicenseCount(productId: string) {
  return prisma.licenseKey.count({ where: { productId, status: "AVAILABLE" } });
}

export async function listProducts(storeId: string) {
  return prisma.product.findMany({
    where: { storeId },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { options: true } },
      inventory: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
