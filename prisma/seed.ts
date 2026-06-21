/* eslint-disable no-console */
import { PrismaClient, type PlanTier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Inline plan config (seed must not import app aliases).
const PLANS: Record<
  PlanTier,
  {
    name: string; description: string; priceMonthly: number; priceYearly: number;
    maxStores: number | null; maxProducts: number | null; maxImages: number | null;
    maxOrdersMonth: number | null; maxStaff: number | null; maxBranches: number | null;
    features: Record<string, boolean>; sortOrder: number;
  }
> = {
  BASIC: {
    name: "Básico", description: "Para empezar a vender por WhatsApp gratis.",
    priceMonthly: 0, priceYearly: 0,
    maxStores: 1, maxProducts: 20, maxImages: 20, maxOrdersMonth: 50, maxStaff: 1, maxBranches: 1,
    features: {}, sortOrder: 0,
  },
  PRO: {
    name: "Pro", description: "Para crecer y profesionalizar tu negocio.",
    priceMonthly: 399, priceYearly: 3990,
    maxStores: 1, maxProducts: null, maxImages: null, maxOrdersMonth: null, maxStaff: 5, maxBranches: 1,
    features: {
      cardPayments: true, customDomain: true, removeBranding: true, coupons: true, variants: true,
      inventory: true, customers: true, reports: true, whatsappAutomation: true, cartRecovery: true,
      premiumTemplates: true, advancedSeo: true,
    },
    sortOrder: 1,
  },
  ENTERPRISE: {
    name: "Enterprise", description: "Multi-tienda, sucursales y automatizaciones avanzadas.",
    priceMonthly: 1499, priceYearly: 14990,
    maxStores: null, maxProducts: null, maxImages: null, maxOrdersMonth: null, maxStaff: null, maxBranches: null,
    features: {
      cardPayments: true, customDomain: true, removeBranding: true, coupons: true, variants: true,
      inventory: true, customers: true, reports: true, whatsappAutomation: true, cartRecovery: true,
      premiumTemplates: true, advancedSeo: true, multiStore: true, multiBranch: true, advancedRoles: true,
      api: true, webhooks: true, whatsappCloudApi: true, broadcasts: true, whiteLabel: true, advancedReports: true,
    },
    sortOrder: 2,
  },
};

const TEMPLATES = [
  { key: "minimal-store", name: "Minimal Store", isPremium: false },
  { key: "food-express", name: "Food Express", isPremium: false },
  { key: "boutique-pro", name: "Boutique Pro", isPremium: true },
  { key: "beauty-studio", name: "Beauty Studio", isPremium: true },
  { key: "digital-services", name: "Digital Services", isPremium: true },
  { key: "wholesale-catalog", name: "Wholesale Catalog", isPremium: true },
  { key: "premium-dark", name: "Premium Dark", isPremium: true },
  { key: "local-market", name: "Local Market", isPremium: false },
];

function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/600/600`;
}

async function main() {
  console.log("🌱 Seeding WhatsCommerce POS…");

  // Plans
  for (const tier of Object.keys(PLANS) as PlanTier[]) {
    const p = PLANS[tier];
    await prisma.plan.upsert({
      where: { tier },
      create: {
        tier, name: p.name, description: p.description, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly,
        currency: "MXN", maxStores: p.maxStores, maxProducts: p.maxProducts, maxImages: p.maxImages,
        maxOrdersMonth: p.maxOrdersMonth, maxStaff: p.maxStaff, maxBranches: p.maxBranches,
        features: p.features, sortOrder: p.sortOrder,
      },
      update: { name: p.name, priceMonthly: p.priceMonthly, features: p.features, maxProducts: p.maxProducts, maxOrdersMonth: p.maxOrdersMonth },
    });
  }
  console.log("✓ Plans");

  // Templates
  for (const t of TEMPLATES) {
    await prisma.template.upsert({
      where: { key: t.key },
      create: { key: t.key, name: t.name, isPremium: t.isPremium },
      update: { name: t.name, isPremium: t.isPremium },
    });
  }
  console.log("✓ Templates");

  const plans = {
    BASIC: await prisma.plan.findUniqueOrThrow({ where: { tier: "BASIC" } }),
    PRO: await prisma.plan.findUniqueOrThrow({ where: { tier: "PRO" } }),
    ENTERPRISE: await prisma.plan.findUniqueOrThrow({ where: { tier: "ENTERPRISE" } }),
  };

  // Super admin
  const adminPass = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || "ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: (process.env.SUPERADMIN_EMAIL || "admin@whatscommerce.com").toLowerCase() },
    create: {
      email: (process.env.SUPERADMIN_EMAIL || "admin@whatscommerce.com").toLowerCase(),
      name: "Super Admin", passwordHash: adminPass, isSuperAdmin: true,
    },
    update: { isSuperAdmin: true },
  });
  console.log("✓ Super admin");

  // Demo stores
  const demoPass = await bcrypt.hash("Demo1234", 12);

  type DemoProduct = {
    name: string; price: number; compareAtPrice?: number; category: string;
    featured?: boolean; track?: boolean; stock?: number; img: string;
    variants?: { name: string; price?: number }[];
  };
  type Demo = {
    slug: string; name: string; email: string; description: string; businessType: string;
    template: string; color: string; plan: PlanTier; phone: string;
    categories: string[]; products: DemoProduct[]; customer: { name: string; phone: string };
  };

  const demos: Demo[] = [
    {
      slug: "tacos-el-guero", name: "Tacos El Güero", email: "comida@demo.com",
      description: "Tacos, quesadillas y antojitos recién hechos.", businessType: "restaurant",
      template: "food-express", color: "#ef4444", plan: "PRO", phone: "5215512345678",
      categories: ["Tacos", "Bebidas", "Postres"],
      products: [
        { name: "Taco al pastor", price: 25, category: "Tacos", featured: true, img: img("pastor"), variants: [{ name: "Sencillo" }, { name: "Doble tortilla", price: 30 }] },
        { name: "Taco de bistec", price: 28, category: "Tacos", img: img("bistec") },
        { name: "Quesadilla", price: 45, category: "Tacos", img: img("quesadilla") },
        { name: "Agua de horchata", price: 20, category: "Bebidas", track: true, stock: 40, img: img("horchata") },
        { name: "Refresco", price: 22, category: "Bebidas", img: img("refresco") },
        { name: "Flan napolitano", price: 35, category: "Postres", featured: true, img: img("flan") },
      ],
      customer: { name: "Ana López", phone: "5215511112222" },
    },
    {
      slug: "boutique-luna", name: "Boutique Luna", email: "boutique@demo.com",
      description: "Moda femenina con estilo. Envíos a todo México.", businessType: "clothing",
      template: "boutique-pro", color: "#db2777", plan: "PRO", phone: "5215587654321",
      categories: ["Vestidos", "Blusas", "Accesorios"],
      products: [
        { name: "Vestido floral", price: 599, compareAtPrice: 799, category: "Vestidos", featured: true, track: true, stock: 12, img: img("vestido"), variants: [{ name: "Talla S" }, { name: "Talla M" }, { name: "Talla L" }] },
        { name: "Blusa de lino", price: 349, category: "Blusas", track: true, stock: 20, img: img("blusa"), variants: [{ name: "Blanco" }, { name: "Beige" }] },
        { name: "Bolso de mano", price: 459, category: "Accesorios", featured: true, img: img("bolso") },
        { name: "Collar minimalista", price: 199, category: "Accesorios", img: img("collar") },
      ],
      customer: { name: "María Fernanda", phone: "5215533334444" },
    },
    {
      slug: "estudio-creativo", name: "Estudio Creativo", email: "servicios@demo.com",
      description: "Diseño, branding y marketing digital para tu negocio.", businessType: "services",
      template: "digital-services", color: "#0ea5e9", plan: "ENTERPRISE", phone: "5215599998888",
      categories: ["Diseño", "Marketing", "Web"],
      products: [
        { name: "Logo profesional", price: 2500, category: "Diseño", featured: true, img: img("logo") },
        { name: "Identidad de marca", price: 6500, category: "Diseño", img: img("branding") },
        { name: "Gestión de redes (mensual)", price: 4500, category: "Marketing", featured: true, img: img("redes") },
        { name: "Landing page", price: 8000, category: "Web", img: img("landing") },
      ],
      customer: { name: "Carlos Méndez", phone: "5215577776666" },
    },
  ];

  for (const d of demos) {
    const owner = await prisma.user.upsert({
      where: { email: d.email },
      create: { email: d.email, name: `Dueño ${d.name}`, passwordHash: demoPass },
      update: {},
    });

    // clean previous demo store to make seed idempotent
    await prisma.store.deleteMany({ where: { slug: d.slug } });

    const store = await prisma.store.create({
      data: {
        ownerId: owner.id, name: d.name, slug: d.slug, description: d.description,
        businessType: d.businessType, templateKey: d.template, primaryColor: d.color,
        onboarded: true, currency: "MXN",
        settings: {
          create: {
            showBranding: d.plan === "BASIC",
            deliveryMethods: [
              { method: "PICKUP", label: "Recoger en tienda", fee: 0, enabled: true },
              { method: "LOCAL_DELIVERY", label: "Envío local", fee: 40, enabled: true },
            ],
            paymentMethods: [
              { method: "CASH", label: "Efectivo", enabled: true },
              { method: "TRANSFER", label: "Transferencia", enabled: true },
              { method: "CARD", label: "Tarjeta", enabled: d.plan !== "BASIC" },
            ],
            taxRate: 0,
          },
        },
        whatsappSettings: { create: { phone: d.phone, displayName: d.name } },
        subscription: {
          create: { planId: plans[d.plan].id, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 864e5) },
        },
        staff: { create: { userId: owner.id, role: "OWNER", acceptedAt: new Date() } },
      },
    });

    // categories
    const catMap = new Map<string, string>();
    for (let i = 0; i < d.categories.length; i++) {
      const name = d.categories[i];
      const c = await prisma.category.create({
        data: { storeId: store.id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), sortOrder: i },
      });
      catMap.set(name, c.id);
    }

    // products
    for (let i = 0; i < d.products.length; i++) {
      const p = d.products[i];
      const product = await prisma.product.create({
        data: {
          storeId: store.id, name: p.name, slug: p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          price: p.price, compareAtPrice: p.compareAtPrice ?? null, categoryId: catMap.get(p.category),
          isFeatured: p.featured ?? false, trackInventory: p.track ?? false, sortOrder: i,
          images: { create: [{ url: p.img, alt: p.name, sortOrder: 0 }] },
          variants: p.variants
            ? { create: p.variants.map((v, vi) => ({ name: v.name, price: v.price ?? null, sortOrder: vi })) }
            : undefined,
        },
        include: { variants: true },
      });
      if (p.track) {
        await prisma.inventory.create({ data: { storeId: store.id, productId: product.id, quantity: p.stock ?? 10 } });
      }
    }

    // a coupon (Pro+)
    if (d.plan !== "BASIC") {
      await prisma.coupon.create({
        data: { storeId: store.id, code: "BIENVENIDA10", type: "PERCENTAGE", value: 10, isActive: true },
      });
    }

    // a demo customer + order
    const customer = await prisma.customer.create({
      data: { storeId: store.id, name: d.customer.name, phone: d.customer.phone, ordersCount: 1, totalSpent: d.products[0].price * 2, lastOrderAt: new Date() },
    });
    const firstProduct = d.products[0];
    const settings = await prisma.storeSettings.update({
      where: { storeId: store.id }, data: { nextOrderNumber: { increment: 1 } }, select: { orderPrefix: true, nextOrderNumber: true },
    });
    await prisma.order.create({
      data: {
        storeId: store.id, customerId: customer.id, number: `${settings.orderPrefix}-${settings.nextOrderNumber - 1 + 1000}`,
        status: "NEW", channel: "STORE", customerName: customer.name, customerPhone: customer.phone,
        deliveryMethod: "PICKUP", subtotal: firstProduct.price * 2, total: firstProduct.price * 2, currency: "MXN",
        paymentMethod: "CASH", paymentStatus: "PENDING",
        history: [{ at: new Date().toISOString(), status: "NEW", by: "STORE" }],
        items: { create: [{ name: firstProduct.name, unitPrice: firstProduct.price, quantity: 2, lineTotal: firstProduct.price * 2 }] },
        payments: { create: { method: "CASH", amount: firstProduct.price * 2, currency: "MXN", status: "PENDING" } },
      },
    });

    console.log(`✓ Store: ${d.name} (/store/${d.slug})  — login: ${d.email} / Demo1234`);
  }

  console.log("\n✅ Seed completo.");
  console.log("   Super admin:", process.env.SUPERADMIN_EMAIL || "admin@whatscommerce.com");
  console.log("   Tiendas demo: comida@demo.com, boutique@demo.com, servicios@demo.com (pass: Demo1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
