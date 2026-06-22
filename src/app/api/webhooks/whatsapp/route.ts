import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWhatsAppSignature, sendWhatsApp } from "@/lib/whatsapp";
import { normalizePhone } from "@/lib/utils";
import { toFlowGraph } from "@/lib/chatbot/types";
import { runFlow, type FlowState } from "@/lib/chatbot/engine";
import { aiComplete } from "@/lib/ai";

interface WaPayload {
  entry?: {
    changes?: {
      value?: {
        metadata?: { display_phone_number?: string };
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: { from?: string; text?: { body?: string }; type?: string }[];
      };
    }[];
  }[];
}

/** Route inbound WhatsApp text messages into the store inbox (best-effort). */
async function ingestInbound(payload: WaPayload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const businessPhone = value?.metadata?.display_phone_number;
      const messages = value?.messages ?? [];
      if (!businessPhone || messages.length === 0) continue;

      const wa = await prisma.whatsAppSettings.findFirst({
        where: { phone: normalizePhone(businessPhone) },
        select: { storeId: true },
      });
      if (!wa) continue;

      const contactName = value?.contacts?.[0]?.profile?.name ?? null;
      const [store, flow] = await Promise.all([
        prisma.store.findUnique({ where: { id: wa.storeId }, select: { name: true } }),
        prisma.chatFlow.findFirst({ where: { storeId: wa.storeId, isDefault: true, status: "PUBLISHED" } }),
      ]);

      for (const m of messages) {
        const body = m.text?.body;
        if (!body || !m.from) continue;
        const handle = normalizePhone(m.from);
        let conv = await prisma.conversation.findFirst({
          where: { storeId: wa.storeId, channel: "WHATSAPP", customerHandle: handle },
        });
        const isNew = !conv;
        if (!conv) {
          conv = await prisma.conversation.create({
            data: { storeId: wa.storeId, channel: "WHATSAPP", customerHandle: handle, customerName: contactName },
          });
        }
        await prisma.message.create({ data: { conversationId: conv.id, direction: "IN", text: body } });
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { lastMessageAt: new Date(), status: "OPEN", ...(contactName && !conv.customerName ? { customerName: contactName } : {}) },
        });

        // ── chatbot auto-response (published flow, bot still active) ──
        if (!flow || conv.botActive === false) continue;

        const aiFn = async (instructions: string, message: string) => {
          const products = await prisma.product.findMany({
            where: { storeId: wa.storeId, isActive: true }, select: { name: true, price: true }, take: 40,
          });
          const catalog = products.map((p) => `- ${p.name}: $${Number(p.price)}`).join("\n");
          const sys = `Eres el asistente de WhatsApp de "${store?.name ?? "la tienda"}". ${instructions}\nResponde en español, breve y amable.\nCatálogo:\n${catalog}`;
          return (await aiComplete(sys, message, { maxTokens: 220 })) ?? "Permíteme verificar eso y te confirmo. 🙏";
        };
        const onAction = async (action: string, text: string | undefined) => {
          if (action === "tag" && text) {
            const c = await prisma.customer.findFirst({ where: { storeId: wa.storeId, phone: handle } });
            if (c && !c.tags.includes(text)) {
              await prisma.customer.update({ where: { id: c.id }, data: { tags: { push: text } } });
            }
          }
        };

        const prevState = (isNew ? null : (conv.botState as FlowState | null)) ?? null;
        const result = await runFlow(toFlowGraph(flow.graph), prevState, body, { ai: aiFn, onAction });
        for (const reply of result.replies) {
          await sendWhatsApp(handle, reply);
          await prisma.message.create({ data: { conversationId: conv.id, direction: "OUT", text: reply } });
        }
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { botState: result.state as object, botActive: !result.ended, lastMessageAt: new Date() },
        });
      }
    }
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Meta webhook verification handshake
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

// Inbound WhatsApp events (messages, statuses). Signature-verified + idempotent.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (process.env.WHATSAPP_APP_SECRET) {
    const valid = await verifyWhatsAppSignature(raw, signature);
    if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await prisma.webhookEvent.create({
    data: { provider: "whatsapp", eventId, type: "inbound", payload: payload as object, processedAt: new Date() },
  });

  // Route inbound messages to the store inbox (best-effort).
  await ingestInbound(payload as WaPayload).catch(() => {});

  return NextResponse.json({ received: true });
}
