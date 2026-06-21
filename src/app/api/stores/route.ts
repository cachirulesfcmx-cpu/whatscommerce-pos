import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { requireStoreAccess, assertPermission, getActiveStore } from "@/server/context";
import { onboardingSchema, storeSettingsSchema } from "@/lib/validations/store";
import { audit } from "@/lib/security/audit";
import { normalizePhone } from "@/lib/utils";

// Complete onboarding for the active store
export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "settings:manage");

  const data = onboardingSchema.parse(await req.json());

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: {
      name: data.name,
      description: data.description,
      businessType: data.businessType,
      currency: data.currency,
      country: data.country,
      timezone: data.timezone,
      templateKey: data.templateKey,
      primaryColor: data.primaryColor,
      onboarded: true,
      whatsappSettings: {
        upsert: {
          create: { phone: normalizePhone(data.whatsappPhone) },
          update: { phone: normalizePhone(data.whatsappPhone) },
        },
      },
    },
  });

  await audit({ storeId: store.id, userId: ctx.user.id, action: "store.onboard" });
  return ok({ id: updated.id, slug: updated.slug });
});

// Update store settings / theme
export const PATCH = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "settings:update");

  const data = storeSettingsSchema.parse(await req.json());
  const { deliveryMethods, paymentMethods, taxRate, blockOutOfStock, ...storeFields } = data;

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: {
      ...storeFields,
      settings: {
        upsert: {
          create: {
            deliveryMethods: deliveryMethods ?? [],
            paymentMethods: paymentMethods ?? [],
            taxRate: taxRate ?? 0,
            blockOutOfStock: blockOutOfStock ?? false,
          },
          update: {
            ...(deliveryMethods !== undefined ? { deliveryMethods } : {}),
            ...(paymentMethods !== undefined ? { paymentMethods } : {}),
            ...(taxRate !== undefined ? { taxRate } : {}),
            ...(blockOutOfStock !== undefined ? { blockOutOfStock } : {}),
          },
        },
      },
    },
  });

  await audit({ storeId: store.id, userId: ctx.user.id, action: "store.update" });
  return ok({ id: updated.id });
});
