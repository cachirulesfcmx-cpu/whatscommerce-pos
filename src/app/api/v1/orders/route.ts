import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { resolveApiKey } from "@/lib/api-keys";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { checkoutSchema } from "@/lib/validations/checkout";
import { createOrder } from "@/server/services/orders";
import { audit } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

// GET /api/v1/orders — recent orders
export const GET = handle(async (req: NextRequest) => {
  const { store } = await resolveApiKey(req);
  const rl = await rateLimit(`api:${store.id}:${clientIp(req.headers)}`, 120, 60);
  if (!rl.success) throw new ApiError(429, "Rate limit excedido", "RATE_LIMIT");

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: { storeId: store.id, ...(status ? { status: status as never } : {}) },
    include: { items: { select: { name: true, quantity: true, unitPrice: true, lineTotal: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ok({
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      paymentStatus: o.paymentStatus,
      customer: { name: o.customerName, phone: o.customerPhone },
      total: Number(o.total),
      currency: o.currency,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: Number(i.unitPrice), lineTotal: Number(i.lineTotal) })),
    })),
  });
});

// POST /api/v1/orders — create an order
export const POST = handle(async (req: NextRequest) => {
  const { store } = await resolveApiKey(req);
  const rl = await rateLimit(`api-write:${store.id}:${clientIp(req.headers)}`, 60, 60);
  if (!rl.success) throw new ApiError(429, "Rate limit excedido", "RATE_LIMIT");

  const body = await req.json();
  const input = checkoutSchema.parse({ ...body, storeId: store.id });
  const { order, ticket, waLink } = await createOrder({ storeId: store.id, input, channel: "MANUAL" });

  await audit({ storeId: store.id, action: "api.order.create", entityId: order.id, metadata: { number: order.number } });

  return ok(
    { id: order.id, number: order.number, total: Number(order.total), status: order.status, ticket, waLink },
    { status: 201 }
  );
});
