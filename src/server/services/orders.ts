import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import type { AppliedCoupon } from "@/lib/cart/pricing";
import { validateCoupon } from "@/lib/cart/coupon";
import { assertCanCreateOrder, incrementUsage } from "@/lib/plans/limits";
import { buildOrderTicket, buildWaMeLink } from "@/lib/whatsapp/ticket";
import { sendEmail, orderConfirmationEmail, isEmailEnabled } from "@/lib/email";
import { env } from "@/lib/env";
import {
  DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import type { CheckoutInput } from "@/lib/validations/checkout";
import type { OrderChannel, PaymentMethod, DeliveryMethod, Prisma } from "@prisma/client";

interface CreateOrderArgs {
  storeId: string;
  input: CheckoutInput;
  channel: OrderChannel;
  assignedToId?: string | null;
}

/**
 * Create an order from a checkout payload.
 * Prices are re-derived from the DB (never trust the client) for products and
 * variants; extras are validated against the product's modifiers.
 */
export async function createOrder({ storeId, input, channel, assignedToId }: CreateOrderArgs) {
  await assertCanCreateOrder(storeId);

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { settings: true, whatsappSettings: true },
  });
  if (!store) throw new ApiError(404, "Tienda no encontrada", "NOT_FOUND");

  // Fetch all referenced products/variants
  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId },
    include: {
      variants: true,
      inventory: true,
      modifiers: { include: { modifier: true } },
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Build validated line items with server prices
  const lineItems = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new ApiError(422, `Producto no disponible: ${item.name}`, "PRODUCT_UNAVAILABLE");

    let unitPrice = Number(product.price);
    let variantName: string | null = null;
    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) throw new ApiError(422, "Variante no disponible", "VARIANT_UNAVAILABLE");
      if (variant.price != null) unitPrice = Number(variant.price);
      variantName = variant.name;
    }

    // Validate extras against the product's modifier options
    const allowedExtras = new Map<string, number>();
    for (const m of product.modifiers) {
      for (const o of (m.modifier.options as { name: string; price: number }[]) ?? []) {
        allowedExtras.set(o.name, Number(o.price ?? 0));
      }
    }
    const extras = (item.extras ?? [])
      .filter((e) => allowedExtras.has(e.name))
      .map((e) => ({ name: e.name, price: allowedExtras.get(e.name)! }));

    const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
    const lineTotal = (unitPrice + extrasTotal) * item.quantity;

    return {
      product,
      productId: product.id,
      name: product.name,
      variantId: item.variantId ?? null,
      variantName,
      extras,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
      notes: item.notes ?? null,
    };
  });

  // Block sales without stock (when enabled per store)
  if (store.settings?.blockOutOfStock) {
    for (const li of lineItems) {
      if (!li.product.trackInventory) continue;
      const inv = li.product.inventory.find((i) =>
        li.variantId ? i.variantId === li.variantId : i.productId === li.productId && !i.variantId
      );
      const available = inv?.quantity ?? 0;
      if (available < li.quantity) {
        throw new ApiError(
          409,
          `Sin stock suficiente de "${li.name}" (disponible: ${available}).`,
          "OUT_OF_STOCK"
        );
      }
    }
  }

  // delivery fee from settings
  const deliveryMethods = (store.settings?.deliveryMethods as { method: string; fee?: number }[]) ?? [];
  const dm = deliveryMethods.find((d) => d.method === input.deliveryMethod);
  const shipping = Number(dm?.fee ?? 0);

  // coupon
  let coupon: AppliedCoupon | null = null;
  const subtotalForCoupon = lineItems.reduce((s, li) => s + li.lineTotal, 0);
  if (input.couponCode) {
    coupon = await validateCoupon(storeId, input.couponCode, subtotalForCoupon);
  }

  // All money is derived from server-side product/variant prices (never trust client).
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const subtotal = round2(subtotalForCoupon);
  const couponDiscount = coupon
    ? coupon.type === "PERCENTAGE"
      ? round2((subtotal * coupon.value) / 100)
      : coupon.type === "FIXED"
      ? Math.min(coupon.value, subtotal)
      : 0
    : 0;
  // Manual discount (POS): added on top of any coupon, capped at subtotal.
  const manualDiscount = Math.max(0, Number(input.manualDiscount ?? 0));
  const discount = Math.min(subtotal, round2(couponDiscount + manualDiscount));
  const finalShipping = coupon?.type === "FREE_SHIPPING" ? 0 : shipping;
  const taxableBase = Math.max(0, subtotal - discount);
  const taxRate = Number(store.settings?.taxRate ?? 0);
  const taxIncluded = store.settings?.taxIncluded ?? true;
  const tax = !taxIncluded && taxRate > 0 ? round2((taxableBase * taxRate) / 100) : 0;
  const total = round2(taxableBase + finalShipping + tax);

  const phone = input.customer.phone.replace(/[^0-9]/g, "");

  // Transaction: order number, customer upsert, order + items + payment, coupon, inventory, usage
  const order = await prisma.$transaction(async (tx) => {
    const settings = await tx.storeSettings.update({
      where: { storeId },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true, orderPrefix: true },
    });
    const number = `${settings.orderPrefix}-${settings.nextOrderNumber - 1 + 1000}`;

    const customer = await tx.customer.upsert({
      where: { storeId_phone: { storeId, phone } },
      create: {
        storeId, name: input.customer.name, phone,
        email: input.customer.email || null,
      },
      update: { name: input.customer.name, email: input.customer.email || undefined },
    });

    const created = await tx.order.create({
      data: {
        storeId,
        customerId: customer.id,
        number,
        channel,
        status: "NEW",
        customerName: input.customer.name,
        customerPhone: phone,
        customerEmail: input.customer.email || null,
        deliveryMethod: input.deliveryMethod as DeliveryMethod,
        deliveryAddress: input.address ? (input.address as Prisma.InputJsonValue) : undefined,
        deliveryFee: finalShipping,
        subtotal, discount, tax, total,
        currency: store.currency,
        couponCode: coupon?.code ?? null,
        paymentMethod: input.paymentMethod as PaymentMethod,
        paymentStatus: "PENDING",
        notes: input.notes ?? null,
        assignedToId: assignedToId ?? null,
        history: [{ at: new Date().toISOString(), status: "NEW", by: channel }],
        items: {
          create: lineItems.map((li) => ({
            productId: li.productId,
            name: li.name,
            variantName: li.variantName,
            extras: li.extras as Prisma.InputJsonValue,
            unitPrice: li.unitPrice,
            quantity: li.quantity,
            lineTotal: li.lineTotal,
            notes: li.notes,
          })),
        },
        payments: {
          create: {
            method: input.paymentMethod as PaymentMethod,
            provider: "MANUAL",
            status: "PENDING",
            amount: total,
            currency: store.currency,
          },
        },
      },
    });

    // coupon usage
    if (coupon) {
      await tx.coupon.update({
        where: { storeId_code: { storeId, code: coupon.code } },
        data: { usedCount: { increment: 1 } },
      });
    }

    // inventory decrement (best-effort, only tracked items)
    for (const li of lineItems) {
      if (li.product.trackInventory) {
        const inv = li.product.inventory.find((i) =>
          li.variantId ? i.variantId === li.variantId : i.productId === li.productId && !i.variantId
        );
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { decrement: li.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              storeId, productId: li.productId, variantId: li.variantId,
              type: "SALE", delta: -li.quantity, reference: number,
            },
          });
        }
      }
    }

    // customer rollup
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        ordersCount: { increment: 1 },
        totalSpent: { increment: total },
        lastOrderAt: new Date(),
      },
    });

    return created;
  });

  await incrementUsage(storeId, "orders", 1);

  // Digital products: auto-assign available license keys to this order.
  const assignedLicenses: { product: string; codes: string[] }[] = [];
  for (const li of lineItems) {
    if (li.product.type !== "DIGITAL") continue;
    const available = await prisma.licenseKey.findMany({
      where: { productId: li.productId, status: "AVAILABLE" },
      take: li.quantity,
      select: { id: true, code: true },
    });
    if (available.length === 0) continue;
    await prisma.licenseKey.updateMany({
      where: { id: { in: available.map((a) => a.id) } },
      data: { status: "ASSIGNED", orderId: order.id, assignedAt: new Date() },
    });
    assignedLicenses.push({ product: li.name, codes: available.map((a) => a.code) });
  }

  // mark the originating cart as recovered (for conversion analytics)
  if (input.cartToken) {
    await prisma.cart
      .updateMany({ where: { token: input.cartToken, storeId }, data: { recoveredAt: new Date() } })
      .catch(() => {});
  }

  // Build WhatsApp ticket + link
  const ticket = buildOrderTicket({
    storeName: store.name,
    orderNumber: order.number,
    createdAt: order.createdAt,
    currency: store.currency,
    customer: {
      name: input.customer.name,
      phone,
      address: input.address?.line1 ?? null,
    },
    deliveryMethodLabel: DELIVERY_METHOD_LABELS[input.deliveryMethod] ?? input.deliveryMethod,
    items: lineItems.map((li) => ({
      name: li.name, variantName: li.variantName, extras: li.extras,
      quantity: li.quantity, unitPrice: li.unitPrice, lineTotal: li.lineTotal, notes: li.notes,
    })),
    subtotal, discount, shipping: finalShipping, tax, total,
    paymentMethodLabel: PAYMENT_METHOD_LABELS[input.paymentMethod] ?? input.paymentMethod,
    notes: input.notes ?? null,
  });

  const businessPhone = store.whatsappSettings?.phone;
  const waLink = businessPhone ? buildWaMeLink(businessPhone, ticket) : null;

  // Transactional email (no-op if Resend not configured) — fire-and-forget
  if (input.customer.email && isEmailEnabled) {
    const mail = orderConfirmationEmail({
      storeName: store.name,
      number: order.number,
      customerName: input.customer.name,
      currency: store.currency,
      items: lineItems.map((li) => ({ name: li.name, quantity: li.quantity, lineTotal: li.lineTotal })),
      total,
      storeUrl: `${env.NEXT_PUBLIC_APP_URL}/store/${store.slug}`,
      licenses: assignedLicenses,
    });
    sendEmail({ to: input.customer.email, subject: mail.subject, html: mail.html }).catch(() => {});
  }

  return { order, ticket, waLink, licenses: assignedLicenses };
}
