import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().or(z.literal("")).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string()).optional(),
  marketingOptIn: z.boolean().optional(),
});

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const store = await getActiveStore();
    if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
    const ctx = await requireStoreAccess(store.id);
    assertPermission(ctx.staff, "customers:update");

    const data = patchSchema.parse(await req.json());
    const existing = await prisma.customer.findFirst({ where: { id, storeId: store.id } });
    if (!existing) throw new ApiError(404, "Cliente no encontrado", "NOT_FOUND");

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.marketingOptIn !== undefined ? { marketingOptIn: data.marketingOptIn } : {}),
      },
    });
    return ok({ id: updated.id });
  }
);
