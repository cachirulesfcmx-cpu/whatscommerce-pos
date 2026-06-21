"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Minus, Trash2, Loader2, MessageCircle, Receipt, History, Tag, CreditCard, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

interface Extra { name: string; price: number }
interface POSProduct {
  id: string; name: string; price: number; image: string | null; category: string | null;
  variants: { id: string; name: string; price: number | null }[];
  extras: Extra[];
}
interface Line {
  key: string; productId: string; variantId: string | null; name: string; variantName: string | null;
  unitPrice: number; quantity: number; extras: Extra[];
}
interface CustomerLite { id: string; name: string; phone: string }
interface Sale {
  id: string; number: string; customerName: string; total: number; paymentMethod: string; createdAt: string;
}

export function POSTerminal({
  currency, cardPayments, products, customers, recentSales,
}: {
  currency: string;
  cardPayments: boolean;
  products: POSProduct[];
  customers: CustomerLite[];
  recentSales: Sale[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState<string | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [payment, setPayment] = React.useState("CASH");
  const [customerId, setCustomerId] = React.useState("");
  const [customer, setCustomer] = React.useState({ name: "Cliente mostrador", phone: "" });
  const [loading, setLoading] = React.useState(false);
  const [config, setConfig] = React.useState<POSProduct | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const filtered = products.filter(
    (p) => (!cat || p.category === cat) && p.name.toLowerCase().includes(query.toLowerCase())
  );
  const subtotal = lines.reduce((s, l) => s + (l.unitPrice + l.extras.reduce((e, x) => e + x.price, 0)) * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function pushLine(p: POSProduct, variantId: string | null, extras: Extra[]) {
    const variant = p.variants.find((v) => v.id === variantId);
    const unitPrice = variant?.price ?? p.price;
    setLines((prev) => [
      ...prev,
      {
        key: Math.random().toString(36).slice(2),
        productId: p.id, variantId: variant?.id ?? null, name: p.name,
        variantName: variant?.name ?? null, unitPrice, quantity: 1, extras,
      },
    ]);
  }

  function addProduct(p: POSProduct) {
    if (p.variants.length > 1 || p.extras.length > 0) {
      setConfig(p);
    } else {
      pushLine(p, p.variants[0]?.id ?? null, []);
    }
  }

  function setQty(key: string, qty: number) {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: qty } : l))));
  }

  function selectCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c) setCustomer({ name: c.name, phone: c.phone });
    else setCustomer({ name: "Cliente mostrador", phone: "" });
  }

  async function charge() {
    if (lines.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({
          productId: l.productId, variantId: l.variantId, name: l.name, variantName: l.variantName,
          unitPrice: l.unitPrice, quantity: l.quantity, extras: l.extras,
        })),
        customer: { name: customer.name || "Cliente mostrador", phone: customer.phone || "0000000000" },
        deliveryMethod: "PICKUP", paymentMethod: payment,
        manualDiscount: discount > 0 ? discount : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast({ variant: "destructive", title: "No se pudo cobrar", description: json?.error?.message });
      return;
    }
    // Card payment via Stripe (optional)
    if (payment === "CARD" && cardPayments) {
      const pay = await fetch(`/api/orders/${json.data.orderId}/pay`, { method: "POST" });
      const pj = await pay.json();
      if (pay.ok && pj.data?.url) window.open(pj.data.url, "_blank");
    }
    if (json.data.waLink) window.open(json.data.waLink, "_blank");
    setLoading(false);
    toast({ variant: "success", title: `Venta ${json.data.number} registrada` });
    setLines([]); setDiscount(0); setCustomerId(""); setCustomer({ name: "Cliente mostrador", phone: "" });
    router.refresh();
  }

  return (
    <Tabs defaultValue="sell">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Punto de venta</h1>
        <TabsList>
          <TabsTrigger value="sell"><Receipt className="mr-1.5 h-4 w-4" /> Vender</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" /> Historial</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="sell">
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar producto…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setCat(null)} className={cn("whitespace-nowrap rounded-full border px-3 py-1 text-sm", !cat && "bg-primary text-white border-primary")}>Todo</button>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCat(c)} className={cn("whitespace-nowrap rounded-full border px-3 py-1 text-sm", cat === c && "bg-primary text-white border-primary")}>{c}</button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <button key={p.id} onClick={() => addProduct(p)} className="rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />
                  ) : <div className="mb-2 h-20 w-full rounded-lg bg-muted" />}
                  <div className="line-clamp-1 text-sm font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{formatMoney(p.price, currency)}</div>
                  {(p.variants.length > 1 || p.extras.length > 0) && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">opciones</Badge>
                  )}
                </button>
              ))}
              {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Sin productos</p>}
            </div>
          </div>

          <Card className="glass-card h-fit lg:sticky lg:top-4">
            <CardContent className="space-y-3 p-4">
              <h2 className="flex items-center gap-2 font-semibold"><Receipt className="h-4 w-4" /> Ticket</h2>
              {lines.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Agrega productos</p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                  {lines.map((l) => (
                    <li key={l.key} className="flex items-start gap-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{l.name}{l.variantName ? ` · ${l.variantName}` : ""}</div>
                        {l.extras.length > 0 && <div className="truncate text-xs text-muted-foreground">+ {l.extras.map((e) => e.name).join(", ")}</div>}
                        <div className="text-xs text-muted-foreground">{formatMoney(l.unitPrice + l.extras.reduce((e, x) => e + x.price, 0), currency)}</div>
                      </div>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(l.key, l.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-5 text-center">{l.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(l.key, l.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQty(l.key, 0)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 border-t pt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cliente</Label>
                  <Select value={customerId} onChange={(e) => selectCustomer(e.target.value)}>
                    <option value="">Cliente mostrador / nuevo</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
                  </Select>
                  {!customerId && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Nombre" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                      <Input placeholder="WhatsApp" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="Descuento" value={discount || ""} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} className="h-8" />
                </div>

                <Select value={payment} onChange={(e) => setPayment(e.target.value)}>
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  {cardPayments && <option value="CARD">Tarjeta (Stripe)</option>}
                </Select>
              </div>

              <div className="space-y-1 border-t pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento</span><span>-{formatMoney(discount, currency)}</span></div>}
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatMoney(total, currency)}</span></div>
              </div>

              <Button variant="brand" className="w-full" onClick={charge} disabled={loading || lines.length === 0}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : payment === "CARD" ? <CreditCard className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                Cobrar {formatMoney(total, currency)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="history">
        {recentSales.length === 0 ? (
          <EmptyState icon={History} title="Sin ventas en POS" description="Las ventas de mostrador aparecerán aquí." />
        ) : (
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3">Venta</th><th className="p-3">Cliente</th><th className="p-3">Pago</th><th className="p-3 text-right">Total</th></tr>
                </thead>
                <tbody>
                  {recentSales.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-3"><div className="font-medium">#{s.number}</div><div className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</div></td>
                      <td className="p-3">{s.customerName}</td>
                      <td className="p-3"><Badge variant="secondary">{PAYMENT_METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}</Badge></td>
                      <td className="p-3 text-right font-medium">{formatMoney(s.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </TabsContent>

      {/* Variant + extras config dialog */}
      <Dialog open={!!config} onOpenChange={(o) => !o && setConfig(null)}>
        {config && <ConfigDialog product={config} currency={currency} onAdd={(vId, extras) => { pushLine(config, vId, extras); setConfig(null); }} onClose={() => setConfig(null)} />}
      </Dialog>
    </Tabs>
  );
}

function ConfigDialog({
  product, currency, onAdd, onClose,
}: {
  product: POSProduct;
  currency: string;
  onAdd: (variantId: string | null, extras: Extra[]) => void;
  onClose: () => void;
}) {
  const [variantId, setVariantId] = React.useState(product.variants[0]?.id ?? "");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  function toggle(name: string) {
    setSelected((s) => ({ ...s, [name]: !s[name] }));
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{product.name}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        {product.variants.length > 1 && (
          <div className="space-y-1.5">
            <Label>Variante</Label>
            <Select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>{v.name}{v.price != null ? ` · ${formatMoney(v.price, currency)}` : ""}</option>
              ))}
            </Select>
          </div>
        )}
        {product.extras.length > 0 && (
          <div className="space-y-2">
            <Label>Extras</Label>
            {product.extras.map((ex) => (
              <label key={ex.name} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={!!selected[ex.name]} onChange={() => toggle(ex.name)} />
                  {ex.name}
                </span>
                <span className="text-muted-foreground">+{formatMoney(ex.price, currency)}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="brand" onClick={() => onAdd(variantId || null, product.extras.filter((e) => selected[e.name]))}>
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
