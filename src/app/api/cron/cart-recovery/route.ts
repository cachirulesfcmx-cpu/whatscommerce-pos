import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { sendEmail, cartRecoveryEmail, isEmailEnabled } from "@/lib/email";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

interface CartItem { name?: string; quantity?: number; lineTotal?: number; unitPrice?: number }

/**
 * Scheduled job: email a recovery message for abandoned carts.
 * Targets carts that are 1–72h old, have an email, weren't converted
 * (recoveredAt null) and weren't reminded yet (remindedAt null).
 *
 * Protect with CRON_SECRET via `Authorization: Bearer <secret>` or `?secret=`.
 * Schedule from Vercel Cron (vercel.json) or any external scheduler.
 */
export const POST = handle(async (req: NextRequest) => {
  // Auth guard (skipped only if no secret configured, e.g. local dev)
  if (env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    const qs = new URL(req.url).searchParams.get("secret");
    const provided = auth?.replace(/^Bearer\s+/i, "") ?? qs;
    if (provided !== env.CRON_SECRET) throw new ApiError(401, "No autorizado", "UNAUTHORIZED");
  }

  if (!isEmailEnabled) return ok({ sent: 0, skipped: "email_disabled" });

  const now = Date.now();
  const carts = await prisma.cart.findMany({
    where: {
      customerEmail: { not: null },
      recoveredAt: null,
      remindedAt: null,
      updatedAt: { gte: new Date(now - 72 * 3600_000), lte: new Date(now - 3600_000) },
    },
    include: { store: { select: { name: true, slug: true, currency: true } } },
    take: 100,
  });

  let sent = 0;
  for (const cart of carts) {
    const items = (cart.items as CartItem[]) ?? [];
    if (items.length === 0 || !cart.customerEmail) continue;
    const mail = cartRecoveryEmail({
      storeName: cart.store.name,
      customerName: cart.customerName,
      currency: cart.store.currency,
      items: items.map((i) => ({
        name: i.name ?? "Producto",
        quantity: Number(i.quantity ?? 1),
        lineTotal: Number(i.lineTotal ?? (i.unitPrice ?? 0) * (i.quantity ?? 1)),
      })),
      subtotal: Number(cart.subtotal),
      storeUrl: `${env.NEXT_PUBLIC_APP_URL}/store/${cart.store.slug}/checkout`,
    });
    const res = await sendEmail({ to: cart.customerEmail, subject: mail.subject, html: mail.html });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { remindedAt: new Date(), abandonedAt: cart.abandonedAt ?? new Date() },
    });
    if (res.ok) sent++;
  }

  return ok({ candidates: carts.length, sent });
});

// Allow GET for schedulers that only issue GET requests.
export const GET = POST;
