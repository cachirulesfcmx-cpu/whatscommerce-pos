import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { handleInboundMessage } from "@/server/services/chatbot-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inbound endpoint for the WhatsApp Web bridge (QR connection).
 * The bridge posts each received message here, authenticated with the
 * per-store bridgeToken. Reuses the same chatbot/inbox pipeline as Cloud API.
 *
 * Body: { storeId, from, name?, text }
 * Header: x-bridge-token: <store.whatsappSettings.bridgeToken>
 */
export async function POST(req: NextRequest) {
  let body: { storeId?: string; from?: string; name?: string; text?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const storeId = body.storeId;
  if (!storeId) return NextResponse.json({ error: "missing storeId" }, { status: 400 });

  const wa = await prisma.whatsAppSettings.findUnique({ where: { storeId } });
  const token = req.headers.get("x-bridge-token");
  const managedToken = process.env.WA_BRIDGE_ADMIN_TOKEN;
  const authorized = (managedToken && token === managedToken) || (wa?.bridgeToken && token === wa.bridgeToken);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // status pings (connected / qr / disconnected)
  if (body.status) {
    await prisma.whatsAppSettings.update({ where: { storeId }, data: { bridgeStatus: body.status } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  if (!body.from || !body.text) return NextResponse.json({ error: "missing message" }, { status: 400 });

  await handleInboundMessage({
    storeId,
    channel: "WHATSAPP",
    handle: normalizePhone(body.from),
    name: body.name ?? null,
    text: body.text,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
