// Visual template registry. Each store's `templateKey` maps to a config that
// changes the public storefront layout/look (no logic change).
import type { FontKey } from "@/lib/fonts";

export interface TemplateConfig {
  key: string;
  name: string;
  dark: boolean;
  hero: "gradient" | "cover" | "minimal";
  columns: 2 | 3 | 4;
  cardRadius: string;     // tailwind radius class for product cards
  headingClass: string;   // store name styling
  font: FontKey;          // typography
  accent: string;         // default accent if store has none
}

const DEFAULT: TemplateConfig = {
  key: "minimal-store",
  name: "Minimal Store",
  dark: false,
  hero: "gradient",
  columns: 4,
  cardRadius: "rounded-2xl",
  headingClass: "text-2xl font-bold",
  font: "inter",
  accent: "#16a34a",
};

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  "minimal-store": DEFAULT,
  "food-express": {
    key: "food-express", name: "Restaurante", dark: false, hero: "cover",
    columns: 3, cardRadius: "rounded-2xl", headingClass: "text-3xl font-extrabold", font: "poppins", accent: "#ef4444",
  },
  cafe: {
    key: "cafe", name: "Cafetería", dark: false, hero: "gradient",
    columns: 3, cardRadius: "rounded-3xl", headingClass: "text-3xl font-bold tracking-tight", font: "dmsans", accent: "#b45309",
  },
  bakery: {
    key: "bakery", name: "Repostería", dark: false, hero: "gradient",
    columns: 3, cardRadius: "rounded-3xl", headingClass: "text-3xl font-semibold", font: "playfair", accent: "#db2777",
  },
  "boutique-pro": {
    key: "boutique-pro", name: "Boutique", dark: false, hero: "cover",
    columns: 4, cardRadius: "rounded-xl", headingClass: "text-3xl font-semibold tracking-tight", font: "playfair", accent: "#db2777",
  },
  barber: {
    key: "barber", name: "Barbería", dark: true, hero: "cover",
    columns: 3, cardRadius: "rounded-lg", headingClass: "text-3xl font-extrabold uppercase tracking-wide", font: "montserrat", accent: "#0ea5e9",
  },
  "digital-services": {
    key: "digital-services", name: "Servicios digitales", dark: false, hero: "minimal",
    columns: 3, cardRadius: "rounded-2xl", headingClass: "text-3xl font-bold tracking-tight", font: "sora", accent: "#0ea5e9",
  },
  "wholesale-catalog": {
    key: "wholesale-catalog", name: "Catálogo mayorista", dark: false, hero: "minimal",
    columns: 4, cardRadius: "rounded-lg", headingClass: "text-2xl font-bold", font: "inter", accent: "#f59e0b",
  },
  "premium-dark": {
    key: "premium-dark", name: "Tienda premium oscura", dark: true, hero: "gradient",
    columns: 4, cardRadius: "rounded-2xl", headingClass: "text-3xl font-extrabold tracking-tight", font: "sora", accent: "#a855f7",
  },
  // --- temas adicionales ---
  "elegant-serif": {
    key: "elegant-serif", name: "Elegante (serif)", dark: false, hero: "minimal",
    columns: 3, cardRadius: "rounded-none", headingClass: "text-4xl font-semibold tracking-tight", font: "playfair", accent: "#7c3aed",
  },
  "bold-modern": {
    key: "bold-modern", name: "Moderno audaz", dark: false, hero: "gradient",
    columns: 4, cardRadius: "rounded-2xl", headingClass: "text-4xl font-extrabold uppercase tracking-tight", font: "montserrat", accent: "#0ea5e9",
  },
  "beauty-studio": {
    key: "beauty-studio", name: "Beauty Studio", dark: false, hero: "gradient",
    columns: 3, cardRadius: "rounded-3xl", headingClass: "text-3xl font-bold", font: "poppins", accent: "#a855f7",
  },
  "local-market": {
    key: "local-market", name: "Local Market", dark: false, hero: "gradient",
    columns: 3, cardRadius: "rounded-2xl", headingClass: "text-2xl font-bold", font: "dmsans", accent: "#22c55e",
  },
};

export function getTemplate(key: string | null | undefined): TemplateConfig {
  return (key && TEMPLATE_CONFIGS[key]) || DEFAULT;
}

/** Templates shown in onboarding / editor pickers. */
export const TEMPLATE_PICKER: { key: string; name: string; color: string }[] = [
  { key: "food-express", name: "Restaurante", color: "#ef4444" },
  { key: "boutique-pro", name: "Boutique", color: "#db2777" },
  { key: "cafe", name: "Cafetería", color: "#b45309" },
  { key: "bakery", name: "Repostería", color: "#db2777" },
  { key: "barber", name: "Barbería", color: "#0ea5e9" },
  { key: "digital-services", name: "Servicios digitales", color: "#0ea5e9" },
  { key: "wholesale-catalog", name: "Catálogo mayorista", color: "#f59e0b" },
  { key: "premium-dark", name: "Tienda premium oscura", color: "#111827" },
  { key: "elegant-serif", name: "Elegante (serif)", color: "#7c3aed" },
  { key: "bold-modern", name: "Moderno audaz", color: "#0ea5e9" },
  { key: "beauty-studio", name: "Beauty Studio", color: "#a855f7" },
  { key: "local-market", name: "Local Market", color: "#22c55e" },
];
