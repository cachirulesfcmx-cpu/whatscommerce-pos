import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ storeSlug: string; number: string }>;
}) {
  const { storeSlug, number } = await params;
  const store = await prisma.store.findFirst({ where: { slug: storeSlug } });
  if (!store) notFound();

  const order = await prisma.order.findFirst({
    where: { storeId: store.id, number },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pedido #{order.number}</h1>
        <Badge variant="success">{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>

      <Card className="mt-5"><CardContent className="space-y-3 p-5 text-sm">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between">
            <span>{it.quantity}× {it.name}{it.variantName ? ` (${it.variantName})` : ""}</span>
            <span>{formatMoney(Number(it.lineTotal), order.currency)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatMoney(Number(order.total), order.currency)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Pago</span><span>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></div>
      </CardContent></Card>

      <Button asChild variant="brand" className="mt-5 w-full"><Link href={`/store/${storeSlug}`}>Volver a la tienda</Link></Button>
    </div>
  );
}
