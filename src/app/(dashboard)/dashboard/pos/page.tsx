import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { POSTerminal } from "@/components/dashboard/pos-terminal";

export const metadata = { title: "POS" };
export const dynamic = "force-dynamic";

export default async function POSPage() {
  const { store, plan } = await getDashboardContext();

  const [products, customers, recent] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, isActive: true },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
        modifiers: { include: { modifier: true } },
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { storeId: store.id },
      orderBy: { lastOrderAt: "desc" },
      take: 100,
      select: { id: true, name: true, phone: true },
    }),
    prisma.order.findMany({
      where: { storeId: store.id, channel: "POS" },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, number: true, customerName: true, total: true, paymentMethod: true, createdAt: true },
    }),
  ]);

  const productData = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    image: p.images[0]?.url ?? null,
    category: p.category?.name ?? null,
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price ? Number(v.price) : null })),
    extras: p.modifiers.flatMap((m) =>
      ((m.modifier.options as { name: string; price: number }[]) ?? []).map((o) => ({
        name: o.name,
        price: Number(o.price ?? 0),
      }))
    ),
  }));

  return (
    <POSTerminal
      currency={store.currency}
      cardPayments={plan.features.cardPayments}
      products={productData}
      customers={customers}
      recentSales={recent.map((o) => ({
        id: o.id,
        number: o.number,
        customerName: o.customerName,
        total: Number(o.total),
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
