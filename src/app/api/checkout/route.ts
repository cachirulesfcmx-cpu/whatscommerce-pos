import { NextRequest } from "next/server";
import { handle, ok } from "@/server/api";
import { checkoutSchema } from "@/lib/validations/checkout";
import { createOrder } from "@/server/services/orders";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { ApiError } from "@/server/api";
import { audit } from "@/lib/security/audit";

export const POST = handle(async (req: NextRequest) => {
  const ip = clientIp(req.headers);
  const rl = await rateLimit(`checkout:${ip}`, 20, 60);
  if (!rl.success) throw new ApiError(429, "Demasiados pedidos. Espera un momento.");

  const input = checkoutSchema.parse(await req.json());
  const { order, ticket, waLink, licenses } = await createOrder({
    storeId: input.storeId,
    input,
    channel: "STORE",
  });

  await audit({
    storeId: input.storeId,
    action: "order.create",
    entityType: "order",
    entityId: order.id,
    ip,
    metadata: { number: order.number, channel: "STORE" },
  });

  return ok(
    {
      orderId: order.id,
      number: order.number,
      total: Number(order.total),
      ticket,
      waLink,
      licenses,
    },
    { status: 201 }
  );
});
