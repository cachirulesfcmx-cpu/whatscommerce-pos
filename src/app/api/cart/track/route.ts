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
  customerName: z.string().trim().max(120).optional().nullable(),
  customerPhone: z.string().trim().max(30).optional().nullable(),
  customerEmail: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
});

// Public: upsert a server-side cart snapshot for abandoned-cart recovery.
export const POST = handle(async (req: NextRequest) => {
  const data = schema.parse(await req.json());
  const contact = {
    customerName: data.customerName || undefined,
    customerPhone: data.customerPhone || undefined,
    customerEmail: data.customerEmail || undefined,
  };
  await prisma.cart.upsert({
    where: { token: data.token },
    create: {
      storeId: data.storeId, token: data.token,
      items: data.items as object[], subtotal: data.subtotal,
      ...contact,
    },
    update: { items: data.items as object[], subtotal: data.subtotal, ...contact },
  });
  return ok({ tracked: true });
});
