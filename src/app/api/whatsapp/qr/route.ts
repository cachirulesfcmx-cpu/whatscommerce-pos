import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess } from "@/server/context";

export const dynamic = "force-dynamic";

/**
 * Proxy the WhatsApp Web bridge status/QR for the dashboard (keeps the
 * bridge token server-side). Returns { configured, status, qr }.
 */
export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  const wa = await prisma.whatsAppSettings.findUnique({ where: { storeId: store.id } });
  if (!wa?.bridgeUrl || !wa.bridgeToken) {
    return ok({ configured: false, status: "disconnected", qr: null });
  }

  try {
    const res = await fetch(`${wa.bridgeUrl.replace(/\/$/, "")}/qr`, {
      headers: { "x-bridge-token": wa.bridgeToken },
      cache: "no-store",
    });
    if (!res.ok) return ok({ configured: true, status: "error", qr: null });
    const data = (await res.json()) as { status?: string; qr?: string | null };
    // keep our copy of the status in sync
    if (data.status) {
      await prisma.whatsAppSettings.update({ where: { storeId: store.id }, data: { bridgeStatus: data.status } }).catch(() => {});
    }
    return ok({ configured: true, status: data.status ?? "disconnected", qr: data.qr ?? null });
  } catch {
    return ok({ configured: true, status: "error", qr: null });
  }
});
