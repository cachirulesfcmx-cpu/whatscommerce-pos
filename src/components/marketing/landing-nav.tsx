"use client";
import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag, ChevronDown, Menu, X, MessageCircle, MonitorSmartphone,
  CreditCard, Users, BarChart3, Boxes, Palette, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { INDUSTRIES, INDUSTRY_GROUPS } from "@/lib/industries";

const FEATURES = [
  { icon: MessageCircle, title: "Pedidos por WhatsApp", desc: "Ticket profesional listo para confirmar", href: "#funciones" },
  { icon: MonitorSmartphone, title: "POS y gestión", desc: "Cobra y administra como un pro", href: "#funciones" },
  { icon: CreditCard, title: "Pagos flexibles", desc: "Efectivo, transferencia o tarjeta", href: "#funciones" },
  { icon: Users, title: "Clientes / CRM", desc: "Historial, segmentos y contacto", href: "#funciones" },
  { icon: Boxes, title: "Inventario", desc: "Stock, alertas y movimientos", href: "#funciones" },
  { icon: BarChart3, title: "Reportes", desc: "Ventas, ticket promedio, estrellas", href: "#funciones" },
  { icon: Palette, title: "Plantillas", desc: "Diseños premium personalizables", href: "#plantillas" },
  { icon: Globe, title: "Dominio propio", desc: "Tu marca, sin comisiones", href: "#funciones" },
];

export function LandingNav() {
  const [mobile, setMobile] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand text-white"><ShoppingBag className="h-5 w-5" /></span>
          WhatsCommerce
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-1 text-sm text-slate-600 dark:text-slate-300 lg:flex">
          {/* Funciones */}
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-lg px-3 py-5 hover:text-slate-900 dark:hover:text-white">
              Funciones <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 w-[560px] rounded-2xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-1">
                {FEATURES.map((f) => (
                  <a key={f.title} href={f.href} className="flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950"><f.icon className="h-5 w-5" /></span>
                    <span>
                      <span className="block text-sm font-medium text-slate-900 dark:text-white">{f.title}</span>
                      <span className="block text-xs text-slate-500">{f.desc}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Industrias mega-menu */}
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-lg px-3 py-5 hover:text-slate-900 dark:hover:text-white">
              Industrias <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 w-[680px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-6 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-3 gap-6">
                {INDUSTRY_GROUPS.map((group) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                    <ul className="space-y-0.5">
                      {INDUSTRIES.filter((i) => i.group === group).slice(0, 7).map((i) => (
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

          <a href="#plantillas" className="rounded-lg px-3 py-2 hover:text-slate-900 dark:hover:text-white">Plantillas</a>
          <a href="#precios" className="rounded-lg px-3 py-2 hover:text-slate-900 dark:hover:text-white">Precios</a>
          <a href="#faq" className="rounded-lg px-3 py-2 hover:text-slate-900 dark:hover:text-white">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 sm:block">Entrar</Link>
          <Button asChild variant="brand" size="sm" className="rounded-full px-4"><Link href="/register">Empezar gratis</Link></Button>
          <button className="lg:hidden" onClick={() => setMobile((v) => !v)} aria-label="Menú">
            {mobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {mobile && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            <a href="#funciones" onClick={() => setMobile(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900">Funciones</a>
            <a href="#industrias" onClick={() => setMobile(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900">Industrias</a>
            <a href="#plantillas" onClick={() => setMobile(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900">Plantillas</a>
            <a href="#precios" onClick={() => setMobile(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900">Precios</a>
            <a href="#faq" onClick={() => setMobile(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900">FAQ</a>
            <Link href="/login" onClick={() => setMobile(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900">Entrar</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
