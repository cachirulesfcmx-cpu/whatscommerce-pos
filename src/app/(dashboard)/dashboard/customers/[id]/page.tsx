import { notFound } from "next/navigation";
import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { CustomerProfile } from "@/components/dashboard/customer-profile";

export const metadata = { title: "Cliente" };
export const dynamic = "force-dynamic";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { store, plan } = await getDashboardContext();
  if (!plan.features.customers) {
    return <FeatureGate title="CRM de clientes" description="Perfiles, historial y segmentación con el plan Pro." />;
  }

  const customer = await prisma.customer.findFirst({ where: { id, storeId: store.id } });
  if (!customer) notFound();

  const [orders, firstOrder] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store.id, customerId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, number: true, status: true, paymentStatus: true, total: true, createdAt: true },
    }),
    prisma.order.findFirst({
      where: { storeId: store.id, customerId: id },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  return (
    <CustomerProfile
      currency={store.currency}
      customer={{
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        tags: customer.tags,
        marketingOptIn: customer.marketingOptIn,
        ordersCount: customer.ordersCount,
        totalSpent: Number(customer.totalSpent),
        lastOrderAt: customer.lastOrderAt?.toISOString() ?? null,
        firstOrderAt: firstOrder?.createdAt.toISOString() ?? null,
        createdAt: customer.createdAt.toISOString(),
      }}
      orders={orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
