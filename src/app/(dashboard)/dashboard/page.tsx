import Link from "next/link";
import {
  DollarSign, ShoppingCart, Clock, XCircle, Users, Boxes,
  MessageCircle, TrendingUp, Plus, ExternalLink,
} from "lucide-react";
import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { getPlanUsage } from "@/lib/plans/usage";
import { formatMoney } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { PlanUsageCard } from "@/components/dashboard/plan-usage-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const { store } = await getDashboardContext();
  const currency = store.currency;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const last7 = new Date();
  last7.setDate(last7.getDate() - 6);
  last7.setHours(0, 0, 0, 0);

  const [
    todayAgg, pending, paid, canceled, productsCount, customersCount,
    recentCustomers, topItems, weekOrders, whatsapp,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { storeId: store.id, createdAt: { gte: startOfDay }, status: { not: "CANCELED" } },
      _sum: { total: true }, _count: true,
    }),
    prisma.order.count({ where: { storeId: store.id, status: { in: ["NEW", "CONFIRMED", "PREPARING"] } } }),
    prisma.order.count({ where: { storeId: store.id, paymentStatus: "PAID" } }),
    prisma.order.count({ where: { storeId: store.id, status: "CANCELED" } }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.customer.count({ where: { storeId: store.id } }),
    prisma.customer.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { storeId: store.id, status: { not: "CANCELED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      where: { storeId: store.id, createdAt: { gte: last7 }, status: { not: "CANCELED" } },
      select: { total: true, createdAt: true },
    }),
    prisma.whatsAppSettings.findUnique({ where: { storeId: store.id } }),
  ]);

  const usage = await getPlanUsage(store.id);

  // Build last-7-days series
  const days: { day: string; total: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(last7);
    d.setDate(last7.getDate() + i);
    const label = d.toLocaleDateString("es-MX", { weekday: "short" });
    const total = weekOrders
      .filter((o) => o.createdAt.toDateString() === d.toDateString())
      .reduce((s, o) => s + Number(o.total), 0);
    days.push({ day: label, total: Math.round(total * 100) / 100 });
  }

  const todaySales = Number(todayAgg._sum.total ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hola 👋</h1>
          <p className="text-sm text-muted-foreground">Resumen de {store.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/store/${store.slug}`} target="_blank">
              Ver tienda <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/dashboard/products"><Plus className="h-4 w-4" /> Agregar producto</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ventas de hoy" value={formatMoney(todaySales, currency)} icon={DollarSign} tone="success" hint={`${todayAgg._count} pedidos`} />
        <StatCard label="Pedidos pendientes" value={pending} icon={Clock} tone="warning" />
        <StatCard label="Pedidos pagados" value={paid} icon={ShoppingCart} />
        <StatCard label="Cancelados" value={canceled} icon={XCircle} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Ventas últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={days} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle>Estado</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="h-4 w-4" /> WhatsApp</span>
                {whatsapp?.phone ? <Badge variant="success">Conectado</Badge> : <Badge variant="warning">Sin configurar</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Boxes className="h-4 w-4" /> Productos</span>
                <span className="font-medium">{productsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Clientes</span>
                <span className="font-medium">{customersCount}</span>
              </div>
            </CardContent>
          </Card>

          <PlanUsageCard
            planName={usage.planName}
            tier={usage.tier}
            metrics={usage.metrics}
            anyNear={usage.anyNear}
            anyReached={usage.anyReached}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle>Productos más vendidos</CardTitle></CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <EmptyState icon={Boxes} title="Aún sin ventas" description="Cuando recibas pedidos, verás aquí tus productos estrella." />
            ) : (
              <ul className="space-y-2">
                {topItems.map((it, i) => (
                  <li key={it.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                    <span className="flex items-center gap-3"><span className="text-muted-foreground">{i + 1}</span> {it.name}</span>
                    <Badge variant="secondary">{it._sum.quantity ?? 0} vendidos</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Clientes recientes</CardTitle></CardHeader>
          <CardContent>
            {recentCustomers.length === 0 ? (
              <EmptyState icon={Users} title="Sin clientes todavía" />
            ) : (
              <ul className="space-y-2">
                {recentCustomers.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c.phone}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
