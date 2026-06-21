import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata = { title: "Finalizar pedido" };
export const dynamic = "force-dynamic";

async function loadStore(storeSlug: string) {
  if (storeSlug === "_host") {
    const host = (await headers()).get("x-tenant-host");
    if (!host) return null;
    const domain = await prisma.domain.findUnique({
      where: { host: host.toLowerCase() },
      select: { store: { include: { settings: true } } },
    });
    return domain?.store ?? null;
  }
  return prisma.store.findFirst({
    where: { slug: storeSlug, status: "ACTIVE" },
    include: { settings: true },
  });
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await loadStore(storeSlug);
  if (!store) notFound();

  const delivery =
    ((store.settings?.deliveryMethods as { method: string; label: string; fee?: number; enabled?: boolean }[]) ?? [])
      .filter((d) => d.enabled !== false);
  const payment =
    ((store.settings?.paymentMethods as { method: string; label: string; enabled?: boolean }[]) ?? [])
      .filter((p) => p.enabled !== false);

  return (
    <CheckoutForm
      storeId={store.id}
      slug={store.slug}
      currency={store.currency}
      accent={store.primaryColor}
      deliveryMethods={delivery.length ? delivery : [{ method: "PICKUP", label: "Recoger en tienda", fee: 0 }]}
      paymentMethods={payment.length ? payment : [{ method: "CASH", label: "Efectivo" }]}
    />
  );
}
