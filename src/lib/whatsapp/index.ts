import { isWhatsAppCloudEnabled } from "@/lib/env";
import { normalizePhone } from "@/lib/utils";

export * from "@/lib/whatsapp/ticket";

export interface SendResult {
  ok: boolean;
  channel: "cloud-api" | "wa-link";
  link?: string;
  error?: string;
}

/**
 * WhatsApp adapter.
 * - If the Cloud API is configured (token + phone number id), send directly.
 * - Otherwise return a wa.me deep link the client opens to send the message.
 * The whole system works without the Cloud API.
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<SendResult> {
  const phone = normalizePhone(to);
  const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (!isWhatsAppCloudEnabled) {
    return { ok: true, channel: "wa-link", link };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      }
    );
    if (!res.ok) {
      const error = await res.text();
      return { ok: false, channel: "cloud-api", error, link };
    }
    return { ok: true, channel: "cloud-api", link };
  } catch (e) {
    return {
      ok: false,
      channel: "cloud-api",
      error: e instanceof Error ? e.message : "unknown",
      link,
    };
  }
}

/** Verify Meta webhook signature (X-Hub-Signature-256). */
export async function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signature === `sha256=${hex}`;
}
