/**
 * On-the-fly demo catalogs by industry.
 *
 * Each industry maps to an "archetype" with realistic categories + products and
 * curated Unsplash photos. Rendered through the real storefront in demo mode, so
 * every industry gets a distinct, on-brand demo without seeding the database.
 *
 * Images use stable Unsplash IDs; the storefront falls back to a keyword photo
 * if any URL fails, so a relevant image always shows.
 */
import { INDUSTRIES, getIndustry } from "@/lib/industries";

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&h=640&q=80`;

export interface DemoProduct {
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  featured?: boolean;
  image: string;
  /** keyword for image fallback */
  kw: string;
  variants?: { name: string; price?: number }[];
}

export interface DemoArchetype {
  storeName: string;
  tagline: string;
  templateKey: string;
  categories: string[];
  products: DemoProduct[];
}

/* ─────────────────────────── ARCHETYPES ─────────────────────────── */

const ARCHETYPES: Record<string, DemoArchetype> = {
  restaurant: {
    storeName: "Sazón & Brasa",
    tagline: "Cocina recién hecha, pedidos para llevar o a domicilio",
    templateKey: "food-express",
    categories: ["Especialidades", "Tacos", "Bebidas", "Postres"],
    products: [
      { name: "Tacos al pastor (orden)", price: 75, category: "Tacos", featured: true, kw: "tacos", image: U("photo-1599974579688-8dbdd335c77f"), variants: [{ name: "Orden de 4" }, { name: "Orden de 6", price: 105 }] },
      { name: "Burrito de asada", price: 95, category: "Especialidades", featured: true, kw: "burrito", image: U("photo-1626700051175-6818013e1d4f") },
      { name: "Quesabirria", price: 110, category: "Especialidades", kw: "birria,tacos", image: U("photo-1551504734-5ee1c4a1479b") },
      { name: "Guacamole con totopos", price: 65, category: "Especialidades", kw: "guacamole", image: U("photo-1600891964092-4316c288032e") },
      { name: "Agua fresca de horchata", price: 35, category: "Bebidas", kw: "horchata,drink", image: U("photo-1551024709-8f23befc6f87") },
      { name: "Flan napolitano", price: 55, category: "Postres", featured: true, kw: "flan,dessert", image: U("photo-1624353365286-3f8d62daad51") },
    ],
  },

  cafe: {
    storeName: "Café Aurora",
    tagline: "Café de especialidad, repostería y un buen rato",
    templateKey: "cafe",
    categories: ["Café", "Fríos", "Panadería", "Snacks"],
    products: [
      { name: "Cappuccino", price: 55, category: "Café", featured: true, kw: "cappuccino,coffee", image: U("photo-1572442388796-11668a67e53d"), variants: [{ name: "Chico" }, { name: "Grande", price: 65 }] },
      { name: "Latte de vainilla", price: 62, category: "Café", kw: "latte,coffee", image: U("photo-1461023058943-07fcbe16d735") },
      { name: "Cold brew", price: 58, category: "Fríos", featured: true, kw: "cold brew,iced coffee", image: U("photo-1517701550927-30cf4ba1dba5") },
      { name: "Croissant de mantequilla", price: 45, category: "Panadería", kw: "croissant", image: U("photo-1555507036-ab1f4038808a") },
      { name: "Cheesecake de frutos rojos", price: 75, category: "Panadería", featured: true, kw: "cheesecake", image: U("photo-1533134242443-d4fd215305ad") },
      { name: "Sandwich de jamón y queso", price: 70, category: "Snacks", kw: "sandwich", image: U("photo-1528735602780-2552fd46c7af") },
    ],
  },

  bakery: {
    storeName: "Dulce Encanto",
    tagline: "Pasteles, cupcakes y postres por encargo",
    templateKey: "bakery",
    categories: ["Pasteles", "Cupcakes", "Galletas", "Por encargo"],
    products: [
      { name: "Pastel de chocolate", price: 320, category: "Pasteles", featured: true, kw: "chocolate cake", image: U("photo-1578985545062-69928b1d9587"), variants: [{ name: "12 personas" }, { name: "20 personas", price: 480 }] },
      { name: "Cupcakes surtidos (6)", price: 180, category: "Cupcakes", featured: true, kw: "cupcakes", image: U("photo-1599785209707-a456fc1337bb") },
      { name: "Red velvet", price: 360, category: "Pasteles", kw: "red velvet cake", image: U("photo-1586985289688-ca3cf47d3e6e") },
      { name: "Galletas decoradas (12)", price: 220, category: "Galletas", kw: "decorated cookies", image: U("photo-1499636136210-6f4ee915583e") },
      { name: "Cheesecake entero", price: 290, category: "Pasteles", kw: "cheesecake", image: U("photo-1533134242443-d4fd215305ad") },
      { name: "Pastel personalizado", price: 550, category: "Por encargo", featured: true, kw: "custom cake", image: U("photo-1535141192574-5d4897c12636") },
    ],
  },

  grocery: {
    storeName: "Súper La Esquina",
    tagline: "Abarrotes, carnes y entrega a domicilio",
    templateKey: "local-market",
    categories: ["Carnes", "Frutas y verduras", "Despensa", "Bebidas"],
    products: [
      { name: "Arrachera marinada (1 kg)", price: 280, category: "Carnes", featured: true, kw: "steak,meat", image: U("photo-1607623814075-e51df1bdc82f") },
      { name: "Pechuga de pollo (1 kg)", price: 120, category: "Carnes", kw: "chicken,raw", image: U("photo-1604503468506-a8da13d82791") },
      { name: "Canasta de frutas", price: 150, category: "Frutas y verduras", featured: true, kw: "fruit basket", image: U("photo-1610832958506-aa56368176cf") },
      { name: "Verduras surtidas", price: 95, category: "Frutas y verduras", kw: "vegetables", image: U("photo-1542838132-92c53300491e") },
      { name: "Aceite de oliva 500ml", price: 130, category: "Despensa", kw: "olive oil", image: U("photo-1474979266404-7eaacbcd87c5") },
      { name: "Refrescos (pack 6)", price: 110, category: "Bebidas", kw: "soda,drinks", image: U("photo-1622483767028-3f66f32aef97") },
    ],
  },

  fashion: {
    storeName: "Boutique Luna",
    tagline: "Moda femenina con estilo. Envíos a todo el país",
    templateKey: "boutique-pro",
    categories: ["Vestidos", "Blusas", "Accesorios", "Calzado"],
    products: [
      { name: "Vestido floral midi", price: 599, compareAtPrice: 799, category: "Vestidos", featured: true, kw: "floral dress", image: U("photo-1572804013309-59a88b7e92f1"), variants: [{ name: "S" }, { name: "M" }, { name: "L" }] },
      { name: "Blusa de lino", price: 349, category: "Blusas", kw: "linen blouse", image: U("photo-1564257631407-4deb1f99d992"), variants: [{ name: "Blanco" }, { name: "Beige" }] },
      { name: "Bolso de mano", price: 459, category: "Accesorios", featured: true, kw: "handbag", image: U("photo-1584917865442-de89df76afd3") },
      { name: "Sandalias de piel", price: 529, category: "Calzado", kw: "sandals", image: U("photo-1543163521-1bf539c55dd2") },
      { name: "Aretes dorados", price: 199, category: "Accesorios", kw: "earrings", image: U("photo-1535632066927-ab7c9ab60908") },
      { name: "Jeans tiro alto", price: 649, category: "Vestidos", kw: "jeans", image: U("photo-1541099649105-f69ad21f3246") },
    ],
  },

  jewelry: {
    storeName: "Aurum Joyería",
    tagline: "Piezas únicas hechas a mano",
    templateKey: "premium-dark",
    categories: ["Anillos", "Collares", "Aretes", "Pulseras"],
    products: [
      { name: "Anillo de plata 925", price: 890, category: "Anillos", featured: true, kw: "silver ring", image: U("photo-1605100804763-247f67b3557e"), variants: [{ name: "Talla 6" }, { name: "Talla 7" }, { name: "Talla 8" }] },
      { name: "Collar minimalista", price: 650, category: "Collares", featured: true, kw: "necklace", image: U("photo-1599643478518-a784e5dc4c8f") },
      { name: "Aretes de perla", price: 540, category: "Aretes", kw: "pearl earrings", image: U("photo-1535632066927-ab7c9ab60908") },
      { name: "Pulsera de oro laminado", price: 720, category: "Pulseras", kw: "gold bracelet", image: U("photo-1611591437281-460bfbe1220a") },
      { name: "Anillo con piedra", price: 1290, category: "Anillos", kw: "gemstone ring", image: U("photo-1603561591411-07134e71a2a9") },
      { name: "Dije personalizado", price: 480, category: "Collares", kw: "pendant", image: U("photo-1515562141207-7a88fb7ce338") },
    ],
  },

  electronics: {
    storeName: "TecnoZone",
    tagline: "Gadgets y accesorios con garantía",
    templateKey: "minimal-store",
    categories: ["Audio", "Accesorios", "Smart Home", "Gaming"],
    products: [
      { name: "Audífonos inalámbricos", price: 1299, compareAtPrice: 1599, category: "Audio", featured: true, kw: "wireless headphones", image: U("photo-1505740420928-5e560c06d30e") },
      { name: "Bocina Bluetooth", price: 899, category: "Audio", featured: true, kw: "bluetooth speaker", image: U("photo-1608043152269-423dbba4e7e1") },
      { name: "Cargador rápido USB-C", price: 349, category: "Accesorios", kw: "usb charger", image: U("photo-1583863788434-e58a36330cf0") },
      { name: "Smartwatch", price: 1890, category: "Accesorios", featured: true, kw: "smartwatch", image: U("photo-1546868871-7041f2a55e12") },
      { name: "Foco inteligente", price: 259, category: "Smart Home", kw: "smart bulb", image: U("photo-1558002038-1055907df827") },
      { name: "Teclado mecánico", price: 1150, category: "Gaming", kw: "mechanical keyboard", image: U("photo-1587829741301-dc798b83add3") },
    ],
  },

  beautyShop: {
    storeName: "Glow Beauty",
    tagline: "Skincare y maquillaje que amarás",
    templateKey: "beauty-studio",
    categories: ["Skincare", "Maquillaje", "Cabello", "Sets"],
    products: [
      { name: "Sérum de vitamina C", price: 420, category: "Skincare", featured: true, kw: "serum,skincare", image: U("photo-1620916566398-39f1143ab7be") },
      { name: "Crema hidratante", price: 380, category: "Skincare", kw: "moisturizer,cosmetics", image: U("photo-1556228720-195a672e8a03") },
      { name: "Paleta de sombras", price: 540, category: "Maquillaje", featured: true, kw: "eyeshadow palette", image: U("photo-1583241800698-9c2e0b0a3d97") },
      { name: "Labial mate", price: 220, category: "Maquillaje", kw: "lipstick", image: U("photo-1586495777744-4413f21062fa") },
      { name: "Mascarilla capilar", price: 310, category: "Cabello", kw: "hair mask", image: U("photo-1522338242992-e1a54906a8da") },
      { name: "Set de cuidado facial", price: 890, category: "Sets", featured: true, kw: "skincare set", image: U("photo-1571781926291-c477ebfd024b") },
    ],
  },

  flowers: {
    storeName: "Pétalos & Co.",
    tagline: "Arreglos florales para cada ocasión",
    templateKey: "boutique-pro",
    categories: ["Ramos", "Arreglos", "Plantas", "Regalo"],
    products: [
      { name: "Ramo de rosas (docena)", price: 650, category: "Ramos", featured: true, kw: "rose bouquet", image: U("photo-1561181286-d3fee7d55364") },
      { name: "Arreglo en caja", price: 890, category: "Arreglos", featured: true, kw: "flower box", image: U("photo-1519378058457-4c29a0a2efac") },
      { name: "Girasoles", price: 480, category: "Ramos", kw: "sunflowers", image: U("photo-1597848212624-a19eb35e2651") },
      { name: "Planta suculenta", price: 250, category: "Plantas", kw: "succulent", image: U("photo-1485955900006-10f4d324d411") },
      { name: "Orquídea en maceta", price: 720, category: "Plantas", kw: "orchid", image: U("photo-1567748157439-651aca2ff064") },
      { name: "Caja regalo con flores", price: 990, category: "Regalo", featured: true, kw: "gift flowers", image: U("photo-1606041008023-472dfb5e530f") },
    ],
  },

  servicesAgency: {
    storeName: "Estudio Creativo",
    tagline: "Diseño, branding y marketing para tu negocio",
    templateKey: "digital-services",
    categories: ["Diseño", "Marketing", "Web", "Paquetes"],
    products: [
      { name: "Logo profesional", price: 2500, category: "Diseño", featured: true, kw: "logo design", image: U("photo-1626785774573-4b799315345d") },
      { name: "Identidad de marca", price: 6500, category: "Diseño", featured: true, kw: "branding", image: U("photo-1634942537034-2531766767d1") },
      { name: "Gestión de redes (mensual)", price: 4500, category: "Marketing", kw: "social media marketing", image: U("photo-1611926653458-09294b3142bf") },
      { name: "Landing page", price: 8000, category: "Web", featured: true, kw: "web design", image: U("photo-1467232004584-a241de8bcf5d") },
      { name: "Sesión de fotos de producto", price: 3500, category: "Marketing", kw: "product photography", image: U("photo-1542038784456-1ea8e935640e") },
      { name: "Paquete emprendedor", price: 12000, category: "Paquetes", kw: "business package", image: U("photo-1552664730-d307ca884978") },
    ],
  },

  salon: {
    storeName: "Studio Bella",
    tagline: "Belleza y cuidado personal. Reserva por WhatsApp",
    templateKey: "beauty-studio",
    categories: ["Cabello", "Uñas", "Facial", "Paquetes"],
    products: [
      { name: "Corte y peinado", price: 350, category: "Cabello", featured: true, kw: "haircut,salon", image: U("photo-1560066984-138dadb4c035") },
      { name: "Tinte completo", price: 850, category: "Cabello", kw: "hair color,salon", image: U("photo-1522337660859-02fbefca4702") },
      { name: "Manicure y pedicure", price: 420, category: "Uñas", featured: true, kw: "manicure", image: U("photo-1604654894610-df63bc536371") },
      { name: "Uñas acrílicas", price: 550, category: "Uñas", kw: "acrylic nails", image: U("photo-1632345031435-8727f6897d53") },
      { name: "Facial hidratante", price: 600, category: "Facial", kw: "facial treatment", image: U("photo-1570172619644-dfd03ed5d881") },
      { name: "Paquete novia", price: 2500, category: "Paquetes", featured: true, kw: "bridal makeup", image: U("photo-1457972729786-0411a3b2b626") },
    ],
  },

  fitness: {
    storeName: "Pulse Studio",
    tagline: "Clases y membresías. Entrena con nosotros",
    templateKey: "bold-modern",
    categories: ["Membresías", "Clases", "Personal", "Nutrición"],
    products: [
      { name: "Membresía mensual", price: 650, category: "Membresías", featured: true, kw: "gym", image: U("photo-1534438327276-14e5300c3a48") },
      { name: "Clase de spinning", price: 120, category: "Clases", kw: "spinning,cycling class", image: U("photo-1518611012118-696072aa579a") },
      { name: "Yoga (paquete 8 clases)", price: 800, category: "Clases", featured: true, kw: "yoga class", image: U("photo-1599901860904-17e6ed7083a0") },
      { name: "Entrenador personal (sesión)", price: 450, category: "Personal", kw: "personal trainer", image: U("photo-1571019613454-1cb2f99b2d8b") },
      { name: "Plan nutricional", price: 900, category: "Nutrición", kw: "nutrition plan", image: U("photo-1490645935967-10de6ba17061") },
      { name: "Membresía anual", price: 6000, category: "Membresías", featured: true, kw: "fitness", image: U("photo-1517836357463-d25dfeac3438") },
    ],
  },

  photography: {
    storeName: "Lente & Luz",
    tagline: "Fotografía profesional para tus momentos",
    templateKey: "premium-dark",
    categories: ["Sesiones", "Eventos", "Producto", "Paquetes"],
    products: [
      { name: "Sesión retrato", price: 1800, category: "Sesiones", featured: true, kw: "portrait photography", image: U("photo-1554048612-b6a482bc67e5") },
      { name: "Sesión familiar", price: 2400, category: "Sesiones", kw: "family photoshoot", image: U("photo-1606216794074-735e91aa2c92") },
      { name: "Cobertura de boda", price: 12000, category: "Eventos", featured: true, kw: "wedding photography", image: U("photo-1519741497674-611481863552") },
      { name: "Fotos de producto (10)", price: 3000, category: "Producto", kw: "product photography", image: U("photo-1542038784456-1ea8e935640e") },
      { name: "Sesión de embarazo", price: 2200, category: "Sesiones", kw: "maternity photo", image: U("photo-1519689680058-324335c77eba") },
      { name: "Paquete XV años", price: 9500, category: "Paquetes", featured: true, kw: "photography", image: U("photo-1452587925148-ce544e77e70d") },
    ],
  },

  generalShop: {
    storeName: "Mi Tienda Online",
    tagline: "Productos seleccionados con envío a tu casa",
    templateKey: "minimal-store",
    categories: ["Destacados", "Hogar", "Regalos", "Novedades"],
    products: [
      { name: "Vela aromática", price: 180, category: "Hogar", featured: true, kw: "scented candle", image: U("photo-1602874801007-aa6e1f6c1c9b") },
      { name: "Taza de cerámica", price: 150, category: "Hogar", kw: "ceramic mug", image: U("photo-1514228742587-6b1558fcca3d") },
      { name: "Termo de acero", price: 320, category: "Destacados", featured: true, kw: "water bottle", image: U("photo-1602143407151-7111542de6e8") },
      { name: "Set de libretas", price: 240, category: "Regalos", kw: "notebook", image: U("photo-1531346878377-a5be20888e57") },
      { name: "Mochila urbana", price: 590, category: "Novedades", featured: true, kw: "backpack", image: U("photo-1553062407-98eeb64c6a62") },
      { name: "Lentes de sol", price: 410, category: "Novedades", kw: "sunglasses", image: U("photo-1572635196237-14b3f281503f") },
    ],
  },
};

/* ───────────────────────── INDUSTRY → ARCHETYPE ───────────────────────── */

const MAP: Record<string, keyof typeof ARCHETYPES> = {
  // F&B
  restaurantes: "restaurant",
  cafeterias: "cafe",
  "comida-casera": "restaurant",
  reposteria: "bakery",
  catering: "restaurant",
  abarrotes: "grocery",
  mayoreo: "grocery",
  bares: "cafe",
  "hotel-restaurante": "restaurant",
  "food-truck": "restaurant",
  heladeria: "cafe",
  jugos: "cafe",
  // E-commerce
  "tienda-online": "generalShop",
  "moda-y-ropa": "fashion",
  "joyeria-y-accesorios": "jewelry",
  electronica: "electronics",
  "productos-digitales": "electronics",
  "farmacia-y-salud": "beautyShop",
  belleza: "salon",
  mascotas: "generalShop",
  "tienda-popup": "generalShop",
  "personal-shopping": "fashion",
  libreria: "generalShop",
  jugueteria: "generalShop",
  deportes: "generalShop",
  "hogar-decoracion": "generalShop",
  floreria: "flowers",
  // Servicios
  barberia: "salon",
  "servicios-profesionales": "servicesAgency",
  educacion: "servicesAgency",
  comunidad: "generalShop",
  lavanderia: "servicesAgency",
  hoteles: "servicesAgency",
  imprenta: "servicesAgency",
  renta: "servicesAgency",
  tours: "photography",
  ticketing: "servicesAgency",
  fotografia: "photography",
  eventos: "photography",
  gimnasio: "fitness",
  tatuajes: "salon",
  reparaciones: "servicesAgency",
};

function archetypeForGroup(group: string): keyof typeof ARCHETYPES {
  if (group === "F&B") return "restaurant";
  if (group === "Servicios") return "servicesAgency";
  return "generalShop";
}

export interface DemoStore extends DemoArchetype {
  slug: string;
  industryName: string;
  accent: string;
  emoji: string;
}

/** Build a demo storefront for an industry slug (or null if unknown). */
export function getDemoStore(industrySlug: string): DemoStore | null {
  const industry = getIndustry(industrySlug);
  if (!industry) return null;
  const key = MAP[industrySlug] ?? archetypeForGroup(industry.group);
  const arche = ARCHETYPES[key];
  return {
    ...arche,
    slug: industrySlug,
    industryName: industry.name,
    accent: industry.accent,
    emoji: industry.emoji,
    // prefer the industry's own template if it has a distinctive one
    templateKey: arche.templateKey,
  };
}

/** All industries that have a demo (i.e. all of them). */
export function allDemoSlugs(): string[] {
  return INDUSTRIES.map((i) => i.slug);
}

/** Convert a demo store into the same DTO shape the real storefront consumes. */
export function demoToStorefrontDTO(demo: DemoStore) {
  const catIndex = new Map(demo.categories.map((c, i) => [c, `democat-${i}`]));
  return {
    id: `demo-${demo.slug}`,
    name: `${demo.storeName}`,
    slug: demo.slug,
    description: demo.tagline,
    logoUrl: null as string | null,
    bannerUrl: null as string | null,
    currency: "MXN",
    locale: "es",
    primaryColor: demo.accent,
    templateKey: demo.templateKey,
    whatsappPhone: null as string | null,
    showBranding: true,
    verified: true,
    instagramUrl: null as string | null,
    instagramFollowers: 5200,
    facebookFollowers: 6200,
    tiktokFollowers: 12100,
    ratingAvg: 4.9,
    ratingCount: 1291,
    addressText: "México 12345",
    hoursText: "Abierto · 9:00–18:00",
    promo: {
      title: "🎉 2x1 esta semana",
      text: `Pide en ${demo.storeName} y aprovecha nuestra promo de bienvenida.`,
      ctaLabel: "Ver productos",
      ctaUrl: null as string | null,
      imageUrl: null as string | null,
    },
    deliveryMethods: [] as unknown[],
    paymentMethods: [] as unknown[],
    categories: demo.categories.map((c) => ({ id: catIndex.get(c)!, name: c })),
    products: demo.products.map((p, i) => ({
      id: `demoprod-${i}`,
      name: p.name,
      description: null as string | null,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      categoryId: catIndex.get(p.category) ?? null,
      isFeatured: p.featured ?? false,
      image: p.image,
      images: [p.image],
      variants: (p.variants ?? []).map((v, vi) => ({
        id: `demovar-${i}-${vi}`,
        name: v.name,
        price: v.price ?? null,
      })),
      extras: [] as { name: string; price: number }[],
    })),
  };
}
