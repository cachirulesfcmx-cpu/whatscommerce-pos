import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  name: z.string().min(1),
  variantName: z.string().optional().nullable(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive().max(999),
  extras: z
    .array(z.object({ name: z.string(), price: z.number().nonnegative().default(0) }))
    .default([]),
  notes: z.string().max(500).optional().nullable(),
});

export const checkoutSchema = z.object({
  storeId: z.string().min(1),
  items: z.array(cartItemSchema).min(1, "El carrito está vacío"),
  customer: z.object({
    name: z.string().min(2, "Nombre requerido").max(120),
    phone: z.string().min(7, "Teléfono requerido").max(20),
    email: z.string().email().optional().or(z.literal("")).nullable(),
  }),
  deliveryMethod: z.enum(["PICKUP", "LOCAL_DELIVERY", "OWN_DELIVERY", "SHIPPING"]),
  address: z
    .object({
      line1: z.string().optional(),
      references: z.string().optional(),
      city: z.string().optional(),
    })
    .optional()
    .nullable(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "PAYMENT_LINK", "COD", "QR"]),
  couponCode: z.string().optional().nullable(),
  manualDiscount: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  cartToken: z.string().optional().nullable(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
