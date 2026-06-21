// Catálogo de ejemplo por giro, para precargar en onboarding.
export interface SampleProduct { name: string; price: number; category: string; img: string; featured?: boolean; }
export interface SampleCatalog { categories: string[]; products: SampleProduct[]; }

const img = (s: string) => `https://picsum.photos/seed/wc-${s}/600/600`;

export const SAMPLE_CATALOGS: Record<string, SampleCatalog> = {
  restaurant: {
    categories: ["Entradas", "Platos fuertes", "Bebidas", "Postres"],
    products: [
      { name: "Orden de alitas", price: 120, category: "Entradas", img: img("alitas"), featured: true },
      { name: "Hamburguesa clásica", price: 95, category: "Platos fuertes", img: img("burger"), featured: true },
      { name: "Tacos de pollo", price: 75, category: "Platos fuertes", img: img("tacospollo") },
      { name: "Limonada", price: 35, category: "Bebidas", img: img("limonada") },
      { name: "Pay de queso", price: 55, category: "Postres", img: img("payqueso") },
    ],
  },
  cafe: {
    categories: ["Café", "Frappés", "Panadería"],
    products: [
      { name: "Cappuccino", price: 45, category: "Café", img: img("capp"), featured: true },
      { name: "Latte vainilla", price: 50, category: "Café", img: img("latte") },
      { name: "Frappé caramelo", price: 65, category: "Frappés", img: img("frappe"), featured: true },
      { name: "Croissant", price: 38, category: "Panadería", img: img("croissant") },
    ],
  },
  bakery: {
    categories: ["Pasteles", "Galletas", "Temporada"],
    products: [
      { name: "Pastel de chocolate", price: 350, category: "Pasteles", img: img("chococake"), featured: true },
      { name: "Cheesecake fresa", price: 380, category: "Pasteles", img: img("cheesecake") },
      { name: "Galletas surtidas (12)", price: 120, category: "Galletas", img: img("cookies"), featured: true },
      { name: "Cupcakes (6)", price: 150, category: "Temporada", img: img("cupcakes") },
    ],
  },
  clothing: {
    categories: ["Mujer", "Hombre", "Accesorios"],
    products: [
      { name: "Playera básica", price: 199, category: "Mujer", img: img("playera"), featured: true },
      { name: "Jeans slim", price: 549, category: "Hombre", img: img("jeans") },
      { name: "Vestido casual", price: 399, category: "Mujer", img: img("vestidoc"), featured: true },
      { name: "Gorra", price: 149, category: "Accesorios", img: img("gorra") },
    ],
  },
  beauty: {
    categories: ["Servicios", "Productos"],
    products: [
      { name: "Corte y peinado", price: 250, category: "Servicios", img: img("corte"), featured: true },
      { name: "Manicure", price: 180, category: "Servicios", img: img("mani") },
      { name: "Tratamiento facial", price: 450, category: "Servicios", img: img("facial"), featured: true },
      { name: "Shampoo profesional", price: 220, category: "Productos", img: img("shampoo") },
    ],
  },
  services: {
    categories: ["Paquetes", "Servicios"],
    products: [
      { name: "Consulta inicial", price: 500, category: "Servicios", img: img("consulta"), featured: true },
      { name: "Paquete mensual", price: 3500, category: "Paquetes", img: img("paquete"), featured: true },
      { name: "Sesión express", price: 800, category: "Servicios", img: img("sesion") },
    ],
  },
  local: {
    categories: ["Destacados", "Despensa"],
    products: [
      { name: "Canasta básica", price: 350, category: "Destacados", img: img("canasta"), featured: true },
      { name: "Refresco 2L", price: 35, category: "Despensa", img: img("refresco2l") },
      { name: "Pan de caja", price: 42, category: "Despensa", img: img("pancaja") },
    ],
  },
  wholesale: {
    categories: ["Mayoreo"],
    products: [
      { name: "Caja 24 piezas", price: 480, category: "Mayoreo", img: img("caja24"), featured: true },
      { name: "Bulto 10 kg", price: 320, category: "Mayoreo", img: img("bulto") },
      { name: "Paquete revendedor", price: 1500, category: "Mayoreo", img: img("revendedor"), featured: true },
    ],
  },
};

export function getSampleCatalog(businessType?: string | null): SampleCatalog | null {
  if (!businessType) return null;
  return SAMPLE_CATALOGS[businessType] ?? null;
}
