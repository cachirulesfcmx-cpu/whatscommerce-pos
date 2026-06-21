"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, CreditCard, MessageCircle, Send } from "lucide-react";
import {
  buildCustomerStatusMessage, customerWaLink, customerContactLink,
} from "@/lib/whatsapp/customer-messages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS,
} from "@/lib/constants";

interface OrderDTO {
  id: string; number: string; customerName: string; customerPhone: string;
  status: string; paymentStatus: string; paymentMethod: string; channel: string;
  total: number; createdAt: string; itemCount: number;
}

const STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED"];

const statusVariant = (s: string) =>
  s === "DELIVERED" ? "success" : s === "CANCELED" || s === "REFUNDED" ? "destructive" : s === "NEW" ? "warning" : "default";

export function OrdersTable({
  currency, storeName, orders, cardPayments, messageTemplates,
}: {
  currency: string;
  storeName: string;
  orders: OrderDTO[];
  cardPayments: boolean;
  messageTemplates?: Record<string, string>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = React.useState("ALL");

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast({ variant: "destructive", title: "Error al actualizar" }); return; }
    toast({ variant: "success", title: "Pedido actualizado" });
    router.refresh();
  }

  function notifyCustomer(o: OrderDTO) {
    const msg = buildCustomerStatusMessage(o.status, {
      storeName, number: o.number, total: o.total, currency, customerName: o.customerName,
    }, messageTemplates);
    window.open(customerWaLink(o.customerPhone, msg), "_blank");
  }

  async function payWithCard(id: string) {
    const res = await fetch(`/api/orders/${id}/pay`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: json?.error?.message }); return; }
    window.open(json.data.url, "_blank");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[200px]">
          <option value="ALL">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Sin pedidos" description="Cuando recibas pedidos aparecerán aquí." />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Pago</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <div className="font-medium">#{o.number}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o.channel}</div>
                    </td>
                    <td className="p-3">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                    </td>
                    <td className="p-3 font-medium">{formatMoney(o.total, currency)}</td>
                    <td className="p-3">
                      <Badge variant={o.paymentStatus === "PAID" ? "success" : "secondary"}>
                        {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                      </Badge>
                      <div className="mt-0.5 text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={statusVariant(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost" size="icon" title="Enviar confirmación al cliente"
                          onClick={() => notifyCustomer(o)}
                        >
                          <Send className="h-4 w-4 text-[#25D366]" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" title="Contactar al cliente"
                          onClick={() => window.open(customerContactLink(o.customerPhone), "_blank")}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {cardPayments && o.paymentStatus !== "PAID" && (
                          <Button variant="outline" size="sm" onClick={() => payWithCard(o.id)}>
                            <CreditCard className="h-3.5 w-3.5" /> Cobrar
                          </Button>
                        )}
                        <Select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} className="h-8 w-[150px] text-xs">
                          {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                        </Select>
                      </div>
                    </td>
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
