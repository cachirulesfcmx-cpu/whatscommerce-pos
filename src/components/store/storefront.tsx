"use client";
import * as React from "react";
import { MessageCircle, Store as StoreIcon } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { CartDrawer } from "@/components/store/cart-drawer";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/cart";
import { normalizePhone, cn } from "@/lib/utils";
import { getTemplate } from "@/lib/templates";
import { FONTS } from "@/lib/fonts";
import type { StorefrontDTO } from "@/server/storefront";

const GRID_COLS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function Storefront({ store }: { store: StorefrontDTO }) {
  const setStore = useCart((s) => s.setStore);
  const [activeCat, setActiveCat] = React.useState<string | null>(null);
  const tpl = getTemplate(store.templateKey);
  const accent = store.primaryColor || tpl.accent;

  React.useEffect(() => {
    setStore(store.id);
  }, [store.id, setStore]);

  const products = activeCat
    ? store.products.filter((p) => p.categoryId === activeCat)
    : store.products;

  const heroHeight = tpl.hero === "minimal" ? "h-24 sm:h-32" : "h-40 sm:h-56";

  return (
    <div className={cn("min-h-screen bg-background pb-28", FONTS[tpl.font].className, tpl.dark && "dark")}>
      {/* banner / header */}
      <header className="relative">
        <div
          className={cn("w-full", heroHeight)}
          style={{ background: store.bannerUrl ? `url(${store.bannerUrl}) center/cover` : `linear-gradient(135deg, ${accent}, #0ea5e9)` }}
        />
        <div className="container -mt-10 flex items-end gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-card shadow-lg">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            ) : (
              <StoreIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="pb-2">
            <h1 className={tpl.headingClass}>{store.name}</h1>
            {store.description && <p className="text-sm text-muted-foreground">{store.description}</p>}
          </div>
        </div>
      </header>

      {/* category filter (sticky) */}
      {store.categories.length > 0 && (
        <div className="sticky top-0 z-20 mt-6 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveCat(null)}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all active:scale-95 ${!activeCat ? "text-white shadow-sm" : "hover:bg-muted"}`}
              style={!activeCat ? { background: accent, borderColor: accent } : {}}
            >
              Todo
            </button>
            {store.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all active:scale-95 ${activeCat === c.id ? "text-white shadow-sm" : "hover:bg-muted"}`}
                style={activeCat === c.id ? { background: accent, borderColor: accent } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* products grid */}
      <main className={cn("container mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3", GRID_COLS[tpl.columns])}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} currency={store.currency} accent={accent} radius={tpl.cardRadius} />
        ))}
      </main>

      {products.length === 0 && (
        <p className="container mt-10 text-center text-muted-foreground">
          Esta tienda aún no tiene productos publicados.
        </p>
      )}

      {/* whatsapp float */}
      {store.whatsappPhone && (
        <a
          href={`https://wa.me/${normalizePhone(store.whatsappPhone)}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl"
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}

      <CartDrawer slug={store.slug} currency={store.currency} accent={accent} />

      {store.showBranding && (
        <footer className="container mt-12 text-center text-xs text-muted-foreground">
          <Badge variant="secondary">Hecho con WhatsCommerce POS</Badge>
        </footer>
      )}
    </div>
  );
}
