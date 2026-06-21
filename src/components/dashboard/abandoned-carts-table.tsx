"use client";
import * as React from "react";
import { MessageCircle, Mail, ShoppingBag, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

interface Cart {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  itemsLabel: string;
  itemCount: number;
  subtotal: number;
  updatedAt: string;
  remindedAt: string | null;
  waLink: string | null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return "hace minutos";
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export function AbandonedCartsTable({ currency, carts }: { currency: string; carts: Cart[] }) {
  const potential = carts.reduce((s, c) => s + c.subtotal, 0);

  if (carts.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Carritos abandonados</h1>
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Sin carritos abandonados</p>
          <p className="text-sm text-muted-foreground">Cuando un cliente deje productos sin pagar, aparecerá aquí para que lo recuperes.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Carritos abandonados</h1>
          <p className="text-sm text-muted-foreground">{carts.length} carritos · {formatMoney(potential, currency)} en ventas potenciales</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs">
          El email de recuperación se envía automáticamente cada hora. Usa WhatsApp para un toque personal.
        </p>
      </div>

      <Card><CardContent className="p-0">
        <div className="divide-y">
          {carts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.customerName || "Cliente anónimo"}</span>
                  {c.remindedAt && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      Recordado
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">{c.itemsLabel}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {timeAgo(c.updatedAt)}
                  {c.customerPhone && <span>· {c.customerPhone}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatMoney(c.subtotal, currency)}</span>
                {c.waLink && (
                  <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1eb959]">
                    <a href={c.waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                  </Button>
                )}
                {c.customerEmail && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${c.customerEmail}`}><Mail className="h-4 w-4" /></a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
