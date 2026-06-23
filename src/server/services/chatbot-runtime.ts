import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";
import { normalizePhone } from "@/lib/utils";
import { toFlowGraph } from "@/lib/chatbot/types";
import { runFlow, type FlowState } from "@/lib/chatbot/engine";
import { aiComplete } from "@/lib/ai";

/**
 * Resolve the QR bridge to use for a store:
 * - Platform-managed bridge (WA_BRIDGE_URL/ADMIN_TOKEN) → store-scoped path. Zero
 *   setup per store; the store just pairs by QR from its dashboard.
 * - Otherwise fall back to a self-hosted per-store bridge (bridgeUrl/bridgeToken).
 */
export function resolveBridge(wa: { bridgeUrl?: string | null; bridgeToken?: string | null } | null, storeId: string) {
  const managedUrl = process.env.WA_BRIDGE_URL;
  const managedToken = process.env.WA_BRIDGE_ADMIN_TOKEN;
  if (managedUrl && managedToken) {
    return { base: `${managedUrl.replace(/\/$/, "")}/sessions/${storeId}`, token: managedToken };
  }
  if (wa?.bridgeUrl && wa.bridgeToken) {
    return { base: wa.bridgeUrl.replace(/\/$/, ""), token: wa.bridgeToken };
  }
  return null;
}

/**
 * Send a WhatsApp message using the store's configured transport:
 * - "qr"   → POST to the WhatsApp Web bridge (managed or self-hosted)
 * - "cloud"→ Meta Cloud API (env-configured)
 * - else   → wa.me deep link (returned for the client to open)
 */
export async function sendWhatsAppForStore(storeId: string, to: string, text: string) {
  const wa = await prisma.whatsAppSettings.findUnique({ where: { storeId } });
  if (wa?.mode === "qr") {
    const bridge = resolveBridge(wa, storeId);
    if (bridge) {
      try {
        const res = await fetch(`${bridge.base}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-bridge-token": bridge.token },
          body: JSON.stringify({ to: normalizePhone(to), text }),
        });
        return { ok: res.ok, channel: "qr-web" as const };
      } catch {
        return { ok: false, channel: "qr-web" as const };
      }
    }
  }
  return sendWhatsApp(to, text);
}

interface InboundArgs {
  storeId: string;
  channel: "WHATSAPP" | "INSTAGRAM";
  handle: string; // phone (normalized) or IG handle
  name?: string | null;
  text: string;
}

/**
 * Persist an inbound message and, if a published chatbot flow exists and the
 * bot is still active for the conversation, auto-reply and advance the flow.
 * Used by both the Meta Cloud webhook and the WhatsApp Web bridge webhook.
 */
export async function handleInboundMessage({ storeId, channel, handle, name, text }: InboundArgs) {
  let conv = await prisma.conversation.findFirst({ where: { storeId, channel, customerHandle: handle } });
  const isNew = !conv;
  if (!conv) {
    conv = await prisma.conversation.create({ data: { storeId, channel, customerHandle: handle, customerName: name ?? null } });
  }
  await prisma.message.create({ data: { conversationId: conv.id, direction: "IN", text } });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date(), status: "OPEN", ...(name && !conv.customerName ? { customerName: name } : {}) },
  });

  if (conv.botActive === false) return;
  const flow = await prisma.chatFlow.findFirst({ where: { storeId, isDefault: true, status: "PUBLISHED" } });
  if (!flow) return;

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
  const aiFn = async (instructions: string, message: string) => {
    const products = await prisma.product.findMany({
      where: { storeId, isActive: true }, select: { name: true, price: true }, take: 40,
    });
    const catalog = products.map((p) => `- ${p.name}: $${Number(p.price)}`).join("\n");
    const sys = `Eres el asistente de WhatsApp de "${store?.name ?? "la tienda"}". ${instructions}\nResponde en español, breve y amable.\nCatálogo:\n${catalog}`;
    return (await aiComplete(sys, message, { maxTokens: 220 })) ?? "Permíteme verificar eso y te confirmo. 🙏";
  };
  const onAction = async (action: string, value: string | undefined) => {
    if (action === "tag" && value) {
      const c = await prisma.customer.findFirst({ where: { storeId, phone: handle } });
      if (c && !c.tags.includes(value)) {
        await prisma.customer.update({ where: { id: c.id }, data: { tags: { push: value } } });
      }
    }
  };

  const prevState = (isNew ? null : (conv.botState as FlowState | null)) ?? null;
  const result = await runFlow(toFlowGraph(flow.graph), prevState, text, { ai: aiFn, onAction });

  for (const reply of result.replies) {
    await sendWhatsAppForStore(storeId, handle, reply);
    await prisma.message.create({ data: { conversationId: conv.id, direction: "OUT", text: reply } });
  }
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { botState: result.state as object, botActive: !result.ended, lastMessageAt: new Date() },
  });
}
