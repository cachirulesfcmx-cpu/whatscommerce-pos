"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MessageCircle, Save, Loader2, ShoppingBag, DollarSign, CalendarClock, Repeat, X, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatDate, normalizePhone } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { segmentOf, purchaseFrequencyDays } from "@/lib/crm/segment";

interface CustomerDTO {
  id: string; name: string; phone: string; email: string | null; notes: string | null;
  tags: string[]; marketingOptIn: boolean; ordersCount: number; totalSpent: number;
  lastOrderAt: string | null; firstOrderAt: string | null; createdAt: string;
}
interface OrderRow {
  id: string; number: string; status: string; paymentStatus: string; total: number; createdAt: string;
}

export function CustomerProfile({
  currency, customer, orders,
}: {
  currency: string;
  customer: CustomerDTO;
  orders: OrderRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [notes, setNotes] = React.useState(customer.notes ?? "");
  const [tags, setTags] = React.useState<string[]>(customer.tags);
  const [tagInput, setTagInput] = React.useState("");
  const [marketing, setMarketing] = React.useState(customer.marketingOptIn);

  const seg = segmentOf(customer);
  const freq = purchaseFrequencyDays(customer.ordersCount, customer.firstOrderAt, customer.lastOrderAt);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, tags, marketingOptIn: marketing }),
    });
    setSaving(false);
    if (!res.ok) { toast({ variant: "destructive", title: "No se pudo guardar" }); return; }
    toast({ variant: "success", title: "Cliente actualizado" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/customers"><ArrowLeft className="h-4 w-4" /> Clientes</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <Badge variant={seg.variant}>{seg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {customer.phone}{customer.email ? ` · ${customer.email}` : ""} · Cliente desde {formatDate(customer.createdAt)}
          </p>
        </div>
        <Button asChild className="bg-[#25D366] text-white hover:bg-[#1eb959]">
          <a href={`https://wa.me/${normalizePhone(customer.phone)}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" /> Contactar por WhatsApp
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total gastado" value={formatMoney(customer.totalSpent, currency)} icon={DollarSign} tone="success" />
        <StatCard label="Pedidos" value={customer.ordersCount} icon={ShoppingBag} />
        <StatCard label="Última compra" value={customer.lastOrderAt ? formatDate(customer.lastOrderAt).split(",")[0] : "—"} icon={CalendarClock} />
        <StatCard label="Frecuencia" value={freq ? `~${freq} días` : "—"} icon={Repeat} hint={freq ? "entre compras" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle>Historial de pedidos</CardTitle></CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="Sin pedidos" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-2">Pedido</th><th className="p-2">Estado</th><th className="p-2 text-right">Total</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="p-2"><div className="font-medium">#{o.number}</div><div className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</div></td>
                        <td className="p-2"><Badge variant="secondary">{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge></td>
                        <td className="p-2 text-right font-medium">{formatMoney(o.total, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Datos internos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="VIP, mayorista…" className="h-8" />
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={addTag}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas internas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferencias, observaciones…" />
            </div>

            <label className="flex items-center justify-between text-sm">
              <span>Acepta marketing</span>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </label>

            <Button variant="brand" className="w-full" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
