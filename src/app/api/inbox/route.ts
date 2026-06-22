import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { sendWhatsAppForStore } from "@/server/services/chatbot-runtime";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET ?conversationId=...  → messages for a conversation
// GET (no params)          → conversation list with last message
export const GET = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  const convId = new URL(req.url).searchParams.get("conversationId");
  if (convId) {
    const conv = await prisma.conversation.findFirst({ where: { id: convId, storeId: store.id } });
    if (!conv) throw new ApiError(404, "Conversación no encontrada", "NOT_FOUND");
    const messages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return ok({ conversation: conv, messages });
  }

  const conversations = await prisma.conversation.findMany({
    where: { storeId: store.id },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return ok(conversations);
});

const replySchema = z.object({ conversationId: z.string().min(1), text: z.string().trim().min(1).max(2000) });

// POST → send an outbound reply (via WhatsApp Cloud API if configured) + store it
export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "orders:view");

  const { conversationId, text } = replySchema.parse(await req.json());
  const conv = await prisma.conversation.findFirst({ where: { id: conversationId, storeId: store.id } });
  if (!conv) throw new ApiError(404, "Conversación no encontrada", "NOT_FOUND");

  let delivered = false;
  if (conv.channel === "WHATSAPP") {
    const r = await sendWhatsAppForStore(store.id, conv.customerHandle, text);
    delivered = r.ok && (r.channel === "cloud-api" || r.channel === "qr-web");
  }

  const message = await prisma.message.create({
    data: { conversationId, direction: "OUT", text },
  });
  // A human stepped in → pause the bot for this conversation.
  await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date(), botActive: false } });

  return ok({ message, delivered });
});
