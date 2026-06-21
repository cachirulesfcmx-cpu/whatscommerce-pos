"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Tags, Plus, Minus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";

interface InvDTO { id: string; productName: string; variantName: string | null; quantity: number; lowStockAt: number; }

export function InventoryTable({ items }: { items: InvDTO[] }) {
  const router = useRouter();
  const { toast } = useToast();

  async function adjust(id: string, delta: number) {
    const res = await fetch("/api/inventory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: id, delta, reason: "Ajuste manual" }),
    });
    if (!res.ok) { toast({ variant: "destructive", title: "Error al ajustar" }); return; }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold">Inventario</h1><p className="text-sm text-muted-foreground">{items.length} productos con stock</p></div>
      {items.length === 0 ? (
        <EmptyState icon={Tags} title="Sin inventario" description="Activa 'Controlar inventario' en tus productos para llevar su stock." />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Producto</th><th className="p-3">Stock</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3"><div className="font-medium">{i.productName}</div>{i.variantName && <div className="text-xs text-muted-foreground">{i.variantName}</div>}</td>
                    <td className="p-3">
                      <span className="font-medium">{i.quantity}</span>
                      {i.quantity <= i.lowStockAt && <Badge variant="warning" className="ml-2 gap-1"><AlertTriangle className="h-3 w-3" /> Bajo</Badge>}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjust(i.id, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjust(i.id, 1)}><Plus className="h-3.5 w-3.5" /></Button>
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
