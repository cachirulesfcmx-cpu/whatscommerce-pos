"use client";
import * as React from "react";
import { X, Minus, Plus, ImageIcon, Heart, Star, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/hooks/use-toast";
import type { Dict } from "@/lib/i18n";
import type { StoreProduct } from "@/components/store/product-card";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

/** Product detail modal with variants, extras, quantity, notes, reviews + related items. */
export function ProductSheet({
  product, related, currency, accent, dict, storeId, demo = false, onClose, onOpen,
}: {
  product: StoreProduct | null;
  related: StoreProduct[];
  currency: string;
  accent: string;
  dict: Dict;
  storeId: string;
  demo?: boolean;
  onClose: () => void;
  onOpen: (p: StoreProduct) => void;
}) {
  const addLine = useCart((s) => s.addLine);
  const wishlisted = useWishlist((s) => (product ? s.ids.includes(product.id) : false));
  const toggleWish = useWishlist((s) => s.toggle);
  const { toast } = useToast();
  const [variantId, setVariantId] = React.useState<string | null>(null);
  const [extras, setExtras] = React.useState<Record<string, boolean>>({});
  const [qty, setQty] = React.useState(1);
  const [notes, setNotes] = React.useState("");
  const [rvName, setRvName] = React.useState("");
  const [rvRating, setRvRating] = React.useState(5);
  const [rvComment, setRvComment] = React.useState("");
  const [rvSent, setRvSent] = React.useState(false);
  const [rvBusy, setRvBusy] = React.useState(false);

  // reset state whenever a new product opens
  React.useEffect(() => {
    setVariantId(product?.variants[0]?.id ?? null);
    setExtras({});
    setQty(1);
    setNotes("");
    setRvName(""); setRvRating(5); setRvComment(""); setRvSent(false);
  }, [product]);

  if (!product) return null;

  const reviews = product.reviews ?? [];
  const igUrls = product.instagramUrls ?? [];

  async function submitReview() {
    if (!product || !rvName.trim()) {
      toast({ variant: "destructive", title: "Escribe tu nombre" });
      return;
    }
    setRvBusy(true);
    const res = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, productId: product.id, customerName: rvName, rating: rvRating, comment: rvComment || null }),
    });
    setRvBusy(false);
    if (!res.ok) { toast({ variant: "destructive", title: "No se pudo enviar" }); return; }
    setRvSent(true);
    toast({ variant: "success", title: "¡Gracias por tu reseña!" });
  }

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
              <div className="flex items-center gap-2">
                <button onClick={() => toggleWish(product.id)} aria-label="Favorito">
                  <Heart className={cn("h-5 w-5", wishlisted ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
                </button>
                <span className="shrink-0 text-lg font-bold" style={{ color: accent }}>{formatMoney(base, currency)}</span>
              </div>
            </div>
            {product.ratingCount ? (
              <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Stars value={product.ratingAvg ?? 0} /> {(product.ratingAvg ?? 0).toFixed(1)} ({product.ratingCount})
              </span>
            ) : null}
            {product.compareAtPrice && product.compareAtPrice > base && (
              <span className="block text-sm text-muted-foreground line-through">{formatMoney(product.compareAtPrice, currency)}</span>
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

          {/* instagram posts */}
          {igUrls.length > 0 && (
            <div className="border-t pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Instagram className="h-4 w-4" /> En Instagram</p>
              <div className="flex flex-wrap gap-2">
                {igUrls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="flex h-16 w-16 items-center justify-center rounded-xl border bg-gradient-to-br from-fuchsia-500/10 to-amber-500/10 text-muted-foreground hover:text-foreground">
                    <Instagram className="h-6 w-6" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* reviews */}
          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-semibold">Reseñas {reviews.length > 0 && `(${reviews.length})`}</p>
            {reviews.length > 0 && (
              <div className="mb-4 space-y-3">
                {reviews.slice(0, 5).map((r, i) => (
                  <div key={i} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.customerName}</span>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
            {demo ? (
              <p className="text-xs text-muted-foreground">Las reseñas reales aparecerán aquí en tu tienda.</p>
            ) : rvSent ? (
              <p className="text-sm text-emerald-600">¡Gracias por tu reseña! Aparecerá en breve.</p>
            ) : (
              <div className="space-y-2 rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Input value={rvName} onChange={(e) => setRvName(e.target.value)} placeholder="Tu nombre" className="h-9" />
                  <div className="flex shrink-0 items-center">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRvRating(n)} aria-label={`${n} estrellas`}>
                        <Star className={cn("h-5 w-5", n <= rvRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea value={rvComment} onChange={(e) => setRvComment(e.target.value)} placeholder="Cuéntanos qué te pareció (opcional)" rows={2} />
                <Button onClick={submitReview} disabled={rvBusy} variant="outline" className="w-full">Enviar reseña</Button>
              </div>
            )}
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
