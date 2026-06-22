import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess } from "@/server/context";
import { aiComplete, isAIEnabled } from "@/lib/ai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ instructions: z.string().min(1), message: z.string().min(1) });

// Preview an AI block reply using the store catalog as grounding context.
export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  const { instructions, message } = schema.parse(await req.json());

  if (!isAIEnabled) {
    return ok({ reply: "(IA no configurada) Agrega OPENAI_API_KEY para activar respuestas con IA.", enabled: false });
  }

  const products = await prisma.product.findMany({
    where: { storeId: store.id, isActive: true },
    select: { name: true, price: true, description: true },
    take: 40,
  });
  const catalog = products.map((p) => `- ${p.name}: $${Number(p.price)}${p.description ? ` — ${p.description}` : ""}`).join("\n");

  const system = `Eres el asistente de WhatsApp de la tienda "${store.name}".\nInstrucciones del negocio: ${instructions}\nResponde en español, breve y amable.\nCatálogo:\n${catalog}`;
  const reply = await aiComplete(system, message, { maxTokens: 220 });
  return ok({ reply: reply ?? "No pude generar una respuesta ahora.", enabled: true });
});
