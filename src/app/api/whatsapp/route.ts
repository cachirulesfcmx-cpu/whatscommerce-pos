import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { whatsappSettingsSchema } from "@/lib/validations/whatsapp";
import { normalizePhone } from "@/lib/utils";

export const PATCH = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "settings:update");

  const data = whatsappSettingsSchema.parse(await req.json());
  const ws = await prisma.whatsAppSettings.upsert({
    where: { storeId: store.id },
    create: {
      storeId: store.id, phone: normalizePhone(data.phone), displayName: data.displayName ?? null,
      language: data.language, notifyCustomer: data.notifyCustomer, templates: data.templates ?? {},
    },
    update: {
      phone: normalizePhone(data.phone), displayName: data.displayName ?? null,
      language: data.language, notifyCustomer: data.notifyCustomer,
      ...(data.templates ? { templates: data.templates } : {}),
    },
  });
  return ok({ id: ws.id });
});
