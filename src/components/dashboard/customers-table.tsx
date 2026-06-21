"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Plus, Download, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatDate, normalizePhone } from "@/lib/utils";
import { segmentOf } from "@/lib/crm/segment";

interface CustomerDTO {
  id: string; name: string; phone: string; email: string | null;
  ordersCount: number; totalSpent: number; lastOrderAt: string | null; tags: string[];
}

export function CustomersTable({ currency, customers }: { currency: string; customers: CustomerDTO[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [segFilter, setSegFilter] = React.useState("ALL");
  const [query, setQuery] = React.useState("");
  const [form, setForm] = React.useState({ name: "", phone: "", email: "" });

  const rows = customers
    .map((c) => ({ ...c, seg: segmentOf(c) }))
    .filter((c) => (segFilter === "ALL" || c.seg.key === segFilter))
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query));

  async function save() {
    setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: [], marketingOptIn: false }),
    });
    setSaving(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Error al guardar" }); return; }
    toast({ variant: "success", title: "Cliente guardado" });
    setOpen(false); setForm({ name: "", phone: "", email: "" }); router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Clientes</h1><p className="text-sm text-muted-foreground">{customers.length} clientes</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/api/customers?format=csv", "_blank")}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="brand" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nuevo cliente</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar por nombre o teléfono…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        <Select value={segFilter} onChange={(e) => setSegFilter(e.target.value)} className="max-w-[200px]">
          <option value="ALL">Todos los segmentos</option>
          <option value="new">Nuevos</option>
          <option value="repeat">Recurrentes</option>
          <option value="vip">VIP</option>
          <option value="inactive">Inactivos</option>
        </Select>
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="Sin clientes" description="Tus clientes se crean automáticamente con cada pedido." />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Cliente</th><th className="p-3">Segmento</th><th className="p-3">Pedidos</th><th className="p-3">Total gastado</th><th className="p-3">Última compra</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <Link href={`/dashboard/customers/${c.id}`} className="font-medium hover:text-primary hover:underline">{c.name}</Link>
                      <div className="text-xs text-muted-foreground">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
                    </td>
                    <td className="p-3"><Badge variant={c.seg.variant}>{c.seg.label}</Badge></td>
                    <td className="p-3"><Badge variant="secondary">{c.ordersCount}</Badge></td>
                    <td className="p-3 font-medium">{formatMoney(c.totalSpent, currency)}</td>
                    <td className="p-3 text-muted-foreground">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</td>
                    <td className="p-3 text-right">
                      <Button asChild variant="ghost" size="icon"><a href={`https://wa.me/${normalizePhone(c.phone)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 text-[#25D366]" /></a></Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sin clientes en este segmento.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="brand" onClick={save} disabled={saving || !form.name || !form.phone}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
