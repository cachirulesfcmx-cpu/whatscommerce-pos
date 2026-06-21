import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/server/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  storeId: z.string().min(1),
  token: z.string().min(1),
  subtotal: z.number().nonnegative().default(0),
  items: z.array(z.any()).default([]),
});

// Public: upsert a server-side cart snapshot for abandoned-cart analytics.
export const POST = handle(async (req: NextRequest) => {
  const data = schema.parse(await req.json());
  await prisma.cart.upsert({
    where: { token: data.token },
    create: {
      storeId: data.storeId, token: data.token,
      items: data.items as object[], subtotal: data.subtotal,
    },
    update: { items: data.items as object[], subtotal: data.subtotal },
  });
  return ok({ tracked: true });
});
