import { formatMoney, normalizePhone } from "@/lib/utils";

export interface CustomerMsgCtx {
  storeName: string;
  number: string;
  total: number;
  currency: string;
  customerName?: string;
}

/** Editable templates keyed by order status. Support {cliente} {pedido} {total} {tienda}. */
export type MessageTemplates = Partial<Record<string, string>>;

export const TEMPLATE_VARIABLES = ["{cliente}", "{pedido}", "{total}", "{tienda}"] as const;

export const DEFAULT_TEMPLATE_LABELS: { key: string; label: string }[] = [
  { key: "CONFIRMED", label: "Pedido confirmado" },
  { key: "PREPARING", label: "En preparación" },
  { key: "READY", label: "Listo" },
  { key: "SHIPPED", label: "Enviado" },
  { key: "DELIVERED", label: "Entregado" },
  { key: "CANCELED", label: "Cancelado" },
];

function applyTemplate(tpl: string, c: CustomerMsgCtx): string {
  return tpl
    .replaceAll("{cliente}", c.customerName ?? "")
    .replaceAll("{pedido}", c.number)
    .replaceAll("{total}", formatMoney(c.total, c.currency))
    .replaceAll("{tienda}", c.storeName)
    .trim();
}

/**
 * Per-status message sent to the CUSTOMER (not the business).
 * Uses the store's editable template when present, else a sensible default.
 * Works fully with wa.me deep links — no WhatsApp API required.
 */
export function buildCustomerStatusMessage(
  status: string,
  c: CustomerMsgCtx,
  templates?: MessageTemplates
): string {
  const custom = templates?.[status];
  if (custom && custom.trim()) return applyTemplate(custom, c);

  const hi = c.customerName ? `Hola ${c.customerName}, ` : "Hola, ";
  const t = formatMoney(c.total, c.currency);
  switch (status) {
    case "CONFIRMED":
      return `${hi}¡confirmamos tu pedido *#${c.number}* en ${c.storeName}! Total: ${t}. Te avisamos cuando esté listo. 🙌`;
    case "PREPARING":
      return `${hi}tu pedido *#${c.number}* ya se está preparando en ${c.storeName}. 👨‍🍳`;
    case "READY":
      return `${hi}tu pedido *#${c.number}* está *listo* en ${c.storeName}. 🎉`;
    case "SHIPPED":
      return `${hi}tu pedido *#${c.number}* va en camino. 🛵`;
    case "DELIVERED":
      return `${hi}¡gracias por tu compra en ${c.storeName}! Tu pedido *#${c.number}* fue entregado. ⭐`;
    case "CANCELED":
      return `${hi}lamentamos informarte que tu pedido *#${c.number}* fue cancelado. Cualquier duda, aquí estamos.`;
    default:
      return `${hi}recibimos tu pedido *#${c.number}* en ${c.storeName}. Total: ${t}. ¡Gracias! 🙌`;
  }
}

export function customerWaLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function customerContactLink(phone: string): string {
  return `https://wa.me/${normalizePhone(phone)}`;
}
