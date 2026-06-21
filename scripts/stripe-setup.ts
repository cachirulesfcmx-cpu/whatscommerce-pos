/* eslint-disable no-console */
/**
 * Crea (idempotente) los productos y precios de WhatsCommerce en Stripe.
 * Uso:
 *   STRIPE_SECRET_KEY=sk_live_xxx npx tsx scripts/stripe-setup.ts
 * Al final imprime las variables de entorno que debes poner en Vercel.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("✗ Falta STRIPE_SECRET_KEY. Ej: STRIPE_SECRET_KEY=sk_live_xxx npx tsx scripts/stripe-setup.ts");
  process.exit(1);
}
const stripe = new Stripe(key);
const CURRENCY = (process.env.STRIPE_CURRENCY || "mxn").toLowerCase();

interface PlanDef {
  productName: string;
  monthly: { lookup: string; amount: number };
  yearly: { lookup: string; amount: number };
}

const PLANS: PlanDef[] = [
  {
    productName: "WhatsCommerce Pro",
    monthly: { lookup: "wc_pro_monthly", amount: 399 },
    yearly: { lookup: "wc_pro_yearly", amount: 3990 },
  },
  {
    productName: "WhatsCommerce Enterprise",
    monthly: { lookup: "wc_enterprise_monthly", amount: 1499 },
    yearly: { lookup: "wc_enterprise_yearly", amount: 14990 },
  },
];

async function findOrCreateProduct(name: string): Promise<string> {
  const search = await stripe.products.search({ query: `name:'${name}'` });
  const active = search.data.find((p) => p.active);
  if (active) return active.id;
  const created = await stripe.products.create({ name });
  return created.id;
}

async function findOrCreatePrice(productId: string, lookup: string, amount: number, interval: "month" | "year") {
  const existing = await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount * 100,
    currency: CURRENCY,
    recurring: { interval },
    lookup_key: lookup,
    transfer_lookup_key: true,
  });
  return price.id;
}

async function main() {
  console.log(`▶ Configurando Stripe (currency: ${CURRENCY.toUpperCase()})…\n`);
  const out: Record<string, string> = {};

  for (const plan of PLANS) {
    const productId = await findOrCreateProduct(plan.productName);
    const m = await findOrCreatePrice(productId, plan.monthly.lookup, plan.monthly.amount, "month");
    const y = await findOrCreatePrice(productId, plan.yearly.lookup, plan.yearly.amount, "year");
    const tier = plan.productName.includes("Pro") ? "PRO" : "ENTERPRISE";
    out[`STRIPE_PRICE_${tier}_MONTHLY`] = m;
    out[`STRIPE_PRICE_${tier}_YEARLY`] = y;
    console.log(`✓ ${plan.productName}: mensual=${m} anual=${y}`);
  }

  console.log("\n──────── Copia esto a tus variables de entorno (Vercel) ────────\n");
  for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
  console.log("\n(La app usa STRIPE_PRICE_PRO_MONTHLY y STRIPE_PRICE_ENTERPRISE_MONTHLY.)");
  console.log("Recuerda también: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY y STRIPE_WEBHOOK_SECRET.");
}

main().catch((e) => { console.error(e); process.exit(1); });
