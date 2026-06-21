import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { assertFeature } from "@/lib/plans/limits";
import { customerSchema } from "@/lib/validations/customer";
import { normalizePhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  await requireStoreAccess(store.id);

  // CSV export support: ?format=csv
  const url = new URL(req.url);
  const customers = await prisma.customer.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  if (url.searchParams.get("format") === "csv") {
    const header = "Nombre,Telefono,Email,Pedidos,Total gastado,Ultima compra\n";
    const rows = customers
      .map((c) =>
        [c.name, c.phone, c.email ?? "", c.ordersCount, Number(c.totalSpent), c.lastOrderAt?.toISOString() ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    return new Response(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="clientes-${store.slug}.csv"`,
      },
    });
  }

  return ok(customers);
});

export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "customers:create");
  await assertFeature(store.id, "customers");

  const data = customerSchema.parse(await req.json());
  const phone = normalizePhone(data.phone);
  const customer = await prisma.customer.upsert({
    where: { storeId_phone: { storeId: store.id, phone } },
    create: {
      storeId: store.id, name: data.name, phone, email: data.email || null,
      notes: data.notes ?? null, tags: data.tags, marketingOptIn: data.marketingOptIn,
    },
    update: {
      name: data.name, email: data.email || null, notes: data.notes ?? null,
      tags: data.tags, marketingOptIn: data.marketingOptIn,
    },
  });
  return ok(customer, { status: 201 });
});
