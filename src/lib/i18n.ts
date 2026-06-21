/**
 * Lightweight storefront i18n. Each store has a `locale` ("es" | "en").
 * Server components read `getDict(store.locale)` and pass the dictionary
 * to client components — no provider/runtime dependency needed.
 */
export type Locale = "es" | "en";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

export interface Dict {
  // storefront
  search: string;
  allCategories: string;
  featured: string;
  addToCart: string;
  outOfStock: string;
  viewCart: string;
  emptyCart: string;
  goToStore: string;
  // checkout
  checkout: string;
  keepShopping: string;
  yourData: string;
  name: string;
  phone: string;
  emailOptional: string;
  delivery: string;
  address: string;
  references: string;
  payment: string;
  couponAndNotes: string;
  couponCode: string;
  apply: string;
  notesPlaceholder: string;
  subtotal: string;
  discount: string;
  shipping: string;
  free: string;
  total: string;
  confirmOrder: string;
  missingData: string;
  missingDataDesc: string;
  orderReceived: string;
  orderCreated: string;
  sendViaWhatsApp: string;
  backToStore: string;
}

const es: Dict = {
  search: "Buscar productos",
  allCategories: "Todo",
  featured: "Destacados",
  addToCart: "Agregar",
  outOfStock: "Agotado",
  viewCart: "Ver carrito",
  emptyCart: "Tu carrito está vacío",
  goToStore: "Ir a la tienda",
  checkout: "Finalizar pedido",
  keepShopping: "Seguir comprando",
  yourData: "Tus datos",
  name: "Nombre",
  phone: "Teléfono (WhatsApp)",
  emailOptional: "Email (opcional)",
  delivery: "Entrega",
  address: "Dirección",
  references: "Referencias",
  payment: "Pago",
  couponAndNotes: "Cupón y notas",
  couponCode: "Código de cupón",
  apply: "Aplicar",
  notesPlaceholder: "Notas para la tienda (opcional)",
  subtotal: "Subtotal",
  discount: "Descuento",
  shipping: "Envío",
  free: "Gratis",
  total: "Total",
  confirmOrder: "Confirmar pedido",
  missingData: "Faltan datos",
  missingDataDesc: "Nombre y teléfono son obligatorios.",
  orderReceived: "¡Pedido recibido!",
  orderCreated: "fue creado.",
  sendViaWhatsApp: "Enviar pedido por WhatsApp",
  backToStore: "Volver a la tienda",
};

const en: Dict = {
  search: "Search products",
  allCategories: "All",
  featured: "Featured",
  addToCart: "Add",
  outOfStock: "Sold out",
  viewCart: "View cart",
  emptyCart: "Your cart is empty",
  goToStore: "Go to store",
  checkout: "Checkout",
  keepShopping: "Keep shopping",
  yourData: "Your details",
  name: "Name",
  phone: "Phone (WhatsApp)",
  emailOptional: "Email (optional)",
  delivery: "Delivery",
  address: "Address",
  references: "Notes for the driver",
  payment: "Payment",
  couponAndNotes: "Coupon & notes",
  couponCode: "Coupon code",
  apply: "Apply",
  notesPlaceholder: "Notes for the store (optional)",
  subtotal: "Subtotal",
  discount: "Discount",
  shipping: "Shipping",
  free: "Free",
  total: "Total",
  confirmOrder: "Place order",
  missingData: "Missing details",
  missingDataDesc: "Name and phone are required.",
  orderReceived: "Order received!",
  orderCreated: "was created.",
  sendViaWhatsApp: "Send order via WhatsApp",
  backToStore: "Back to store",
};

const DICTS: Record<Locale, Dict> = { es, en };

export function getDict(locale?: string | null): Dict {
  return DICTS[(locale as Locale) in DICTS ? (locale as Locale) : "es"];
}
