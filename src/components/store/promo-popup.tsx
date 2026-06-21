"use client";
import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Promo {
  title: string;
  text: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
}

/** One-time promotional popup. Dismissal is remembered per store for the day. */
export function PromoPopup({ promo, accent, storeId }: { promo: Promo; accent: string; storeId: string }) {
  const [open, setOpen] = React.useState(false);
  const key = `wc-promo-${storeId}`;

  React.useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(key) === new Date().toDateString();
    } catch {
      /* ignore */
    }
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [key]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(key, new Date().toDateString());
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-background shadow-2xl">
        {promo.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.imageUrl} alt="" className="h-40 w-full object-cover" />
        )}
        <button onClick={close} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-2 p-6 text-center">
          {promo.title && <h3 className="text-xl font-bold">{promo.title}</h3>}
          {promo.text && <p className="text-sm text-muted-foreground">{promo.text}</p>}
          {promo.ctaLabel && (
            <Button
              asChild={!!promo.ctaUrl}
              onClick={promo.ctaUrl ? undefined : close}
              className="mt-3 w-full text-white"
              style={{ background: accent }}
            >
              {promo.ctaUrl ? <a href={promo.ctaUrl} onClick={close}>{promo.ctaLabel}</a> : <span>{promo.ctaLabel}</span>}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
