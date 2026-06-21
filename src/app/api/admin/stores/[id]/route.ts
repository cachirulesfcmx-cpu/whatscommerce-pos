import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { requireSuperAdmin } from "@/server/context";
import { audit } from "@/lib/security/audit";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]).optional(),
  tier: z.enum(["BASIC", "PRO", "ENTERPRISE"]).optional(),
});

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const admin = await requireSuperAdmin();
    const data = schema.parse(await req.json());

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) throw new ApiError(404, "Tienda no encontrada", "NOT_FOUND");

    if (data.status) {
      await prisma.store.update({ where: { id }, data: { status: data.status } });
    }

    if (data.tier) {
      const plan = await prisma.plan.findUnique({ where: { tier: data.tier } });
      if (!plan) throw new ApiError(400, "Plan no encontrado", "NO_PLAN");
      await prisma.subscription.upsert({
        where: { storeId: id },
        create: { storeId: id, planId: plan.id, status: "ACTIVE" },
        update: { planId: plan.id, status: "ACTIVE" },
      });
    }

    await audit({
      storeId: id, userId: admin.id, action: "admin.store.update", entityId: id, metadata: { ...data },
    });
    return ok({ id });
  }
);
