import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { ReportsExport } from "@/components/dashboard/reports-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { DollarSign, Receipt, TrendingUp, Users, Repeat, ShoppingBag } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

export const metadata = { title: "Reportes" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { store, plan } = await getDashboardContext();
  if (!plan.features.reports) {
    return <FeatureGate title="Reportes avanzados" description="Analiza ventas por día, producto, categoría y canal, ticket promedio, recurrencia y conversión con el plan Pro." />;
  }
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [orders, byPayment, topItems, revenueAgg, customers, recurring, items30, carts] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store.id, createdAt: { gte: since }, status: { not: "CANCELED" } },
      select: { total: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { storeId: store.id, status: { not: "CANCELED" } },
      _sum: { total: true }, _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { storeId: store.id, status: { not: "CANCELED" } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 8,
    }),
    prisma.order.aggregate({
      where: { storeId: store.id, status: { not: "CANCELED" } },
      _sum: { total: true }, _avg: { total: true }, _count: true,
    }),
    prisma.customer.count({ where: { storeId: store.id } }),
    prisma.customer.count({ where: { storeId: store.id, ordersCount: { gte: 2 } } }),
    // order items in range with productId for category aggregation
    prisma.orderItem.findMany({
      where: { order: { storeId: store.id, createdAt: { gte: since }, status: { not: "CANCELED" } } },
      select: { productId: true, lineTotal: true },
    }),
    prisma.cart.findMany({ where: { storeId: store.id }, select: { recoveredAt: true } }),
  ]);

  // daily series
  const days: { day: string; total: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const total = orders.filter((o) => o.createdAt.toDateString() === d.toDateString()).reduce((s, o) => s + Number(o.total), 0);
    days.push({ day: d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" }), total: Math.round(total * 100) / 100 });
  }

  // sales by category
  const prodIds = Array.from(new Set(items30.map((i) => i.productId).filter(Boolean))) as string[];
  const prods = await prisma.product.findMany({
    where: { id: { in: prodIds } },
    select: { id: true, category: { select: { name: true } } },
  });
  const catByProd = new Map(prods.map((p) => [p.id, p.category?.name ?? "Sin categoría"]));
  const catTotals = new Map<string, number>();
  for (const it of items30) {
    const cat = it.productId ? catByProd.get(it.productId) ?? "Sin categoría" : "Sin categoría";
    catTotals.set(cat, (catTotals.get(cat) ?? 0) + Number(it.lineTotal));
  }
  const categorySales = Array.from(catTotals.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

  // carts / conversion
  const totalCarts = carts.length;
  const recovered = carts.filter((c) => c.recoveredAt).length;
  const abandoned = totalCarts - recovered;
  const conversion = totalCarts > 0 ? Math.round((recovered / totalCarts) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <ReportsExport
          filename={`ventas-${store.slug}.csv`}
          headers={["Fecha", "Ventas"]}
          rows={days.map((d) => [d.day, d.total])}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ingresos totales" value={formatMoney(Number(revenueAgg._sum.total ?? 0), store.currency)} icon={DollarSign} tone="success" />
        <StatCard label="Pedidos" value={revenueAgg._count} icon={Receipt} />
        <StatCard label="Ticket promedio" value={formatMoney(Number(revenueAgg._avg.total ?? 0), store.currency)} icon={TrendingUp} />
        <StatCard label="Clientes" value={customers} icon={Users} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clientes recurrentes" value={recurring} icon={Repeat} hint={customers ? `${Math.round((recurring / customers) * 100)}% del total` : undefined} />
        <StatCard label="Carritos" value={totalCarts} icon={ShoppingBag} />
        <StatCard label="Carritos abandonados" value={abandoned} icon={ShoppingBag} tone="warning" />
        <StatCard label="Conversión" value={`${conversion}%`} icon={TrendingUp} tone="success" />
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Ventas últimos 30 días</CardTitle></CardHeader>
        <CardContent><SalesChart data={days} /></CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader><CardTitle>Productos más vendidos</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {topItems.map((it) => (
                <li key={it.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <span className="truncate pr-2">{it.name}</span>
                  <span className="shrink-0 text-muted-foreground">{it._sum.quantity ?? 0} uds · {formatMoney(Number(it._sum.lineTotal ?? 0), store.currency)}</span>
                </li>
              ))}
              {topItems.length === 0 && <li className="text-muted-foreground">Sin datos aún.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Ventas por categoría</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {categorySales.map((c) => (
                <li key={c.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{formatMoney(c.total, store.currency)}</span>
                </li>
              ))}
              {categorySales.length === 0 && <li className="text-muted-foreground">Sin datos aún.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Por método de pago</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {byPayment.map((p) => (
                <li key={p.paymentMethod} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <span>{PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</span>
                  <span className="text-muted-foreground">{p._count} · {formatMoney(Number(p._sum.total ?? 0), store.currency)}</span>
                </li>
              ))}
              {byPayment.length === 0 && <li className="text-muted-foreground">Sin datos aún.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
