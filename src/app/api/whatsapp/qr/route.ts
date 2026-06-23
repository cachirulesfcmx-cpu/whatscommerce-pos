import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess } from "@/server/context";
import { resolveBridge } from "@/server/services/chatbot-runtime";

export const dynamic = "force-dynamic";

/**
 * Proxy the WhatsApp Web bridge status/QR for the dashboard (keeps the token
 * server-side). Ensures the session is started, then returns { configured,
 * status, qr }. Works with the platform-managed bridge or a self-hosted one.
 */
export const GET = handle(async () => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  const wa = await prisma.whatsAppSettings.findUnique({ where: { storeId: store.id } });
  const bridge = resolveBridge(wa, store.id);
  if (!bridge) return ok({ configured: false, status: "disconnected", qr: null });

  try {
    // ensure the session exists (managed bridge starts on demand)
    await fetch(`${bridge.base}/start`, { method: "POST", headers: { "x-bridge-token": bridge.token } }).catch(() => {});
    const res = await fetch(`${bridge.base}/qr`, { headers: { "x-bridge-token": bridge.token }, cache: "no-store" });
    if (!res.ok) return ok({ configured: true, status: "error", qr: null });
    const data = (await res.json()) as { status?: string; qr?: string | null };
    if (data.status) {
      await prisma.whatsAppSettings.update({ where: { storeId: store.id }, data: { bridgeStatus: data.status } }).catch(() => {});
    }
    return ok({ configured: true, status: data.status ?? "disconnected", qr: data.qr ?? null });
  } catch {
    return ok({ configured: true, status: "error", qr: null });
  }
});
