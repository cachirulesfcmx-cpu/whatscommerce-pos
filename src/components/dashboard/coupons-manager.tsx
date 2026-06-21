"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Ticket, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/utils";

interface CouponDTO {
  id: string; code: string; type: string; value: number;
  minOrderAmount: number | null; maxUses: number | null; usedCount: number; isActive: boolean;
}

const TYPE_LABELS: Record<string, string> = { PERCENTAGE: "Porcentaje", FIXED: "Monto fijo", FREE_SHIPPING: "Envío gratis" };

export function CouponsManager({ currency, coupons }: { currency: string; coupons: CouponDTO[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", type: "PERCENTAGE", value: 10, minOrderAmount: "", maxUses: "" });

  async function save() {
    setSaving(true);
    const res = await fetch("/api/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code, type: form.type, value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null, isActive: true,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: json?.error?.message }); return; }
    toast({ variant: "success", title: "Cupón creado" });
    setOpen(false); router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar cupón?")) return;
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Cupones</h1><p className="text-sm text-muted-foreground">{coupons.length} cupones</p></div>
        <Button variant="brand" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nuevo cupón</Button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={Ticket} title="Sin cupones" description="Crea promociones para impulsar tus ventas." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <Card key={c.id} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono text-lg font-bold">{c.code}</span>{c.isActive ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.type === "PERCENTAGE" ? `${c.value}% de descuento` : c.type === "FIXED" ? `${formatMoney(c.value, currency)} de descuento` : "Envío gratis"}
                  </p>
                  {c.minOrderAmount ? <p className="text-xs text-muted-foreground">Mínimo {formatMoney(c.minOrderAmount, currency)}</p> : null}
                  <p className="text-xs text-muted-foreground">Usos: {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo cupón</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Código</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VERANO10" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tipo</Label>
                <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </div>
              {form.type !== "FREE_SHIPPING" && (
                <div className="space-y-1.5"><Label>{form.type === "PERCENTAGE" ? "% descuento" : "Monto"}</Label><Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} /></div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Compra mínima</Label><Input type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Máx. usos</Label><Input type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="brand" onClick={save} disabled={saving || !form.code}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
