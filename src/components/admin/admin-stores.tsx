"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Ban, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface StoreRow {
  id: string; name: string; slug: string; ownerEmail: string; status: string;
  tier: string; subStatus: string; orders: number; products: number; createdAt: string;
}

export function AdminStores({ stores }: { stores: StoreRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = React.useState("");

  const rows = stores.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.ownerEmail.toLowerCase().includes(q.toLowerCase())
  );

  async function update(id: string, body: Record<string, string>) {
    const res = await fetch(`/api/admin/stores/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) { toast({ variant: "destructive", title: "Error" }); return; }
    toast({ variant: "success", title: "Tienda actualizada" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tiendas ({stores.length})</h2>
        <Input placeholder="Buscar tienda o dueño…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Tienda</th><th className="p-3">Plan</th><th className="p-3">Estado</th>
                <th className="p-3">Pedidos</th><th className="p-3">Alta</th><th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.ownerEmail}</div>
                  </td>
                  <td className="p-3">
                    <Select value={s.tier} onChange={(e) => update(s.id, { tier: e.target.value })} className="h-8 w-[140px] text-xs">
                      <option value="BASIC">Básico</option>
                      <option value="PRO">Pro</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Badge variant={s.status === "ACTIVE" ? "success" : s.status === "SUSPENDED" ? "destructive" : "secondary"}>
                      {s.status === "ACTIVE" ? "Activa" : s.status === "SUSPENDED" ? "Suspendida" : "Archivada"}
                    </Badge>
                  </td>
                  <td className="p-3">{s.orders} · {s.products} prod.</td>
                  <td className="p-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon"><a href={`/store/${s.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                      {s.status === "ACTIVE" ? (
                        <Button variant="ghost" size="sm" onClick={() => update(s.id, { status: "SUSPENDED" })}><Ban className="h-4 w-4 text-destructive" /> Suspender</Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => update(s.id, { status: "ACTIVE" })}><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Activar</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sin resultados.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
