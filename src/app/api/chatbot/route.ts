import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { defaultGraph } from "@/lib/chatbot/types";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function getOrCreateDefault(storeId: string) {
  let flow = await prisma.chatFlow.findFirst({ where: { storeId, isDefault: true } });
  if (!flow) {
    flow = await prisma.chatFlow.create({
      data: { storeId, name: "Chatbot principal", isDefault: true, graph: defaultGraph() as object },
    });
  }
  return flow;
}

export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);
  const flow = await getOrCreateDefault(store.id);
  return ok(flow);
});

const saveSchema = z.object({
  graph: z.object({ blocks: z.array(z.any()) }),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const PUT = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "settings:update");

  const data = saveSchema.parse(await req.json());
  const flow = await getOrCreateDefault(store.id);
  const updated = await prisma.chatFlow.update({
    where: { id: flow.id },
    data: { graph: data.graph as object, ...(data.status ? { status: data.status } : {}) },
  });
  return ok(updated);
});
