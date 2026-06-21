import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validations/auth";
import { handle, ok, ApiError } from "@/server/api";
import { slugify } from "@/lib/utils";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "tienda";
  let i = 0;
  // try base, base-2, base-3...
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const exists = await prisma.store.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    i += 1;
  }
}

export const POST = handle(async (req: NextRequest) => {
  const ip = clientIp(req.headers);
  const rl = await rateLimit(`register:${ip}`, 10, 600);
  if (!rl.success) throw new ApiError(429, "Demasiados intentos. Intenta más tarde.");

  const body = await req.json();
  const data = registerSchema.parse(body);
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Ya existe una cuenta con este email", "EMAIL_TAKEN");

  const basicPlan = await prisma.plan.findUnique({ where: { tier: "BASIC" } });
  if (!basicPlan)
    throw new ApiError(500, "Planes no inicializados. Ejecuta el seed.", "NO_PLANS");

  const passwordHash = await hashPassword(data.password);
  const slug = await uniqueSlug(data.storeName);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: data.name, email, passwordHash },
    });

    const store = await tx.store.create({
      data: {
        ownerId: user.id,
        name: data.storeName,
        slug,
        settings: {
          create: {
            paymentMethods: [
              { method: "CASH", label: "Efectivo", enabled: true },
              { method: "TRANSFER", label: "Transferencia", enabled: true },
            ],
            deliveryMethods: [
              { method: "PICKUP", label: "Recoger en tienda", fee: 0, enabled: true },
            ],
          },
        },
        whatsappSettings: { create: {} },
      },
    });

    await tx.staff.create({
      data: { storeId: store.id, userId: user.id, role: "OWNER", acceptedAt: new Date() },
    });

    await tx.subscription.create({
      data: {
        storeId: store.id,
        planId: basicPlan.id,
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });

    return { user, store };
  });

  await audit({
    storeId: result.store.id,
    userId: result.user.id,
    action: "auth.register",
    ip,
    metadata: { email },
  });

  return ok({ storeId: result.store.id, slug: result.store.slug }, { status: 201 });
});
