import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/server/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  storeId: z.string().min(1),
  productId: z.string().optional().nullable(),
  customerName: z.string().trim().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(800).optional().nullable(),
});

// Public: submit a product/store review, then refresh the store rating rollup.
export const POST = handle(async (req: NextRequest) => {
  const data = schema.parse(await req.json());

  await prisma.review.create({
    data: {
      storeId: data.storeId,
      productId: data.productId || null,
      customerName: data.customerName,
      rating: data.rating,
      comment: data.comment || null,
    },
  });

  // recompute store-wide rating from approved reviews
  const agg = await prisma.review.aggregate({
    where: { storeId: data.storeId, approved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.storeSettings.update({
    where: { storeId: data.storeId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count._all,
    },
  }).catch(() => {});

  return ok({ submitted: true });
});
