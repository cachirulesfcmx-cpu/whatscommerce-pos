import { test } from "node:test";
import assert from "node:assert/strict";
import { computePricing, lineTotal, computeSubtotal } from "@/lib/cart/pricing";
import { slugify, normalizePhone, formatMoney } from "@/lib/utils";
import { buildOrderTicket, buildWaMeLink } from "@/lib/whatsapp/ticket";
import { PLAN_CONFIG } from "@/lib/plans/plans";

const item = (over = {}) => ({
  productId: "p1", name: "X", unitPrice: 100, quantity: 1, extras: [], ...over,
});

test("lineTotal includes extras and quantity", () => {
  assert.equal(lineTotal(item({ quantity: 2, extras: [{ name: "Queso", price: 10 }] })), 220);
});

test("computeSubtotal sums lines", () => {
  assert.equal(computeSubtotal([item({ quantity: 2 }), item({ unitPrice: 50 })]), 250);
});

test("percentage coupon discounts subtotal", () => {
  const r = computePricing({ items: [item({ unitPrice: 200 })], coupon: { code: "X", type: "PERCENTAGE", value: 10 } });
  assert.equal(r.subtotal, 200);
  assert.equal(r.discount, 20);
  assert.equal(r.total, 180);
});

test("fixed coupon never exceeds subtotal", () => {
  const r = computePricing({ items: [item({ unitPrice: 50 })], coupon: { code: "X", type: "FIXED", value: 999 } });
  assert.equal(r.discount, 50);
  assert.equal(r.total, 0);
});

test("free shipping coupon zeroes shipping", () => {
  const r = computePricing({ items: [item()], shipping: 40, coupon: { code: "X", type: "FREE_SHIPPING", value: 0 } });
  assert.equal(r.shipping, 0);
  assert.equal(r.total, 100);
});

test("tax applied only when not included", () => {
  const inc = computePricing({ items: [item()], taxRate: 16, taxIncluded: true });
  const exc = computePricing({ items: [item()], taxRate: 16, taxIncluded: false });
  assert.equal(inc.tax, 0);
  assert.equal(exc.tax, 16);
  assert.equal(exc.total, 116);
});

test("slugify strips accents and symbols", () => {
  assert.equal(slugify("Tacos El Güero!"), "tacos-el-guero");
  assert.equal(slugify("Diseño & Web"), "diseno-web");
});

test("normalizePhone prefixes MX country code for 10 digits", () => {
  assert.equal(normalizePhone("5512345678"), "525512345678");
  assert.equal(normalizePhone("+52 55 1234 5678"), "525512345678");
});

test("formatMoney handles invalid input", () => {
  assert.ok(formatMoney("abc", "MXN").length > 0);
});

test("buildOrderTicket contains required sections", () => {
  const t = buildOrderTicket({
    storeName: "Tacos El Güero", orderNumber: "WC-1001", createdAt: new Date("2026-01-01"),
    currency: "MXN", customer: { name: "Ana", phone: "525511112222", address: "Calle 1" },
    deliveryMethodLabel: "Recoger en tienda",
    items: [{ name: "Taco", quantity: 2, unitPrice: 25, lineTotal: 50, extras: [{ name: "Salsa", price: 0 }] }],
    subtotal: 50, discount: 0, shipping: 0, tax: 0, total: 50, paymentMethodLabel: "Efectivo",
  });
  assert.match(t, /NUEVO PEDIDO/);
  assert.match(t, /WC-1001/);
  assert.match(t, /Ana/);
  assert.match(t, /Taco/);
  assert.match(t, /Total:/);
});

test("buildWaMeLink encodes message and phone", () => {
  const link = buildWaMeLink("5512345678", "hola mundo & precio");
  assert.match(link, /^https:\/\/wa\.me\/525512345678\?text=/);
  assert.ok(link.includes("%20"));
});

test("plan limits: BASIC caps, ENTERPRISE unlimited", () => {
  assert.equal(PLAN_CONFIG.BASIC.limits.maxProducts, 20);
  assert.equal(PLAN_CONFIG.PRO.limits.maxProducts, null);
  assert.equal(PLAN_CONFIG.ENTERPRISE.limits.maxStores, null);
  assert.equal(PLAN_CONFIG.BASIC.features.cardPayments, false);
  assert.equal(PLAN_CONFIG.PRO.features.cardPayments, true);
});
