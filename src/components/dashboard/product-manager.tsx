"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Search, Boxes, Star, Loader2, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/utils";

interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  type: string;
  categoryId: string | null;
  categoryName: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  trackInventory: boolean;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  instagramUrls: string[];
  licenseCodes: string[];
  images: { url: string; alt: string; sortOrder: number }[];
  variants: { name: string; price: number | null; options: { type: string; value: string }[] }[];
  stock: number;
}

const empty: ProductDTO = {
  id: "", name: "", description: "", type: "PHYSICAL", categoryId: null, categoryName: null,
  price: 0, compareAtPrice: null, sku: "", trackInventory: false, isActive: true,
  isFeatured: false, tags: [], instagramUrls: [], licenseCodes: [], images: [], variants: [], stock: 0,
};

export function ProductManager({
  currency, initialProducts, categories, features, limit,
}: {
  currency: string;
  initialProducts: ProductDTO[];
  categories: { id: string; name: string }[];
  features: { variants: boolean; inventory: boolean };
  limit: number | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [products] = React.useState(initialProducts);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProductDTO | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [form, setForm] = React.useState<ProductDTO>(empty);

  async function generateImage() {
    if (!form.name) return;
    setAiLoading(true);
    const prompt = [form.name, form.description].filter(Boolean).join(". ");
    const res = await fetch("/api/ai/product-image", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const json = await res.json();
    setAiLoading(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "IA no disponible", description: json?.error?.message ?? "Configura las claves de IA." });
      return;
    }
    set("images", [{ url: json.data.url, alt: form.name, sortOrder: 0 }]);
    toast({ variant: "success", title: "Imagen generada" });
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const atLimit = limit != null && products.length >= limit;

  function openCreate() {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  }
  function openEdit(p: ProductDTO) {
    setEditing(p);
    setForm({ ...empty, ...p, licenseCodes: [] });
    setOpen(true);
  }

  function set<K extends keyof ProductDTO>(k: K, v: ProductDTO[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      categoryId: form.categoryId,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      sku: form.sku || null,
      trackInventory: form.trackInventory,
      stock: form.stock,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      tags: form.tags,
      instagramUrls: form.instagramUrls,
      licenseCodes: form.licenseCodes,
      images: form.images.filter((i) => i.url),
      variants: form.variants.map((v) => ({ name: v.name, price: v.price, options: v.options })),
      modifierIds: [],
    };
    const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: json?.error?.message ?? "No se pudo guardar." });
      return;
    }
    toast({ variant: "success", title: editing ? "Producto actualizado" : "Producto creado" });
    setOpen(false);
    router.refresh();
  }

  async function remove(p: ProductDTO) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
      return;
    }
    toast({ variant: "success", title: "Producto eliminado" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {products.length}{limit != null ? ` / ${limit}` : ""} productos
          </p>
        </div>
        <Button variant="brand" onClick={openCreate} disabled={atLimit}>
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      </div>

      {atLimit && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span>
              Alcanzaste el límite de <strong>{limit}</strong> productos de tu plan. Mejora a Pro para productos ilimitados.
            </span>
            <Button asChild variant="brand" size="sm">
              <Link href="/dashboard/upgrade">Mejorar plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar productos…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Sin productos"
          description="Agrega tu primer producto para empezar a vender."
          action={<Button variant="brand" onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo producto</Button>}
        />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.images[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Boxes className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                        <div>
                          <div className="flex items-center gap-1 font-medium">
                            {p.name}
                            {p.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                          </div>
                          {p.trackInventory && <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.categoryName ?? "—"}</td>
                    <td className="p-3 font-medium">{formatMoney(p.price, currency)}</td>
                    <td className="p-3">
                      {p.isActive ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Oculto</Badge>}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Precio</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Precio antes (opcional)</Label>
                <Input type="number" step="0.01" value={form.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={form.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="PHYSICAL">Físico</option>
                  <option value="DIGITAL">Digital</option>
                  <option value="SERVICE">Servicio</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Imagen (URL)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={generateImage} disabled={aiLoading || !form.name}>
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Generar con IA
                </Button>
              </div>
              <Input
                placeholder="https://…"
                value={form.images[0]?.url ?? ""}
                onChange={(e) => set("images", e.target.value ? [{ url: e.target.value, alt: form.name, sortOrder: 0 }] : [])}
              />
              {form.images[0]?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.images[0].url} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Etiquetas (separadas por coma)</Label>
              <Input
                value={form.tags.join(", ")}
                onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
              />
            </div>

            <div className="space-y-2">
              <Label>Posts de Instagram (una URL por línea)</Label>
              <Textarea
                rows={2}
                placeholder="https://instagram.com/p/..."
                value={form.instagramUrls.join("\n")}
                onChange={(e) => set("instagramUrls", e.target.value.split("\n").map((u) => u.trim()).filter(Boolean))}
              />
              <p className="text-xs text-muted-foreground">Se muestran en la ficha del producto para dar confianza.</p>
            </div>

            {form.type === "DIGITAL" && (
              <div className="space-y-2">
                <Label>Códigos de licencia (uno por línea)</Label>
                <Textarea
                  rows={3}
                  placeholder={"LICENCIA-0001\nLICENCIA-0002"}
                  value={form.licenseCodes.join("\n")}
                  onChange={(e) => set("licenseCodes", e.target.value.split("\n").map((c) => c.trim()).filter(Boolean))}
                />
                <p className="text-xs text-muted-foreground">Se asignan automáticamente a cada pedido confirmado y se muestran al cliente.</p>
              </div>
            )}

            {features.inventory && (
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <Label>Controlar inventario</Label>
                  <p className="text-xs text-muted-foreground">Lleva el stock de este producto.</p>
                </div>
                <div className="flex items-center gap-3">
                  {form.trackInventory && (
                    <Input className="w-24" type="number" value={form.stock} onChange={(e) => set("stock", parseInt(e.target.value) || 0)} />
                  )}
                  <Switch checked={form.trackInventory} onCheckedChange={(v) => set("trackInventory", v)} />
                </div>
              </div>
            )}

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} /> Activo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} /> Destacado
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="brand" onClick={save} disabled={saving || !form.name}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
