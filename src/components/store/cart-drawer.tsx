"use client";
import * as React from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import type { Dict } from "@/lib/i18n";

export function CartDrawer({
  slug, currency, accent, dict, demo = false,
}: {
  slug: string;
  currency: string;
  accent: string;
  dict: Dict;
  demo?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { lines, updateQty, removeLine } = useCart();
  const subtotal = useCart((s) => s.subtotal());
  const count = useCart((s) => s.count());

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 h-14 rounded-full px-5 text-white shadow-xl lg:bottom-6 lg:right-6"
        style={{ background: accent }}
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && <Badge className="ml-1 bg-white/20 text-white">{count}</Badge>}
        {subtotal > 0 && <span className="ml-2 font-semibold">{formatMoney(subtotal, currency)}</span>}
      </Button>

      {open && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold">Tu pedido</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <EmptyState icon={ShoppingCart} title={dict.emptyCart} description="" />
          ) : (
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3 rounded-xl border p-3">
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.name}</p>
                    {l.variantName && <p className="text-xs text-muted-foreground">{l.variantName}</p>}
                    <p className="text-sm font-semibold">{formatMoney(l.unitPrice, currency)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(l.key, l.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-sm">{l.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(l.key, l.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeLine(l.key)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-muted-foreground">{dict.subtotal}</span>
              <span className="text-lg font-bold">{formatMoney(subtotal, currency)}</span>
            </div>
            {demo ? (
              <>
                <Button asChild className="w-full text-white" style={{ background: accent }}>
                  <Link href="/register">Crear mi tienda gratis</Link>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">Estás en una demo. Crea tu cuenta para recibir pedidos reales.</p>
              </>
            ) : (
              <Button asChild className="w-full text-white" style={{ background: accent }} onClick={() => setOpen(false)}>
                <Link href={`/store/${slug}/checkout`}>{dict.checkout}</Link>
              </Button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
