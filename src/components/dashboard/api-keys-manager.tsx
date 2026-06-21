"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound, Plus, Trash2, Copy, Check, Loader2, Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface KeyRow {
  id: string; name: string; prefix: string;
  lastUsedAt: string | null; revokedAt: string | null; createdAt: string;
}

export function ApiKeysManager({ keys, baseUrl }: { keys: KeyRow[]; baseUrl: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [newKey, setNewKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function create() {
    setSaving(true);
    const res = await fetch("/api/api-keys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Llave sin nombre" }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: json?.error?.message }); return; }
    setNewKey(json.data.key);
    setName("");
    router.refresh();
  }

  async function revoke(id: string) {
    if (!confirm("¿Revocar esta API key? Las integraciones que la usen dejarán de funcionar.")) return;
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (!res.ok) { toast({ variant: "destructive", title: "Error" }); return; }
    toast({ variant: "success", title: "API key revocada" });
    router.refresh();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const curl = `curl ${baseUrl}/api/v1/products \\
  -H "Authorization: Bearer TU_API_KEY"`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">API privada</h1>
          <p className="text-sm text-muted-foreground">Integra tu tienda con sistemas externos.</p>
        </div>
        <Button variant="brand" onClick={() => { setNewKey(null); setOpen(true); }}><Plus className="h-4 w-4" /> Nueva API key</Button>
      </div>

      {keys.length === 0 ? (
        <EmptyState icon={KeyRound} title="Sin API keys" description="Crea una llave para empezar a consumir la API REST." />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Nombre</th><th className="p-3">Llave</th><th className="p-3">Último uso</th><th className="p-3">Estado</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{k.name}</td>
                    <td className="p-3"><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{k.prefix}…</code></td>
                    <td className="p-3 text-muted-foreground">{k.lastUsedAt ? formatDate(k.lastUsedAt) : "Nunca"}</td>
                    <td className="p-3">{k.revokedAt ? <Badge variant="destructive">Revocada</Badge> : <Badge variant="success">Activa</Badge>}</td>
                    <td className="p-3 text-right">
                      {!k.revokedAt && <Button variant="ghost" size="icon" onClick={() => revoke(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Terminal className="h-4 w-4" /> Endpoints disponibles</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-1 font-mono text-xs">
            <li><Badge variant="secondary">GET</Badge> /api/v1/products</li>
            <li><Badge variant="secondary">GET</Badge> /api/v1/customers</li>
            <li><Badge variant="secondary">GET</Badge> /api/v1/orders</li>
            <li><Badge variant="default">POST</Badge> /api/v1/orders</li>
          </ul>
          <p className="text-muted-foreground">Autentícate con el header <code className="rounded bg-muted px-1">Authorization: Bearer TU_API_KEY</code>.</p>
          <pre className="overflow-x-auto rounded-xl bg-foreground/90 p-3 text-xs text-background">{curl}</pre>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{newKey ? "Tu nueva API key" : "Crear API key"}</DialogTitle></DialogHeader>
          {newKey ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Cópiala ahora — por seguridad no podrás verla de nuevo.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-muted p-3 text-xs">{newKey}</code>
                <Button variant="outline" size="icon" onClick={() => copy(newKey)}>{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre de la llave</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Integración ERP, Zapier…" />
              </div>
            </div>
          )}
          <DialogFooter>
            {newKey ? (
              <Button variant="brand" onClick={() => { setOpen(false); setNewKey(null); }}>Listo</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="brand" onClick={create} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Crear</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
