/**
 * Transactional email via Resend (https://resend.com).
 * No-op (graceful) when RESEND_API_KEY / EMAIL_FROM are not set.
 */
import { formatMoney } from "@/lib/utils";

export const isEmailEnabled = Boolean(
  typeof window === "undefined" && process.env.RESEND_API_KEY && process.env.EMAIL_FROM
);

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isEmailEnabled) return { ok: false, skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

interface OrderEmailData {
  storeName: string;
  number: string;
  customerName: string;
  currency: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  total: number;
  storeUrl?: string;
  licenses?: { product: string; codes: string[] }[];
}

export function orderConfirmationEmail(d: OrderEmailData): { subject: string; html: string } {
  const rows = d.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantity}× ${i.name}</td><td style="padding:6px 0;text-align:right">${formatMoney(i.lineTotal, d.currency)}</td></tr>`
    )
    .join("");
  const licenseBlock = (d.licenses ?? []).length
    ? `<div style="margin-top:16px;padding:14px;border:1px dashed #16a34a;border-radius:12px">
        <p style="margin:0 0 6px;font-weight:700;color:#16a34a">Tus códigos / licencias</p>
        ${(d.licenses ?? []).map((l) => `<p style="margin:2px 0;font-size:13px"><b>${l.product}:</b> ${l.codes.map((c) => `<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px">${c}</code>`).join(" ")}</p>`).join("")}
      </div>`
    : "";
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:linear-gradient(135deg,#16a34a,#0ea5e9);height:8px;border-radius:8px 8px 0 0"></div>
    <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 16px 16px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 4px">¡Gracias por tu pedido, ${d.customerName}!</h1>
      <p style="color:#64748b;margin:0 0 16px">Pedido <b>#${d.number}</b> en ${d.storeName}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding-top:12px;border-top:1px solid #e2e8f0;font-weight:700">Total</td>
        <td style="padding-top:12px;border-top:1px solid #e2e8f0;text-align:right;font-weight:700">${formatMoney(d.total, d.currency)}</td></tr>
      </table>
      ${licenseBlock}
      ${d.storeUrl ? `<a href="${d.storeUrl}" style="display:inline-block;margin-top:20px;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Ver tienda</a>` : ""}
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Recibirás novedades de tu pedido por WhatsApp.</p>
    </div>
  </div>`;
  return { subject: `Pedido #${d.number} confirmado · ${d.storeName}`, html };
}

interface CartRecoveryData {
  storeName: string;
  customerName?: string | null;
  currency: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  storeUrl: string;
}

/** "You left items in your cart" recovery email. */
export function cartRecoveryEmail(d: CartRecoveryData): { subject: string; html: string } {
  const rows = d.items
    .slice(0, 8)
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantity}× ${i.name}</td><td style="padding:6px 0;text-align:right">${formatMoney(i.lineTotal, d.currency)}</td></tr>`
    )
    .join("");
  const hello = d.customerName ? `${d.customerName}, t` : "T";
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:linear-gradient(135deg,#16a34a,#0ea5e9);height:8px;border-radius:8px 8px 0 0"></div>
    <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 16px 16px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 4px">${hello}u carrito te espera 🛒</h1>
      <p style="color:#64748b;margin:0 0 16px">Guardamos lo que dejaste en ${d.storeName}. Termina tu pedido cuando quieras.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding-top:12px;border-top:1px solid #e2e8f0;font-weight:700">Subtotal</td>
        <td style="padding-top:12px;border-top:1px solid #e2e8f0;text-align:right;font-weight:700">${formatMoney(d.subtotal, d.currency)}</td></tr>
      </table>
      <a href="${d.storeUrl}" style="display:inline-block;margin-top:20px;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Completar mi pedido</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Si ya compraste, ignora este mensaje.</p>
    </div>
  </div>`;
  return { subject: `¿Olvidaste algo? Tu carrito en ${d.storeName}`, html };
}
