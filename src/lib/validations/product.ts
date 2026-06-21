import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const variantOptionSchema = z.object({
  type: z.string().min(1),
  value: z.string().min(1),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().nonnegative().nullable().optional(),
  compareAtPrice: z.number().nonnegative().nullable().optional(),
  options: z.array(variantOptionSchema).default([]),
  stock: z.number().int().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(140),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(["PHYSICAL", "DIGITAL", "SERVICE"]).default("PHYSICAL"),
  categoryId: z.string().optional().nullable(),
  price: z.number().nonnegative("Precio inválido"),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  sku: z.string().max(60).optional().nullable(),
  trackInventory: z.boolean().default(false),
  stock: z.number().int().optional(),
  prepTimeMinutes: z.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  images: z.array(productImageSchema).default([]),
  variants: z.array(variantSchema).default([]),
  modifierIds: z.array(z.string()).default([]),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
