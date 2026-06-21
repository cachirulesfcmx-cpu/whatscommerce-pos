import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess } from "@/server/context";
import { isStripeEnabled, env } from "@/lib/env";
import { assertFeature } from "@/lib/plans/limits";
import { getStripe } from "@/lib/payments/stripe";

// Create a Stripe Checkout (mode=payment) link for an order's total.
export const POST = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    if (!isStripeEnabled) throw new ApiError(503, "Stripe no está configurado.", "STRIPE_OFF");
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    await requireStoreAccess(store.id);
    await assertFeature(store.id, "cardPayments");

    const order = await prisma.order.findFirst({ where: { id, storeId: store.id } });
    if (!order) throw new ApiError(404, "Pedido no encontrado", "NOT_FOUND");
    if (order.paymentStatus === "PAID") throw new ApiError(409, "El pedido ya está pagado", "ALREADY_PAID");

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: store.currency.toLowerCase(),
            product_data: { name: `Pedido ${order.number} — ${store.name}` },
            unit_amount: Math.round(Number(order.total) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "order_payment", orderId: order.id, storeId: store.id },
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/orders?paid=${order.number}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/orders`,
    });
    return ok({ url: session.url });
  }
);
