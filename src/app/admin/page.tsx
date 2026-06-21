import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/plans/plans";
import { formatMoney, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { AdminStores } from "@/components/admin/admin-stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Store, DollarSign, ShoppingCart, Ban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/dashboard");

  const [users, storesCount, orders, subs, stores, logs, templates, suspended] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.order.count(),
    prisma.subscription.findMany({ include: { plan: true } }),
    prisma.store.findMany({
      include: {
        owner: { select: { email: true } },
        subscription: { include: { plan: true } },
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.template.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.store.count({ where: { status: "SUSPENDED" } }),
  ]);

  const mrr = subs
    .filter((s) => ["ACTIVE", "TRIALING"].includes(s.status))
    .reduce((sum, s) => sum + Number(s.plan.priceMonthly), 0);

  const byTier = (["BASIC", "PRO", "ENTERPRISE"] as const).map((t) => ({
    tier: t,
    name: PLAN_CONFIG[t].name,
    count: subs.filter((s) => s.plan.tier === t).length,
  }));

  const data = stores.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    ownerEmail: s.owner.email,
    status: s.status,
    tier: s.subscription?.plan.tier ?? "BASIC",
    subStatus: s.subscription?.status ?? "—",
    orders: s._count.orders,
    products: s._count.products,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Métricas de la plataforma</h1>
        <p className="text-sm text-muted-foreground">Visión global de WhatsCommerce POS</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Usuarios" value={users} icon={Users} />
        <StatCard label="Tiendas" value={storesCount} icon={Store} tone="success" />
        <StatCard label="MRR estimado" value={formatMoney(mrr, "MXN")} icon={DollarSign} tone="success" hint={`ARR ${formatMoney(mrr * 12, "MXN")}`} />
        <StatCard label="Pedidos procesados" value={orders} icon={ShoppingCart} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {byTier.map((t) => (
          <div key={t.tier} className="rounded-2xl border bg-card p-4 text-center">
            <div className="text-2xl font-bold">{t.count}</div>
            <div className="text-xs text-muted-foreground">Plan {t.name}</div>
          </div>
        ))}
        <div className="rounded-2xl border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-destructive"><Ban className="h-5 w-5" /> {suspended}</div>
          <div className="text-xs text-muted-foreground">Suspendidas</div>
        </div>
      </div>

      <AdminStores stores={data} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Logs de auditoría</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="p-2">Fecha</th><th className="p-2">Acción</th><th className="p-2">Entidad</th></tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="p-2 text-muted-foreground">{formatDate(l.createdAt)}</td>
                      <td className="p-2"><code className="text-xs">{l.action}</code></td>
                      <td className="p-2 text-muted-foreground">{l.entityType ?? "—"}{l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Sin registros.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plantillas ({templates.length})</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <span>{t.name}</span>
                  {t.isPremium ? <Badge>Premium</Badge> : <Badge variant="secondary">Free</Badge>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
