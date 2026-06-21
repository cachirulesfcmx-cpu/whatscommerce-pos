// Catálogo de industrias para landings dedicadas (estilo take.app).
export type IndustryGroup = "F&B" | "E-commerce" | "Servicios";

export interface Industry {
  slug: string;
  group: IndustryGroup;
  name: string;
  emoji: string;
  headline: string;
  subcopy: string;
  bullets: string[];
  demoSlug: string; // tienda demo más cercana
  accent: string;
  /** Opcional: URL de imagen o video hero (ej. "/media/bakery.mp4"). */
  heroImage?: string;
  heroVideo?: string;
}

const FB = "tacos-el-guero";
const SHOP = "boutique-luna";
const SERVICE = "estudio-creativo";

export const INDUSTRIES: Industry[] = [
  // ---- F&B ----
  { slug: "restaurantes", group: "F&B", name: "Restaurantes", emoji: "🍽️", accent: "#ef4444",
    headline: "Recibe pedidos de tu restaurante sin comisiones", subcopy: "Tu menú online, pedidos directo a tu WhatsApp y un POS para gestionar todo.",
    bullets: ["Menú con fotos y categorías", "Pedidos para llevar o a domicilio", "Ticket automático por WhatsApp"], demoSlug: FB },
  { slug: "cafeterias", group: "F&B", name: "Cafeterías", emoji: "☕", accent: "#b45309",
    headline: "Tu cafetería, lista para pedidos en línea", subcopy: "Muestra tu carta, recibe pedidos y fideliza clientes desde WhatsApp.",
    bullets: ["Carta digital atractiva", "Pedidos rápidos", "Promos y cupones"], demoSlug: FB },
  { slug: "comida-casera", group: "F&B", name: "Comida casera", emoji: "🥘", accent: "#f59e0b",
    headline: "Vende tu comida casera por WhatsApp", subcopy: "Sin local, sin complicaciones. Publica tu menú y recibe pedidos hoy.",
    bullets: ["Catálogo simple", "Pagos manuales o tarjeta", "Sin comisiones por venta"], demoSlug: FB },
  { slug: "reposteria", group: "F&B", name: "Repostería", emoji: "🧁", accent: "#db2777",
    headline: "Que tus clientes disfruten lo recién horneado", subcopy: "Muestra tus postres y recibe pedidos especiales sin chats interminables.",
    bullets: ["Productos con variantes", "Pedidos personalizados", "Agenda de entregas"], demoSlug: FB },
  { slug: "catering", group: "F&B", name: "Catering", emoji: "🍱", accent: "#16a34a",
    headline: "Catering y suscripciones de comida sin fricción", subcopy: "Paquetes, suscripciones y pedidos recurrentes, todo por WhatsApp.",
    bullets: ["Paquetes y combos", "Pedidos por evento", "Cobros flexibles"], demoSlug: FB },
  { slug: "abarrotes", group: "F&B", name: "Abarrotes y carnicería", emoji: "🥩", accent: "#dc2626",
    headline: "Tu tienda de abarrotes, ahora en línea", subcopy: "Catálogo con inventario y pedidos a domicilio por WhatsApp.",
    bullets: ["Control de inventario", "Pedidos a domicilio", "Listas de productos"], demoSlug: FB },
  { slug: "mayoreo", group: "F&B", name: "Mayoreo / B2B", emoji: "📦", accent: "#f59e0b",
    headline: "Catálogo mayorista para tus clientes B2B", subcopy: "Precios por volumen, pedidos grandes y reposición fácil.",
    bullets: ["Catálogo mayorista", "Pedidos por volumen", "Clientes recurrentes"], demoSlug: SHOP },

  // ---- E-commerce ----
  { slug: "tienda-online", group: "E-commerce", name: "Tienda online", emoji: "🛍️", accent: "#16a34a",
    headline: "Tu tienda online lista para vender hoy", subcopy: "Catálogo, carrito y checkout con pedidos directo a tu WhatsApp.",
    bullets: ["Carrito y checkout", "Pagos con tarjeta", "Tu dominio propio"], demoSlug: SHOP },
  { slug: "moda-y-ropa", group: "E-commerce", name: "Moda y ropa", emoji: "👗", accent: "#db2777",
    headline: "Vende tu ropa con una boutique online", subcopy: "Tallas, colores y fotos que enamoran. Pedidos por WhatsApp.",
    bullets: ["Variantes (talla/color)", "Galería de producto", "Cupones y promos"], demoSlug: SHOP },
  { slug: "joyeria-y-accesorios", group: "E-commerce", name: "Joyería y accesorios", emoji: "💍", accent: "#a855f7",
    headline: "Luce tus piezas con una tienda elegante", subcopy: "Catálogo premium, pedidos personalizados y atención por WhatsApp.",
    bullets: ["Plantillas premium", "Productos destacados", "Pedidos a medida"], demoSlug: SHOP },
  { slug: "electronica", group: "E-commerce", name: "Electrónica", emoji: "📱", accent: "#0ea5e9",
    headline: "Vende electrónica con catálogo profesional", subcopy: "Fichas claras, inventario y cobros con tarjeta.",
    bullets: ["Inventario por modelo", "Pagos con tarjeta", "Reportes de ventas"], demoSlug: SHOP },
  { slug: "productos-digitales", group: "E-commerce", name: "Productos digitales", emoji: "💻", accent: "#0ea5e9",
    headline: "Vende productos y servicios digitales", subcopy: "Entrega ágil, pagos en línea y gestión simple.",
    bullets: ["Productos digitales", "Pagos con tarjeta", "Sin inventario físico"], demoSlug: SERVICE },
  { slug: "farmacia-y-salud", group: "E-commerce", name: "Farmacia y salud", emoji: "💊", accent: "#16a34a",
    headline: "Tu farmacia con pedidos a domicilio", subcopy: "Catálogo, inventario y pedidos por WhatsApp con entrega local.",
    bullets: ["Catálogo con stock", "Entrega a domicilio", "Atención por WhatsApp"], demoSlug: SHOP },

  // ---- Servicios ----
  { slug: "belleza", group: "Servicios", name: "Salón de belleza", emoji: "💅", accent: "#a855f7",
    headline: "Agenda y vende servicios de belleza", subcopy: "Muestra tus servicios y recibe reservas y pedidos por WhatsApp.",
    bullets: ["Catálogo de servicios", "Reservas por WhatsApp", "Promos y paquetes"], demoSlug: SERVICE },
  { slug: "barberia", group: "Servicios", name: "Barbería", emoji: "💈", accent: "#0ea5e9",
    headline: "Tu barbería con reservas en línea", subcopy: "Servicios, precios y citas por WhatsApp, sin llamadas.",
    bullets: ["Lista de servicios", "Citas por WhatsApp", "Clientes frecuentes"], demoSlug: SERVICE },
  { slug: "servicios-profesionales", group: "Servicios", name: "Servicios profesionales", emoji: "🧑‍💼", accent: "#0ea5e9",
    headline: "Vende tus servicios profesionales", subcopy: "Paquetes claros, cobros y seguimiento de clientes.",
    bullets: ["Paquetes de servicio", "Cobros con tarjeta", "CRM de clientes"], demoSlug: SERVICE },
  { slug: "mascotas", group: "Servicios", name: "Mascotas y grooming", emoji: "🐾", accent: "#16a34a",
    headline: "Productos y servicios para mascotas", subcopy: "Catálogo, citas de grooming y pedidos por WhatsApp.",
    bullets: ["Productos y servicios", "Reservas", "Recordatorios"], demoSlug: SERVICE },
  { slug: "educacion", group: "Servicios", name: "Educación", emoji: "📚", accent: "#f59e0b",
    headline: "Vende cursos y clases en línea", subcopy: "Inscripciones, paquetes y pagos por WhatsApp.",
    bullets: ["Catálogo de cursos", "Inscripción simple", "Pagos en línea"], demoSlug: SERVICE },

  // ---- F&B (más) ----
  { slug: "bares", group: "F&B", name: "Bares y cantinas", emoji: "🍻", accent: "#f59e0b",
    headline: "Tu bar con carta y pedidos en línea", subcopy: "Muestra tu menú de bebidas y botanas y recibe pedidos por WhatsApp.",
    bullets: ["Carta de bebidas", "Pedidos en mesa o para llevar", "Promos de happy hour"], demoSlug: FB },
  { slug: "hotel-restaurante", group: "F&B", name: "Restaurante de hotel", emoji: "🏨", accent: "#0ea5e9",
    headline: "Room service y restaurante, en un link", subcopy: "Tus huéspedes ordenan desde su celular, directo a tu WhatsApp.",
    bullets: ["Menú por área", "Pedidos a habitación", "Sin apps que instalar"], demoSlug: FB },

  // ---- E-commerce (más) ----
  { slug: "tienda-popup", group: "E-commerce", name: "Pop-up y eventos", emoji: "🎪", accent: "#db2777",
    headline: "Vende en tu pop-up o evento sin fricción", subcopy: "Catálogo temporal, pedidos y cobros rápidos por WhatsApp.",
    bullets: ["Tienda temporal", "Cobros rápidos", "Listo en minutos"], demoSlug: SHOP },
  { slug: "personal-shopping", group: "E-commerce", name: "Personal shopping", emoji: "🛒", accent: "#a855f7",
    headline: "Ofrece personal shopping por WhatsApp", subcopy: "Comparte selecciones, cobra y coordina entregas en un solo lugar.",
    bullets: ["Catálogos a medida", "Pedidos personalizados", "Cobro con tarjeta"], demoSlug: SHOP },
  { slug: "comunidad", group: "E-commerce", name: "Comunidad y causas", emoji: "🤝", accent: "#16a34a",
    headline: "Recauda y vende para tu comunidad", subcopy: "Donaciones, productos y eventos gestionados por WhatsApp.",
    bullets: ["Productos y donativos", "Eventos", "Sin comisiones por venta"], demoSlug: SHOP },

  // ---- Servicios (más) ----
  { slug: "lavanderia", group: "Servicios", name: "Lavandería", emoji: "🧺", accent: "#0ea5e9",
    headline: "Recibe pedidos de lavandería en línea", subcopy: "Servicios, recolección y entrega coordinados por WhatsApp.",
    bullets: ["Lista de servicios", "Recolección a domicilio", "Estatus del pedido"], demoSlug: SERVICE },
  { slug: "hoteles", group: "Servicios", name: "Hospedaje", emoji: "🛎️", accent: "#7c3aed",
    headline: "Reservas y servicios de hospedaje", subcopy: "Muestra tus habitaciones y servicios; reserva por WhatsApp.",
    bullets: ["Catálogo de habitaciones", "Reservas", "Servicios extra"], demoSlug: SERVICE },
  { slug: "imprenta", group: "Servicios", name: "Imprenta", emoji: "🖨️", accent: "#ef4444",
    headline: "Cotiza e imprime sin chats interminables", subcopy: "Catálogo de productos de impresión y pedidos por WhatsApp.",
    bullets: ["Productos personalizables", "Cotización rápida", "Archivos del cliente"], demoSlug: SERVICE },
  { slug: "renta", group: "Servicios", name: "Renta de equipo", emoji: "📦", accent: "#f59e0b",
    headline: "Renta tu equipo o mobiliario en línea", subcopy: "Catálogo, disponibilidad y reservas por WhatsApp.",
    bullets: ["Catálogo de renta", "Reservas por fecha", "Depósitos y pagos"], demoSlug: SERVICE },
  { slug: "tours", group: "Servicios", name: "Tours y viajes", emoji: "🧳", accent: "#0ea5e9",
    headline: "Vende tours y experiencias", subcopy: "Paquetes, cupos y reservas gestionados por WhatsApp.",
    bullets: ["Paquetes y fechas", "Reservas", "Pagos en línea"], demoSlug: SERVICE },
  { slug: "ticketing", group: "Servicios", name: "Boletos y eventos", emoji: "🎟️", accent: "#a855f7",
    headline: "Vende boletos para tus eventos", subcopy: "Tipos de boleto, cupos y confirmación por WhatsApp.",
    bullets: ["Tipos de boleto", "Control de cupo", "Confirmación al instante"], demoSlug: SERVICE },

  // ---- F&B (más) ----
  { slug: "food-truck", group: "F&B", name: "Food truck", emoji: "🚚", accent: "#ef4444",
    headline: "Tu food truck con pedidos anticipados", subcopy: "Publica tu menú y ubicación; recibe pedidos para recoger sin filas.",
    bullets: ["Menú del día", "Pedidos para recoger", "Ubicación del día"], demoSlug: FB },
  { slug: "heladeria", group: "F&B", name: "Heladería", emoji: "🍦", accent: "#0ea5e9",
    headline: "Vende helados y postres fríos en línea", subcopy: "Sabores, combos y entregas rápidas por WhatsApp.",
    bullets: ["Sabores y tamaños", "Combos", "Entrega local"], demoSlug: FB },
  { slug: "jugos", group: "F&B", name: "Jugos y smoothies", emoji: "🥤", accent: "#22c55e",
    headline: "Jugos y smoothies a un mensaje", subcopy: "Menú saludable, suscripciones y pedidos por WhatsApp.",
    bullets: ["Menú saludable", "Suscripción semanal", "Entrega a domicilio"], demoSlug: FB },

  // ---- E-commerce (más) ----
  { slug: "libreria", group: "E-commerce", name: "Librería y papelería", emoji: "📒", accent: "#f59e0b",
    headline: "Vende libros y papelería en línea", subcopy: "Catálogo organizado, inventario y pedidos por WhatsApp.",
    bullets: ["Catálogo por categoría", "Inventario", "Pedidos escolares"], demoSlug: SHOP },
  { slug: "jugueteria", group: "E-commerce", name: "Juguetería", emoji: "🧸", accent: "#db2777",
    headline: "Tu juguetería con tienda online", subcopy: "Productos por edad, ofertas y pedidos por WhatsApp.",
    bullets: ["Filtros por edad", "Ofertas", "Envíos"], demoSlug: SHOP },
  { slug: "deportes", group: "E-commerce", name: "Deportes y fitness", emoji: "🏋️", accent: "#0ea5e9",
    headline: "Vende artículos deportivos", subcopy: "Tallas, marcas e inventario, con pedidos por WhatsApp.",
    bullets: ["Variantes por talla", "Inventario", "Pagos con tarjeta"], demoSlug: SHOP },
  { slug: "hogar-decoracion", group: "E-commerce", name: "Hogar y decoración", emoji: "🛋️", accent: "#7c3aed",
    headline: "Decora hogares con tu tienda online", subcopy: "Catálogo visual, variantes y pedidos por WhatsApp.",
    bullets: ["Galería atractiva", "Variantes", "Envío o recolección"], demoSlug: SHOP },
  { slug: "floreria", group: "E-commerce", name: "Florería", emoji: "💐", accent: "#ec4899",
    headline: "Vende arreglos florales en línea", subcopy: "Catálogo, pedidos personalizados y entregas el mismo día.",
    bullets: ["Arreglos a medida", "Mensaje de regalo", "Entrega programada"], demoSlug: SHOP },

  // ---- Servicios (más) ----
  { slug: "fotografia", group: "Servicios", name: "Fotografía", emoji: "📷", accent: "#0ea5e9",
    headline: "Vende sesiones y paquetes de foto", subcopy: "Paquetes, reservas y anticipos por WhatsApp.",
    bullets: ["Paquetes de sesión", "Reservas", "Anticipos en línea"], demoSlug: SERVICE },
  { slug: "eventos", group: "Servicios", name: "Eventos y fiestas", emoji: "🎉", accent: "#a855f7",
    headline: "Organiza eventos y vende paquetes", subcopy: "Paquetes, cotizaciones y reservas por WhatsApp.",
    bullets: ["Paquetes de evento", "Cotización", "Reservas con anticipo"], demoSlug: SERVICE },
  { slug: "gimnasio", group: "Servicios", name: "Gimnasio y fitness", emoji: "💪", accent: "#16a34a",
    headline: "Vende membresías y clases", subcopy: "Planes, clases y cobros recurrentes por WhatsApp.",
    bullets: ["Membresías", "Clases y horarios", "Cobros recurrentes"], demoSlug: SERVICE },
  { slug: "tatuajes", group: "Servicios", name: "Estudio de tatuajes", emoji: "🖋️", accent: "#111827",
    headline: "Agenda citas y diseños de tatuaje", subcopy: "Portafolio, cotización y reservas por WhatsApp.",
    bullets: ["Portafolio", "Cotización por diseño", "Reserva con anticipo"], demoSlug: SERVICE },
  { slug: "reparaciones", group: "Servicios", name: "Reparaciones y técnico", emoji: "🔧", accent: "#f59e0b",
    headline: "Recibe solicitudes de reparación", subcopy: "Servicios, diagnóstico y seguimiento por WhatsApp.",
    bullets: ["Lista de servicios", "Diagnóstico", "Estatus de la reparación"], demoSlug: SERVICE },
];

export const INDUSTRY_GROUPS: IndustryGroup[] = ["F&B", "E-commerce", "Servicios"];

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
