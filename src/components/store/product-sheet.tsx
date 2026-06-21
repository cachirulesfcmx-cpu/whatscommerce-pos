"use client";
import * as React from "react";
import { X, Minus, Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import type { Dict } from "@/lib/i18n";
import type { StoreProduct } from "@/components/store/product-card";

/** Product detail modal with variants, extras, quantity, notes + related items. */
export function ProductSheet({
  product, related, currency, accent, dict, onClose, onOpen,
}: {
  product: StoreProduct | null;
  related: StoreProduct[];
  currency: string;
  accent: string;
  dict: Dict;
  onClose: () => void;
  onOpen: (p: StoreProduct) => void;
}) {
  const addLine = useCart((s) => s.addLine);
  const { toast } = useToast();
  const [variantId, setVariantId] = React.useState<string | null>(null);
  const [extras, setExtras] = React.useState<Record<string, boolean>>({});
  const [qty, setQty] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  // reset state whenever a new product opens
  React.useEffect(() => {
    setVariantId(product?.variants[0]?.id ?? null);
    setExtras({});
    setQty(1);
    setNotes("");
  }, [product]);

  if (!product) return null;

  const variant = product.variants.find((v) => v.id === variantId);
  const base = variant?.price ?? product.price;
  const chosenExtras = product.extras.filter((e) => extras[e.name]);
  const extrasTotal = chosenExtras.reduce((s, e) => s + e.price, 0);
  const unit = base + extrasTotal;

  function add() {
    if (!product) return;
    addLine({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      unitPrice: base,
      quantity: qty,
      image: product.image,
      extras: chosenExtras.map((e) => ({ name: e.name, price: e.price })),
      notes: notes || null,
    });
    toast({ variant: "success", title: dict.addToCart, description: product.name });
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:inset-0 sm:my-auto sm:h-fit sm:max-h-[90vh] sm:rounded-3xl">
        <div className="relative">
          <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fb) return;
                  img.dataset.fb = "1";
                  img.src = `https://loremflickr.com/600/600/${encodeURIComponent(product.name)}/all?lock=7`;
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>
            )}
          </div>
          <button onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{product.name}</h2>
              <span className="shrink-0 text-lg font-bold" style={{ color: accent }}>{formatMoney(base, currency)}</span>
            </div>
            {product.compareAtPrice && product.compareAtPrice > base && (
              <span className="text-sm text-muted-foreground line-through">{formatMoney(product.compareAtPrice, currency)}</span>
            )}
            {product.description && <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>}
          </div>

          {/* variants */}
          {product.variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Opciones</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      variantId === v.id ? "text-white" : "hover:bg-muted"
                    )}
                    style={variantId === v.id ? { background: accent, borderColor: accent } : {}}
                  >
                    {v.name}{v.price != null ? ` · ${formatMoney(v.price, currency)}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* extras */}
          {product.extras.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Extras</p>
              <div className="space-y-1.5">
                {product.extras.map((e) => (
                  <label key={e.name} className="flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={!!extras[e.name]} onChange={(ev) => setExtras((p) => ({ ...p, [e.name]: ev.target.checked }))} />
                      {e.name}
                    </span>
                    <span className="text-muted-foreground">+{formatMoney(e.price, currency)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Textarea placeholder={dict.notesPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

          {/* qty + add */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-6 text-center font-medium">{qty}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty((q) => q + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button onClick={add} className="flex-1 text-white" style={{ background: accent }} size="lg">
              {dict.addToCart} · {formatMoney(unit * qty, currency)}
            </Button>
          </div>

          {/* related */}
          {related.length > 0 && (
            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-semibold">También te puede gustar</p>
              <div className="grid grid-cols-4 gap-2">
                {related.map((r) => (
                  <button key={r.id} onClick={() => onOpen(r)} className="text-left">
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs">{r.name}</p>
                    <p className="text-xs font-semibold">{formatMoney(r.price, currency)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
