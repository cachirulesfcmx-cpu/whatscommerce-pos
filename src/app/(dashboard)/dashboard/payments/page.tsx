import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet, CheckCircle2, Clock } from "lucide-react";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "Pagos" };
export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  MANUAL: "Manual", STRIPE: "Stripe", MERCADOPAGO: "Mercado Pago", PAYPAL: "PayPal",
};

export default async function PaymentsPage() {
  const { store } = await getDashboardContext();

  const payments = await prisma.payment.findMany({
    where: { order: { storeId: store.id } },
    include: { order: { select: { number: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const paid = payments.filter((p) => p.status === "PAID");
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Historial de pagos</h1>
        <p className="text-sm text-muted-foreground">{payments.length} pagos registrados</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cobrado" value={formatMoney(totalPaid, store.currency)} icon={CheckCircle2} tone="success" />
        <StatCard label="Pendiente" value={formatMoney(pending, store.currency)} icon={Clock} tone="warning" />
        <StatCard label="Transacciones" value={payments.length} icon={Wallet} />
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin pagos" description="Los pagos de tus pedidos aparecerán aquí." />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Fecha</th><th className="p-3">Pedido</th><th className="p-3">Método</th>
                  <th className="p-3">Proveedor</th><th className="p-3">Estado</th><th className="p-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                    <td className="p-3 font-medium">#{p.order.number}</td>
                    <td className="p-3">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</td>
                    <td className="p-3 text-muted-foreground">{PROVIDER_LABELS[p.provider] ?? p.provider}</td>
                    <td className="p-3">
                      <Badge variant={p.status === "PAID" ? "success" : p.status === "FAILED" ? "destructive" : "secondary"}>
                        {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-medium">{formatMoney(Number(p.amount), p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
