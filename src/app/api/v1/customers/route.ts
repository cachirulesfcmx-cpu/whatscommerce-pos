import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { resolveApiKey } from "@/lib/api-keys";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/v1/customers
export const GET = handle(async (req: NextRequest) => {
  const { store } = await resolveApiKey(req);
  const rl = await rateLimit(`api:${store.id}:${clientIp(req.headers)}`, 120, 60);
  if (!rl.success) throw new ApiError(429, "Rate limit excedido", "RATE_LIMIT");

  const customers = await prisma.customer.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true, name: true, phone: true, email: true,
      ordersCount: true, totalSpent: true, lastOrderAt: true, tags: true,
    },
  });

  return ok({
    customers: customers.map((c) => ({ ...c, totalSpent: Number(c.totalSpent) })),
  });
});
