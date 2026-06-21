import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { OrdersTable } from "@/components/dashboard/orders-table";

export const metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { store, plan } = await getDashboardContext();
  const [orders, wa] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.whatsAppSettings.findUnique({ where: { storeId: store.id }, select: { templates: true } }),
  ]);

  const data = orders.map((o) => ({
    id: o.id,
    number: o.number,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    channel: o.channel,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
  }));

  return (
    <OrdersTable
      currency={store.currency}
      storeName={store.name}
      orders={data}
      cardPayments={plan.features.cardPayments}
      messageTemplates={(wa?.templates as Record<string, string>) ?? {}}
    />
  );
}
