export const TEMPLATES = [
  { key: "food-express", name: "Restaurante", premium: false, color: "#ef4444" },
  { key: "boutique-pro", name: "Boutique", premium: true, color: "#db2777" },
  { key: "cafe", name: "Cafetería", premium: false, color: "#b45309" },
  { key: "bakery", name: "Repostería", premium: true, color: "#db2777" },
  { key: "barber", name: "Barbería", premium: true, color: "#0ea5e9" },
  { key: "digital-services", name: "Servicios digitales", premium: true, color: "#0ea5e9" },
  { key: "wholesale-catalog", name: "Catálogo mayorista", premium: true, color: "#f59e0b" },
  { key: "premium-dark", name: "Tienda premium oscura", premium: true, color: "#111827" },
  { key: "elegant-serif", name: "Elegante (serif)", premium: true, color: "#7c3aed" },
  { key: "bold-modern", name: "Moderno audaz", premium: true, color: "#0ea5e9" },
  { key: "beauty-studio", name: "Beauty Studio", premium: true, color: "#a855f7" },
  { key: "local-market", name: "Local Market", premium: false, color: "#22c55e" },
  { key: "midnight", name: "Midnight", premium: true, color: "#6366f1" },
  { key: "pastel", name: "Pastel", premium: true, color: "#f472b6" },
  { key: "industrial", name: "Industrial", premium: true, color: "#f59e0b" },
  { key: "luxe", name: "Luxe", premium: true, color: "#d4af37" },
  { key: "fresh", name: "Fresh", premium: false, color: "#10b981" },
  { key: "ocean", name: "Ocean", premium: true, color: "#0891b2" },
] as const;

export const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurante" },
  { value: "cafe", label: "Cafetería" },
  { value: "bakery", label: "Repostería" },
  { value: "clothing", label: "Ropa" },
  { value: "beauty", label: "Belleza" },
  { value: "services", label: "Servicios" },
  { value: "local", label: "Tienda local" },
  { value: "wholesale", label: "Mayorista" },
] as const;

export const CURRENCIES = [
  { value: "MXN", label: "Peso mexicano (MXN)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "ARS", label: "Peso argentino (ARS)" },
  { value: "COP", label: "Peso colombiano (COP)" },
  { value: "CLP", label: "Peso chileno (CLP)" },
  { value: "PEN", label: "Sol peruano (PEN)" },
  { value: "EUR", label: "Euro (EUR)" },
];

export const DELIVERY_METHODS = [
  { method: "PICKUP", label: "Recoger en tienda" },
  { method: "LOCAL_DELIVERY", label: "Envío local" },
  { method: "OWN_DELIVERY", label: "Delivery propio" },
  { method: "SHIPPING", label: "Paquetería" },
] as const;

export const PAYMENT_METHODS = [
  { method: "CASH", label: "Efectivo" },
  { method: "TRANSFER", label: "Transferencia" },
  { method: "CARD", label: "Tarjeta" },
  { method: "PAYMENT_LINK", label: "Link de pago" },
  { method: "COD", label: "Pago contra entrega" },
  { method: "QR", label: "Pago con QR" },
] as const;

/**
 * Branded payment presets a store can enable at checkout. Each maps to an
 * underlying PaymentMethod enum so orders stay typed, while the customer sees
 * the familiar brand label. `instructions` is editable per store.
 */
export const PAYMENT_PRESETS: { key: string; label: string; method: string; instructions: string; emoji: string }[] = [
  { key: "cash", label: "Efectivo", method: "CASH", instructions: "Paga en efectivo al recibir o recoger.", emoji: "💵" },
  { key: "transfer", label: "Transferencia / SPEI", method: "TRANSFER", instructions: "Transfiere a la CLABE: 0000 0000 0000 0000 y envía tu comprobante.", emoji: "🏦" },
  { key: "card", label: "Tarjeta", method: "CARD", instructions: "Paga con tarjeta de crédito o débito.", emoji: "💳" },
  { key: "cod", label: "Pago contra entrega", method: "COD", instructions: "Paga en efectivo o tarjeta al momento de la entrega.", emoji: "📦" },
  { key: "mercadopago", label: "Mercado Pago", method: "PAYMENT_LINK", instructions: "Te enviaremos un link de Mercado Pago para completar tu pago.", emoji: "🔵" },
  { key: "paypal", label: "PayPal", method: "PAYMENT_LINK", instructions: "Te compartiremos un link de PayPal por WhatsApp.", emoji: "🅿️" },
  { key: "oxxo", label: "OXXO", method: "CASH", instructions: "Te damos una referencia para pagar en cualquier OXXO.", emoji: "🟡" },
  { key: "spei_qr", label: "QR / CoDi", method: "QR", instructions: "Escanea el código QR para pagar desde tu banco.", emoji: "🔳" },
  { key: "zelle", label: "Zelle", method: "TRANSFER", instructions: "Envía tu pago por Zelle al correo de la tienda.", emoji: "🟣" },
  { key: "pix", label: "Pix", method: "QR", instructions: "Paga con Pix escaneando el QR o usando la clave Pix.", emoji: "🟢" },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
  PARTIALLY_REFUNDED: "Reembolso parcial",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  PAYMENT_LINK: "Link de pago",
  COD: "Pago contra entrega",
  QR: "Pago con QR",
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  PICKUP: "Recoger en tienda",
  LOCAL_DELIVERY: "Envío local",
  OWN_DELIVERY: "Delivery propio",
  SHIPPING: "Paquetería",
};
