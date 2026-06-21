import { formatMoney, formatDate, normalizePhone } from "@/lib/utils";

export interface TicketExtra {
  name: string;
  price?: number;
}

export interface TicketItem {
  name: string;
  variantName?: string | null;
  extras?: TicketExtra[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string | null;
}

export interface TicketData {
  storeName: string;
  orderNumber: string;
  createdAt: Date | string;
  currency: string;
  customer: {
    name: string;
    phone: string;
    address?: string | null;
  };
  deliveryMethodLabel: string;
  items: TicketItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total: number;
  paymentMethodLabel: string;
  notes?: string | null;
  statusLabel?: string;
}

/**
 * Build the professional WhatsApp order ticket (plain text, emoji-light).
 * Matches the format defined in the product spec.
 */
export function buildOrderTicket(data: TicketData): string {
  const c = data.currency;
  const L: string[] = [];

  L.push("🧾 *NUEVO PEDIDO*");
  L.push("");
  L.push(`*Tienda:* ${data.storeName}`);
  L.push(`*Pedido:* #${data.orderNumber}`);
  L.push(`*Fecha:* ${formatDate(data.createdAt)}`);
  L.push("");
  L.push("👤 *Cliente*");
  L.push(`Nombre: ${data.customer.name}`);
  L.push(`Teléfono: ${data.customer.phone}`);
  if (data.customer.address) L.push(`Dirección: ${data.customer.address}`);
  L.push(`Entrega: ${data.deliveryMethodLabel}`);
  L.push("");
  L.push("🛍️ *Productos*");
  data.items.forEach((it, i) => {
    L.push(`${i + 1}. ${it.name} x${it.quantity}`);
    if (it.variantName) L.push(`   Variante: ${it.variantName}`);
    if (it.extras && it.extras.length) {
      L.push(
        `   Extras: ${it.extras
          .map((e) => (e.price ? `${e.name} (+${formatMoney(e.price, c)})` : e.name))
          .join(", ")}`
      );
    }
    if (it.notes) L.push(`   Nota: ${it.notes}`);
    L.push(`   Precio: ${formatMoney(it.lineTotal, c)}`);
  });
  L.push("");
  L.push("💰 *Resumen*");
  L.push(`Subtotal: ${formatMoney(data.subtotal, c)}`);
  if (data.discount && data.discount > 0)
    L.push(`Descuento: -${formatMoney(data.discount, c)}`);
  if (data.shipping && data.shipping > 0)
    L.push(`Envío: ${formatMoney(data.shipping, c)}`);
  if (data.tax && data.tax > 0) L.push(`Impuestos: ${formatMoney(data.tax, c)}`);
  L.push(`*Total: ${formatMoney(data.total, c)}*`);
  L.push("");
  L.push("💳 *Método de pago*");
  L.push(data.paymentMethodLabel);
  if (data.notes) {
    L.push("");
    L.push("📝 *Notas*");
    L.push(data.notes);
  }
  L.push("");
  L.push(`📌 *Estado:* ${data.statusLabel ?? "Pendiente de confirmación"}`);

  return L.join("\n");
}

/** Build a wa.me deep link with the ticket pre-filled. */
export function buildWaMeLink(phone: string, message: string): string {
  const to = normalizePhone(phone);
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}
