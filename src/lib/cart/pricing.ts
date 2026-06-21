import type { CartItemInput } from "@/lib/validations/checkout";

export interface AppliedCoupon {
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export function lineTotal(item: CartItemInput): number {
  const extras = (item.extras ?? []).reduce((s, e) => s + (e.price ?? 0), 0);
  return (item.unitPrice + extras) * item.quantity;
}

export function computeSubtotal(items: CartItemInput[]): number {
  return round(items.reduce((s, it) => s + lineTotal(it), 0));
}

export function computePricing(opts: {
  items: CartItemInput[];
  shipping?: number;
  taxRate?: number; // percent, e.g. 16
  taxIncluded?: boolean;
  coupon?: AppliedCoupon | null;
}): PricingResult {
  const subtotal = computeSubtotal(opts.items);
  let shipping = round(opts.shipping ?? 0);
  let discount = 0;

  if (opts.coupon) {
    if (opts.coupon.type === "PERCENTAGE") {
      discount = round((subtotal * opts.coupon.value) / 100);
    } else if (opts.coupon.type === "FIXED") {
      discount = Math.min(round(opts.coupon.value), subtotal);
    } else if (opts.coupon.type === "FREE_SHIPPING") {
      discount = 0;
      shipping = 0;
    }
  }

  const taxableBase = Math.max(0, subtotal - discount);
  let tax = 0;
  if (opts.taxRate && opts.taxRate > 0 && !opts.taxIncluded) {
    tax = round((taxableBase * opts.taxRate) / 100);
  }

  const total = round(taxableBase + shipping + tax);
  return { subtotal, discount, shipping, tax, total };
}

export function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
