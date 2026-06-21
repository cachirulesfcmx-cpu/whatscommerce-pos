import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { AbandonedCartsTable } from "@/components/dashboard/abandoned-carts-table";
import { buildWaMeLink } from "@/lib/whatsapp/ticket";
import { env } from "@/lib/env";

export const metadata = { title: "Carritos abandonados" };
export const dynamic = "force-dynamic";

interface CartItem { name?: string; quantity?: number }

export default async function CartsPage() {
  const { store, plan } = await getDashboardContext();
  if (!plan.features.cartRecovery) {
    return (
      <FeatureGate
        title="Recuperación de carritos"
        description="Recupera ventas con recordatorios automáticos por WhatsApp y email con el plan Pro."
      />
    );
  }

  const carts = await prisma.cart.findMany({
    where: { storeId: store.id, recoveredAt: null },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const checkoutUrl = `${env.NEXT_PUBLIC_APP_URL}/store/${store.slug}/checkout`;
  const data = carts
    .filter((c) => ((c.items as CartItem[]) ?? []).length > 0)
    .map((c) => {
      const items = (c.items as CartItem[]) ?? [];
      const itemsLabel = items
        .map((i) => `${i.quantity ?? 1}× ${i.name ?? "Producto"}`)
        .join(", ");
      const msg =
        `Hola${c.customerName ? " " + c.customerName : ""} 👋 Notamos que dejaste tu carrito en ${store.name}.\n` +
        `${itemsLabel}\n` +
        `Subtotal: ${c.subtotal}\n` +
        `Termina tu pedido aquí: ${checkoutUrl}`;
      return {
        id: c.id,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        customerEmail: c.customerEmail,
        itemsLabel,
        itemCount: items.length,
        subtotal: Number(c.subtotal),
        updatedAt: c.updatedAt.toISOString(),
        remindedAt: c.remindedAt?.toISOString() ?? null,
        waLink: c.customerPhone ? buildWaMeLink(c.customerPhone, msg) : null,
      };
    });

  return <AbandonedCartsTable currency={store.currency} carts={data} />;
}
