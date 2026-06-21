"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, MessageCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";

interface Method { method: string; label: string; fee?: number }

export function CheckoutForm({
  storeId, slug, currency, accent, deliveryMethods, paymentMethods,
}: {
  storeId: string;
  slug: string;
  currency: string;
  accent: string;
  deliveryMethods: Method[];
  paymentMethods: Method[];
}) {
  const { toast } = useToast();
  const { lines, clear, token } = useCart();
  const subtotal = useCart((s) => s.subtotal());

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<{ number: string; waLink: string | null } | null>(null);
  const [delivery, setDelivery] = React.useState(deliveryMethods[0]?.method ?? "PICKUP");
  const [payment, setPayment] = React.useState(paymentMethods[0]?.method ?? "CASH");
  const [coupon, setCoupon] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ code: string; type: string; value: number } | null>(null);
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", line1: "", references: "", notes: "" });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const shipping = Number(deliveryMethods.find((d) => d.method === delivery)?.fee ?? 0);

  // Track cart for abandoned-cart / conversion analytics (best-effort)
  React.useEffect(() => {
    if (lines.length === 0) return;
    fetch("/api/cart/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, token, subtotal, items: lines }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "PERCENTAGE") discount = (subtotal * appliedCoupon.value) / 100;
    else if (appliedCoupon.type === "FIXED") discount = Math.min(appliedCoupon.value, subtotal);
  }
  const freeShip = appliedCoupon?.type === "FREE_SHIPPING";
  const total = Math.max(0, subtotal - discount) + (freeShip ? 0 : shipping);
  const needsAddress = delivery !== "PICKUP";

  async function applyCoupon() {
    if (!coupon) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, code: coupon, subtotal }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast({ variant: "destructive", title: "Cupón inválido", description: json?.error?.message });
      return;
    }
    setAppliedCoupon(json.data);
    toast({ variant: "success", title: "Cupón aplicado" });
  }

  async function submit() {
    if (!form.name || !form.phone) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Nombre y teléfono son obligatorios." });
      return;
    }
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        cartToken: token,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          name: l.name,
          variantName: l.variantName,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          extras: l.extras,
          notes: l.notes,
        })),
        customer: { name: form.name, phone: form.phone, email: form.email || null },
        deliveryMethod: delivery,
        address: needsAddress ? { line1: form.line1, references: form.references } : null,
        paymentMethod: payment,
        couponCode: appliedCoupon?.code ?? null,
        notes: form.notes || null,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "No se pudo crear el pedido", description: json?.error?.message });
      return;
    }
    clear();
    setSuccess({ number: json.data.number, waLink: json.data.waLink });
    // auto-open WhatsApp
    if (json.data.waLink) window.open(json.data.waLink, "_blank");
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold">¡Pedido recibido!</h1>
        <p className="mt-1 text-muted-foreground">
          Tu pedido <span className="font-semibold">#{success.number}</span> fue creado.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Envía el resumen por WhatsApp para confirmar con la tienda.
        </p>
        {success.waLink && (
          <Button asChild className="mt-6 w-full bg-[#25D366] text-white hover:bg-[#1eb959]">
            <a href={success.waLink} target="_blank" rel="noreferrer">
              <MessageCircle className="h-5 w-5" /> Enviar pedido por WhatsApp
            </a>
          </Button>
        )}
        <Button asChild variant="ghost" className="mt-3">
          <Link href={`/store/${slug}`}>Volver a la tienda</Link>
        </Button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold">Tu carrito está vacío</h1>
        <Button asChild variant="brand" className="mt-4"><Link href={`/store/${slug}`}>Ir a la tienda</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/store/${slug}`}><ArrowLeft className="h-4 w-4" /> Seguir comprando</Link>
      </Button>
      <h1 className="text-2xl font-bold">Finalizar pedido</h1>

      <div className="mt-6 space-y-5">
        {/* customer */}
        <Card><CardContent className="space-y-4 p-5">
          <h2 className="font-semibold">Tus datos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Teléfono (WhatsApp) *</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="5215512345678" /></div>
          </div>
          <div className="space-y-1.5"><Label>Email (opcional)</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        </CardContent></Card>

        {/* delivery */}
        <Card><CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Entrega</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {deliveryMethods.map((d) => (
              <button key={d.method} onClick={() => setDelivery(d.method)} className={cn("rounded-xl border p-3 text-left text-sm", delivery === d.method && "ring-2 ring-primary")}>
                <span className="font-medium">{d.label}</span>
                <span className="block text-xs text-muted-foreground">{d.fee ? formatMoney(d.fee, currency) : "Gratis"}</span>
              </button>
            ))}
          </div>
          {needsAddress && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label>Dirección</Label><Input value={form.line1} onChange={(e) => set("line1", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Referencias</Label><Input value={form.references} onChange={(e) => set("references", e.target.value)} /></div>
            </div>
          )}
        </CardContent></Card>

        {/* payment */}
        <Card><CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Pago</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {paymentMethods.map((p) => (
              <button key={p.method} onClick={() => setPayment(p.method)} className={cn("rounded-xl border p-3 text-left text-sm", payment === p.method && "ring-2 ring-primary")}>
                {p.label}
              </button>
            ))}
          </div>
        </CardContent></Card>

        {/* coupon + notes */}
        <Card><CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Cupón y notas</h2>
          <div className="flex gap-2">
            <Input placeholder="Código de cupón" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
            <Button variant="outline" onClick={applyCoupon}><Tag className="h-4 w-4" /> Aplicar</Button>
          </div>
          {appliedCoupon && <p className="text-xs text-emerald-600">Cupón {appliedCoupon.code} aplicado</p>}
          <Textarea placeholder="Notas para la tienda (opcional)" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </CardContent></Card>

        {/* summary */}
        <Card><CardContent className="space-y-2 p-5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>
          {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento</span><span>-{formatMoney(discount, currency)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span>{freeShip ? "Gratis" : formatMoney(shipping, currency)}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{formatMoney(total, currency)}</span></div>
        </CardContent></Card>

        <Button onClick={submit} disabled={loading} className="w-full text-white" style={{ background: accent }} size="lg">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar pedido
        </Button>
      </div>
    </div>
  );
}
