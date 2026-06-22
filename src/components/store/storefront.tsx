"use client";
import * as React from "react";
import { MessageCircle, Store as StoreIcon, BadgeCheck, Star, MapPin, Clock, Instagram, Facebook, Search } from "lucide-react";
import { ProductCard, type StoreProduct } from "@/components/store/product-card";
import { CartDrawer } from "@/components/store/cart-drawer";
import { ProductSheet } from "@/components/store/product-sheet";
import { PromoPopup } from "@/components/store/promo-popup";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/cart";
import { normalizePhone, cn } from "@/lib/utils";
import { getTemplate } from "@/lib/templates";
import { FONTS } from "@/lib/fonts";
import { getDict } from "@/lib/i18n";
import type { StorefrontDTO } from "@/server/storefront";

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

const GRID_COLS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function Storefront({ store, demo = false }: { store: StorefrontDTO; demo?: boolean }) {
  const setStore = useCart((s) => s.setStore);
  const [activeCat, setActiveCat] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<StoreProduct | null>(null);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"relevance" | "price-asc" | "price-desc">("relevance");
  const tpl = getTemplate(store.templateKey);
  const accent = store.primaryColor || tpl.accent;
  const t = getDict(store.locale);

  const related = active
    ? store.products.filter((p) => p.id !== active.id && p.categoryId === active.categoryId).slice(0, 4)
    : [];

  React.useEffect(() => {
    setStore(store.id);
  }, [store.id, setStore]);

  const products = React.useMemo(() => {
    let list = store.products;
    if (activeCat) list = list.filter((p) => p.categoryId === activeCat);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [store.products, activeCat, query, sort]);

  const heroHeight = tpl.hero === "minimal" ? "h-24 sm:h-32" : "h-40 sm:h-56";

  return (
    <div className={cn("min-h-screen bg-background pb-28", FONTS[tpl.font].className, tpl.dark && "dark")}>
      {demo && (
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-slate-900 px-4 py-2 text-center text-xs text-white">
          <span>🎬 Demo de <strong>{store.name}</strong> — así se vería tu tienda</span>
          <a href="/register" className="rounded-full bg-white px-3 py-0.5 font-semibold text-slate-900">Crear la mía gratis</a>
        </div>
      )}
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
            <h1 className={cn(tpl.headingClass, "flex items-center gap-1.5")}>
              {store.name}
              {store.verified && <BadgeCheck className="h-5 w-5 text-sky-500" aria-label="Tienda verificada" />}
            </h1>
            {store.description && <p className="text-sm text-muted-foreground">{store.description}</p>}
          </div>
        </div>

        {/* social proof / trust strip */}
        <div className="container mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {store.ratingCount > 0 && store.ratingAvg != null && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {store.ratingAvg.toFixed(1)} <span className="font-normal text-muted-foreground">({store.ratingCount})</span>
            </span>
          )}
          {store.instagramFollowers != null && (
            <a href={store.instagramUrl ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
              <Instagram className="h-3.5 w-3.5" /> {compact(store.instagramFollowers)}
            </a>
          )}
          {store.facebookFollowers != null && (
            <span className="flex items-center gap-1"><Facebook className="h-3.5 w-3.5" /> {compact(store.facebookFollowers)}</span>
          )}
          {store.tiktokFollowers != null && (
            <span className="flex items-center gap-1"><span className="font-semibold">TikTok</span> {compact(store.tiktokFollowers)}</span>
          )}
          {store.hoursText && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {store.hoursText}</span>}
          {store.addressText && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {store.addressText}</span>}
        </div>
      </header>

      {/* search + sort */}
      <div className="container mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-10 rounded-full border border-border bg-background px-3 text-sm"
        >
          <option value="relevance">{t.featured}</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
      </div>

      {/* category filter (sticky) */}
      {store.categories.length > 0 && (
        <div className="sticky top-0 z-20 mt-3 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveCat(null)}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all active:scale-95 ${!activeCat ? "text-white shadow-sm" : "hover:bg-muted"}`}
              style={!activeCat ? { background: accent, borderColor: accent } : {}}
            >
              {t.allCategories}
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
          <ProductCard key={p.id} product={p} currency={store.currency} accent={accent} radius={tpl.cardRadius} onOpen={setActive} />
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

      <ProductSheet
        product={active}
        related={related}
        currency={store.currency}
        accent={accent}
        dict={t}
        storeId={store.id}
        demo={demo}
        onClose={() => setActive(null)}
        onOpen={setActive}
      />

      {store.promo && <PromoPopup promo={store.promo} accent={accent} storeId={store.id} />}

      <CartDrawer slug={store.slug} currency={store.currency} accent={accent} dict={t} demo={demo} />

      {store.showBranding && (
        <footer className="container mt-12 text-center text-xs text-muted-foreground">
          <Badge variant="secondary">Hecho con WhatsCommerce POS</Badge>
        </footer>
      )}
    </div>
  );
}
