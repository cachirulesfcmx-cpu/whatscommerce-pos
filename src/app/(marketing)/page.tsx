import Link from "next/link";
import {
  ShoppingBag, MessageCircle, ArrowRight, Check, Star,
  Utensils, Coffee, Cake, Shirt, Sparkles, Scissors, Store, Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIG, PLAN_ORDER } from "@/lib/plans/plans";
import { formatMoney } from "@/lib/utils";
import { INDUSTRIES, INDUSTRY_GROUPS } from "@/lib/industries";

export const metadata = {
  title: "WhatsCommerce POS — Vende por WhatsApp con catálogo y POS profesional",
  description:
    "Crea tu tienda online, recibe pedidos por WhatsApp y gestiona tu negocio con un POS profesional. Sin comisiones por venta. Empieza gratis.",
};

const USE_CASES = [
  { icon: Utensils, label: "Restaurantes" },
  { icon: Coffee, label: "Cafeterías" },
  { icon: Cake, label: "Repostería" },
  { icon: Shirt, label: "Boutiques" },
  { icon: Sparkles, label: "Belleza" },
  { icon: Scissors, label: "Barberías" },
  { icon: Store, label: "Tiendas locales" },
  { icon: Boxes, label: "Mayoristas" },
];

const STEPS = [
  { n: "1", title: "Crea tu tienda", desc: "Regístrate gratis y configura tu negocio en minutos con un asistente guiado." },
  { n: "2", title: "Agrega productos", desc: "Sube fotos, precios, variantes y categorías. Elige una de 8 plantillas." },
  { n: "3", title: "Recibe pedidos", desc: "Comparte tu link. El cliente compra y el pedido llega a tu WhatsApp al instante." },
];

const FEATURES = [
  { title: "Pedidos por WhatsApp", desc: "Cada pedido llega con un ticket profesional listo para confirmar." },
  { title: "POS y gestión", desc: "Cobra en mostrador, controla inventario y administra pedidos como un pro." },
  { title: "Pagos flexibles", desc: "Efectivo, transferencia, contra entrega o tarjeta con Stripe." },
  { title: "Clientes y CRM", desc: "Historial, segmentos y contacto directo por WhatsApp." },
  { title: "Reportes claros", desc: "Ventas, ticket promedio, conversión y productos estrella." },
  { title: "Tu dominio y marca", desc: "Dominio propio, sin comisiones por venta, tu identidad." },
];

const FAQ = [
  { q: "¿Necesito la API de WhatsApp?", a: "No. Funciona con enlaces wa.me y un ticket pre-llenado. Si luego quieres automatizar con la Cloud API, ya está preparado." },
  { q: "¿Cobran comisión por venta?", a: "No. Pagas tu plan y te quedas con el 100% de tus ventas." },
  { q: "¿Puedo cobrar con tarjeta?", a: "Sí, con el plan Pro integras Stripe. También aceptas efectivo, transferencia y contra entrega." },
  { q: "¿Puedo usar mi dominio?", a: "Sí, en Pro conectas tu dominio propio. En el plan gratuito tienes un subdominio incluido." },
];

const PLAN_FEATURES: Record<string, string[]> = {
  BASIC: ["1 tienda", "20 productos", "50 pedidos/mes", "Pedidos por WhatsApp", "Pagos manuales", "Subdominio gratis"],
  PRO: ["Productos y pedidos ilimitados", "Pagos con tarjeta", "Dominio propio", "Sin marca de la plataforma", "Cupones, inventario y CRM", "Reportes avanzados"],
  ENTERPRISE: ["Todo lo de Pro", "Multi-tienda y sucursales", "API privada", "WhatsApp Business API", "Soporte prioritario", "White-label"],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand text-white"><ShoppingBag className="h-5 w-5" /></span>
            WhatsCommerce
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 dark:text-slate-300 md:flex">
            {/* Industrias mega-menu (CSS hover) */}
            <div className="group relative">
              <button className="flex items-center gap-1 py-5 hover:text-slate-900 dark:hover:text-white">
                Industrias
                <svg className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-6 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-3 gap-6">
                  {INDUSTRY_GROUPS.map((group) => (
                    <div key={group}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                      <ul className="space-y-1">
                        {INDUSTRIES.filter((i) => i.group === group).slice(0, 6).map((i) => (
                          <li key={i.slug}>
                            <Link href={`/industria/${i.slug}`} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                              <span>{i.emoji}</span> {i.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <a href="#industrias" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Ver todas las industrias →</a>
              </div>
            </div>
            <a href="#como-funciona" className="hover:text-slate-900 dark:hover:text-white">Cómo funciona</a>
            <a href="#funciones" className="hover:text-slate-900 dark:hover:text-white">Funciones</a>
            <a href="#precios" className="hover:text-slate-900 dark:hover:text-white">Precios</a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 sm:block">Entrar</Link>
            <Button asChild variant="brand" size="sm" className="rounded-full px-4"><Link href="/register">Empezar gratis</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sin comisiones por venta
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Tu tienda online que vende por <span className="text-gradient">WhatsApp</span>.
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-600 dark:text-slate-300">
            Crea tu catálogo, recibe pedidos en tu WhatsApp y gestiona todo con un POS profesional. Listo en minutos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="brand" size="lg" className="rounded-full px-6"><Link href="/register">Crear mi tienda gratis <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6"><a href="#precios">Ver precios</a></Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">Gratis para siempre · Sin tarjeta de crédito</p>
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-emerald-100 to-sky-100 blur-2xl dark:from-emerald-950 dark:to-sky-950" />
          <div className="mx-auto w-[280px] rounded-[2.5rem] border-8 border-slate-900 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="h-6 rounded-t-[1.8rem] bg-slate-900 dark:bg-slate-800" />
            <div className="p-3">
              <div className="h-20 rounded-2xl gradient-brand" />
              <div className="-mt-6 ml-3 h-12 w-12 rounded-2xl border-4 border-white bg-white shadow dark:border-slate-900">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"><Store className="h-5 w-5 text-slate-400" /></div>
              </div>
              <div className="mt-2 px-1">
                <div className="text-sm font-bold">Tacos El Güero</div>
                <div className="text-[11px] text-slate-400">Antojitos recién hechos</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                    <div className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-1.5 h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-1 h-2 w-1/2 rounded bg-emerald-200 dark:bg-emerald-900" />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-2 text-xs font-medium text-white">
                <MessageCircle className="h-4 w-4" /> Enviar pedido por WhatsApp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases strip */}
      <section className="border-y border-slate-100 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container">
          <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-400">Para cualquier tipo de negocio</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8">
            {USE_CASES.map((u) => (
              <div key={u.label} className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                <u.icon className="h-6 w-6" />
                <span className="text-xs">{u.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industrias" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Hecho para tu industria</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Plantillas y flujos pensados para tu giro. Elige el tuyo.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {INDUSTRY_GROUPS.map((group) => (
            <div key={group}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{group}</h3>
              <ul className="mt-4 space-y-1">
                {INDUSTRIES.filter((i) => i.group === group).map((i) => (
                  <li key={i.slug}>
                    <Link href={`/industria/${i.slug}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white">
                      <span>{i.emoji}</span> {i.name}
                      <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Empieza a vender en 3 pasos</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Sin conocimientos técnicos. Tú te enfocas en vender.</p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white dark:bg-white dark:text-slate-900">{s.n}</div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Todo en una sola plataforma</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Profesional, completa y lista para crecer contigo.</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-6 dark:bg-slate-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950"><Check className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Precios simples y transparentes</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Empieza gratis. Mejora cuando lo necesites.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((tier) => {
            const plan = PLAN_CONFIG[tier];
            const highlight = plan.highlight;
            return (
              <div key={tier} className={`relative rounded-3xl border p-7 ${highlight ? "border-emerald-500 shadow-xl shadow-emerald-500/10" : "border-slate-200 dark:border-slate-800"}`}>
                {highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">Más popular</span>}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <div className="mt-5">
                  <span className="text-4xl font-bold">{plan.priceMonthly === 0 ? "Gratis" : formatMoney(plan.priceMonthly, plan.currency)}</span>
                  {plan.priceMonthly > 0 && <span className="text-slate-500">/mes</span>}
                </div>
                <Button asChild variant={highlight ? "brand" : "outline"} className="mt-6 w-full rounded-full">
                  <Link href="/register">{tier === "BASIC" ? "Empezar gratis" : `Elegir ${plan.name}`}</Link>
                </Button>
                <ul className="mt-6 space-y-3 text-sm">
                  {PLAN_FEATURES[tier].map((f) => (
                    <li key={f} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> <span className="text-slate-600 dark:text-slate-300">{f}</span></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Social proof / quote */}
      <section className="border-y border-slate-100 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container max-w-3xl text-center">
          <div className="flex justify-center gap-1 text-amber-400">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5 fill-amber-400" />)}</div>
          <p className="mt-5 text-xl font-medium leading-relaxed sm:text-2xl">
            “Monté mi tienda en una tarde y empecé a recibir pedidos por WhatsApp el mismo día. Adiós a anotar todo a mano.”
          </p>
          <p className="mt-4 text-sm text-slate-500">— Negocio de comida, Ciudad de México</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Preguntas frecuentes</h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {f.q}
                  <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="overflow-hidden rounded-3xl gradient-brand px-8 py-16 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Empieza a vender hoy mismo</h2>
          <p className="mx-auto mt-3 max-w-md text-white/90">Crea tu tienda gratis y recibe tu primer pedido por WhatsApp.</p>
          <Button asChild size="lg" className="mt-8 rounded-full bg-white px-7 text-slate-900 hover:bg-white/90">
            <Link href="/register">Crear mi tienda gratis <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 dark:border-slate-800">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand text-white"><ShoppingBag className="h-4 w-4" /></span>
            WhatsCommerce POS
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">Entrar</Link>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">Empezar gratis</Link>
            <Link href="/legal/terminos" className="hover:text-slate-900 dark:hover:text-white">Términos</Link>
            <Link href="/legal/privacidad" className="hover:text-slate-900 dark:hover:text-white">Privacidad</Link>
          </div>
          <p>© {new Date().getFullYear()} WhatsCommerce</p>
        </div>
      </footer>
    </div>
  );
}
