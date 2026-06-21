"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface CartExtra {
  name: string;
  price: number;
}

export interface CartLine {
  key: string; // unique line id
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  image?: string | null;
  extras: CartExtra[];
  notes?: string | null;
}

interface CartState {
  storeId: string | null;
  token: string;
  lines: CartLine[];
  setStore: (storeId: string) => void;
  addLine: (line: Omit<CartLine, "key">) => void;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      token: nanoid(),
      lines: [],
      setStore: (storeId) => {
        // reset cart when switching stores
        if (get().storeId && get().storeId !== storeId) {
          set({ storeId, lines: [], token: nanoid() });
        } else {
          set({ storeId });
        }
      },
      addLine: (line) => {
        const lineExtrasKey = JSON.stringify(line.extras.map((e) => e.name).sort());
        const existing = get().lines.find(
          (l) =>
            l.productId === line.productId &&
            l.variantId === line.variantId &&
            JSON.stringify(l.extras.map((e) => e.name).sort()) === lineExtrasKey &&
            (l.notes ?? "") === (line.notes ?? "")
        );
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.key === existing.key ? { ...l, quantity: l.quantity + line.quantity } : l
            ),
          });
        } else {
          set({ lines: [...get().lines, { ...line, key: nanoid() }] });
        }
      },
      updateQty: (key, qty) =>
        set({
          lines:
            qty <= 0
              ? get().lines.filter((l) => l.key !== key)
              : get().lines.map((l) => (l.key === key ? { ...l, quantity: qty } : l)),
        }),
      removeLine: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      clear: () => set({ lines: [], token: nanoid() }),
      count: () => get().lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: () =>
        get().lines.reduce(
          (s, l) => s + (l.unitPrice + l.extras.reduce((e, x) => e + x.price, 0)) * l.quantity,
          0
        ),
    }),
    { name: "whatscommerce-cart" }
  )
);
