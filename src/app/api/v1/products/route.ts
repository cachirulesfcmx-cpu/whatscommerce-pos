import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/server/api";
import { resolveApiKey } from "@/lib/api-keys";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { ApiError } from "@/server/api";

export const dynamic = "force-dynamic";

// GET /api/v1/products — list products for the authenticated store
export const GET = handle(async (req: NextRequest) => {
  const { store } = await resolveApiKey(req);
  const rl = await rateLimit(`api:${store.id}:${clientIp(req.headers)}`, 120, 60);
  if (!rl.success) throw new ApiError(429, "Rate limit excedido", "RATE_LIMIT");

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: {
      category: { select: { name: true } },
      variants: { select: { id: true, name: true, price: true } },
      inventory: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    store: { id: store.id, name: store.name, currency: store.currency },
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      sku: p.sku,
      type: p.type,
      isActive: p.isActive,
      category: p.category?.name ?? null,
      stock: p.inventory.reduce((s, i) => s + i.quantity, 0),
      variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price ? Number(v.price) : null })),
    })),
  });
});
