import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess } from "@/server/context";
import { aiComplete, isAIEnabled } from "@/lib/ai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ conversationId: z.string().min(1) });

// Suggest a reply for the latest customer message, grounded in the catalog.
export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  const { conversationId } = schema.parse(await req.json());
  const conv = await prisma.conversation.findFirst({ where: { id: conversationId, storeId: store.id } });
  if (!conv) throw new ApiError(404, "Conversación no encontrada", "NOT_FOUND");

  if (!isAIEnabled) {
    return ok({ reply: "", enabled: false });
  }

  const [messages, products] = await Promise.all([
    prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.product.findMany({ where: { storeId: store.id, isActive: true }, select: { name: true, price: true }, take: 40 }),
  ]);
  const history = messages.reverse().map((m) => `${m.direction === "IN" ? "Cliente" : "Tienda"}: ${m.text}`).join("\n");
  const catalog = products.map((p) => `- ${p.name}: $${Number(p.price)}`).join("\n");

  const system = `Eres un agente de atención al cliente de la tienda "${store.name}" por WhatsApp. Responde en español, breve, amable y útil. Si preguntan por productos/precios usa el catálogo.\nCatálogo:\n${catalog}`;
  const reply = await aiComplete(system, `Conversación:\n${history}\n\nEscribe la mejor respuesta de la tienda al último mensaje del cliente.`, { maxTokens: 220 });
  return ok({ reply: reply ?? "", enabled: true });
});
