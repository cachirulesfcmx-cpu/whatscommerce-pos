"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Tags, Plus, Minus, AlertTriangle, History, PackageCheck, Loader2, Settings2, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface InvItem {
  id: string; productName: string; variantName: string | null; quantity: number; lowStockAt: number;
}
interface Movement {
  id: string; productName: string; type: string; delta: number;
  reason: string | null; reference: string | null; createdAt: string;
}

const MOVE_LABELS: Record<string, string> = {
  INITIAL: "Inicial", PURCHASE: "Entrada", SALE: "Venta", ADJUSTMENT: "Ajuste", RETURN: "Devolución",
};

export function InventoryManager({
  items, movements, blockOutOfStock: initialBlock,
}: {
  items: InvItem[];
  movements: Movement[];
  blockOutOfStock: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [block, setBlock] = React.useState(initialBlock);
  const [adjust, setAdjust] = React.useState<InvItem | null>(null);
  const [delta, setDelta] = React.useState(0);
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const lowStock = items.filter((i) => i.quantity <= i.lowStockAt);

  async function toggleBlock(v: boolean) {
    setBlock(v);
    const res = await fetch("/api/stores", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockOutOfStock: v }),
    });
    if (!res.ok) { setBlock(!v); toast({ variant: "destructive", title: "No se pudo guardar" }); return; }
    toast({ variant: "success", title: v ? "Venta sin stock bloqueada" : "Venta sin stock permitida" });
  }

  async function quickAdjust(id: string, d: number) {
    const res = await fetch("/api/inventory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: id, delta: d, reason: "Ajuste rápido" }),
    });
    if (!res.ok) { toast({ variant: "destructive", title: "Error al ajustar" }); return; }
    router.refresh();
  }

  async function saveAdjust() {
    if (!adjust || delta === 0) { setAdjust(null); return; }
    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: adjust.id, delta, reason: reason || "Ajuste manual" }),
    });
    setSaving(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Error al ajustar" }); return; }
    toast({ variant: "success", title: "Inventario ajustado" });
    setAdjust(null); setDelta(0); setReason(""); router.refresh();
  }

  async function saveThreshold(id: string, lowStockAt: number) {
    const res = await fetch("/api/inventory", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: id, lowStockAt }),
    });
    if (!res.ok) { toast({ variant: "destructive", title: "Error" }); return; }
    router.refresh();
  }

  function exportCsv() {
    const header = "Producto,Variante,Stock,Umbral\n";
    const rows = items
      .map((i) => [i.productName, i.variantName ?? "", i.quantity, i.lowStockAt].map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inventario.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} con seguimiento · {lowStock.length} con bajo stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span>Bloquear venta sin stock</span>
            <Switch checked={block} onCheckedChange={toggleBlock} />
          </label>
        </div>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock"><PackageCheck className="mr-1.5 h-4 w-4" /> Stock</TabsTrigger>
          <TabsTrigger value="low"><AlertTriangle className="mr-1.5 h-4 w-4" /> Bajo stock ({lowStock.length})</TabsTrigger>
          <TabsTrigger value="moves"><History className="mr-1.5 h-4 w-4" /> Movimientos</TabsTrigger>
        </TabsList>

        {/* STOCK */}
        <TabsContent value="stock">
          {items.length === 0 ? (
            <EmptyState icon={Tags} title="Sin inventario" description="Activa 'Controlar inventario' en tus productos para llevar su stock." />
          ) : (
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3">Producto</th><th className="p-3">Stock</th><th className="p-3">Alerta ≤</th><th className="p-3 text-right">Ajustar</th></tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="p-3"><div className="font-medium">{i.productName}</div>{i.variantName && <div className="text-xs text-muted-foreground">{i.variantName}</div>}</td>
                        <td className="p-3">
                          <span className="font-medium tabular-nums">{i.quantity}</span>
                          {i.quantity <= i.lowStockAt && <Badge variant="warning" className="ml-2">Bajo</Badge>}
                        </td>
                        <td className="p-3">
                          <Input
                            type="number" defaultValue={i.lowStockAt} className="h-8 w-20"
                            onBlur={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v !== i.lowStockAt) saveThreshold(i.id, v); }}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => quickAdjust(i.id, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => quickAdjust(i.id, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setAdjust(i); setDelta(0); setReason(""); }}>Ajuste</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* LOW STOCK REPORT */}
        <TabsContent value="low">
          {lowStock.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Todo en orden" description="Ningún producto está por debajo de su umbral de alerta." />
          ) : (
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3">Producto</th><th className="p-3">Stock</th><th className="p-3">Umbral</th><th className="p-3 text-right">Reabastecer</th></tr>
                  </thead>
                  <tbody>
                    {lowStock.map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="p-3"><div className="font-medium">{i.productName}</div>{i.variantName && <div className="text-xs text-muted-foreground">{i.variantName}</div>}</td>
                        <td className="p-3"><Badge variant={i.quantity === 0 ? "destructive" : "warning"}>{i.quantity}</Badge></td>
                        <td className="p-3 text-muted-foreground">{i.lowStockAt}</td>
                        <td className="p-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => { setAdjust(i); setDelta(10); setReason("Reabastecimiento"); }}>+ Reabastecer</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* MOVEMENTS */}
        <TabsContent value="moves">
          {movements.length === 0 ? (
            <EmptyState icon={History} title="Sin movimientos" description="Las ventas y ajustes aparecerán aquí." />
          ) : (
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3">Fecha</th><th className="p-3">Producto</th><th className="p-3">Tipo</th><th className="p-3">Cambio</th><th className="p-3">Motivo</th></tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="p-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
                        <td className="p-3">{m.productName}</td>
                        <td className="p-3"><Badge variant="secondary">{MOVE_LABELS[m.type] ?? m.type}</Badge></td>
                        <td className={`p-3 font-medium tabular-nums ${m.delta < 0 ? "text-destructive" : "text-emerald-600"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                        <td className="p-3 text-muted-foreground">{m.reason ?? (m.reference ? `Pedido ${m.reference}` : "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Adjust dialog */}
      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar inventario — {adjust?.productName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Stock actual: <strong>{adjust?.quantity}</strong></p>
            <div className="space-y-1.5">
              <Label>Cambio (usa negativo para restar)</Label>
              <Input type="number" value={delta} onChange={(e) => setDelta(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Compra, merma, conteo…" />
            </div>
            <p className="text-sm">Nuevo stock: <strong>{(adjust?.quantity ?? 0) + delta}</strong></p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjust(null)}>Cancelar</Button>
            <Button variant="brand" onClick={saveAdjust} disabled={saving || delta === 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
