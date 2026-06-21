import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { CustomersTable } from "@/components/dashboard/customers-table";
import { FeatureGate } from "@/components/dashboard/feature-gate";

export const metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { store, plan } = await getDashboardContext();
  if (!plan.features.customers) {
    return <FeatureGate title="Clientes / CRM" description="Gestiona tu cartera de clientes, historial y segmentos con el plan Pro." />;
  }
  const customers = await prisma.customer.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });
  const data = customers.map((c) => ({
    id: c.id, name: c.name, phone: c.phone, email: c.email,
    ordersCount: c.ordersCount, totalSpent: Number(c.totalSpent),
    lastOrderAt: c.lastOrderAt?.toISOString() ?? null, tags: c.tags,
  }));
  return <CustomersTable currency={store.currency} customers={data} />;
}
