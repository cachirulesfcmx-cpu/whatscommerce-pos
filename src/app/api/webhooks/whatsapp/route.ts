import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWhatsAppSignature } from "@/lib/whatsapp";
import { normalizePhone } from "@/lib/utils";
import { handleInboundMessage } from "@/server/services/chatbot-runtime";

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

/** Route inbound Meta Cloud API messages into the store inbox + chatbot. */
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
      for (const m of messages) {
        const body = m.text?.body;
        if (!body || !m.from) continue;
        await handleInboundMessage({
          storeId: wa.storeId, channel: "WHATSAPP",
          handle: normalizePhone(m.from), name: contactName, text: body,
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
