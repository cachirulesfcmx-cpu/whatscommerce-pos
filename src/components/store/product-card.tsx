"use client";
import * as React from "react";
import { Plus, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";

export interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  categoryId: string | null;
  isFeatured: boolean;
  image: string | null;
  variants: { id: string; name: string; price: number | null }[];
  extras: { name: string; price: number }[];
}

export function ProductCard({
  product, currency, accent, radius = "rounded-2xl", onOpen,
}: {
  product: StoreProduct;
  currency: string;
  accent: string;
  radius?: string;
  onOpen?: (p: StoreProduct) => void;
}) {
  const addLine = useCart((s) => s.addLine);
  const { toast } = useToast();
  const [variantId, setVariantId] = React.useState<string | null>(
    product.variants[0]?.id ?? null
  );

  const variant = product.variants.find((v) => v.id === variantId);
  const price = variant?.price ?? product.price;

  function add() {
    addLine({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      unitPrice: price,
      quantity: 1,
      image: product.image,
      extras: [],
      notes: null,
    });
    toast({ variant: "success", title: "Agregado al carrito", description: product.name });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group flex flex-col overflow-hidden border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 ${radius}`}
    >
      <div className="relative aspect-square cursor-pointer overflow-hidden bg-muted" onClick={() => onOpen?.(product)}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallback) return;
              img.dataset.fallback = "1";
              img.src = `https://loremflickr.com/600/600/${encodeURIComponent(product.name)}/all?lock=7`;
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
        )}
        {product.compareAtPrice && product.compareAtPrice > price && (
          <Badge variant="destructive" className="absolute left-2 top-2">Oferta</Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 cursor-pointer font-semibold hover:underline" onClick={() => onOpen?.(product)}>{product.name}</h3>
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}

        {product.variants.length > 1 && (
          <select
            className="mt-2 rounded-lg border bg-background px-2 py-1 text-xs"
            value={variantId ?? ""}
            onChange={(e) => setVariantId(e.target.value)}
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            <span className="font-bold">{formatMoney(price, currency)}</span>
            {product.compareAtPrice && product.compareAtPrice > price && (
              <span className="ml-1 text-xs text-muted-foreground line-through">
                {formatMoney(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
          <Button size="icon" onClick={add} style={{ background: accent }} className="text-white">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
