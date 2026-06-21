import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShoppingBag, ArrowRight, Check, MessageCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INDUSTRIES, getIndustry } from "@/lib/industries";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return { title: "Industria" };
  return { title: `${ind.name} — WhatsCommerce POS`, description: ind.subcopy };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();

  const related = INDUSTRIES.filter((i) => i.group === ind.group && i.slug !== ind.slug).slice(0, 5);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand text-white"><ShoppingBag className="h-5 w-5" /></span>
            WhatsCommerce
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 sm:block">Entrar</Link>
            <Button asChild variant="brand" size="sm" className="rounded-full px-4"><Link href="/register">Empezar gratis</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span>{ind.emoji}</span> {ind.name}
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{ind.headline}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">{ind.subcopy}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6 text-white" style={{ background: ind.accent }}>
              <Link href="/register">Empezar gratis <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href={`/demo/${ind.slug}`} target="_blank">Ver demo de {ind.name.toLowerCase()} <Store className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {/* media band: video > image > gradient (configurable en src/lib/industries.ts) */}
        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
          {ind.heroVideo ? (
            <video className="h-44 w-full object-cover sm:h-64" autoPlay muted loop playsInline poster={ind.heroImage}>
              <source src={ind.heroVideo} />
            </video>
          ) : ind.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ind.heroImage} alt={ind.name} className="h-44 w-full object-cover sm:h-64" />
          ) : (
            <div className="h-44 w-full sm:h-64" style={{ background: `linear-gradient(135deg, ${ind.accent}, #0ea5e9)` }} />
          )}
          <div className="grid gap-px bg-slate-200 dark:bg-slate-800 sm:grid-cols-3">
            {ind.bullets.map((b) => (
              <div key={b} className="flex items-start gap-2 bg-white p-5 text-sm dark:bg-slate-950">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> <span className="text-slate-600 dark:text-slate-300">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section className="border-y border-slate-100 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            { n: "1", t: "Crea tu tienda", d: "Regístrate gratis y configura tu negocio en minutos." },
            { n: "2", t: "Agrega tu catálogo", d: "Sube productos o servicios con fotos y precios." },
            { n: "3", t: "Recibe pedidos", d: "Comparte tu link y recibe pedidos en tu WhatsApp." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900">{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="container py-14">
          <h2 className="text-center text-sm font-medium uppercase tracking-wide text-slate-400">Otras industrias en {ind.group}</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/industria/${r.slug}`} className="rounded-full border border-slate-200 px-4 py-1.5 text-sm hover:border-slate-400 dark:border-slate-700">
                {r.emoji} {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container pb-20">
        <div className="overflow-hidden rounded-3xl gradient-brand px-8 py-14 text-center text-white">
          <MessageCircle className="mx-auto h-8 w-8" />
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Empieza a vender hoy</h2>
          <p className="mx-auto mt-2 max-w-md text-white/90">Crea tu tienda gratis y recibe tu primer pedido por WhatsApp.</p>
          <Button asChild size="lg" className="mt-7 rounded-full bg-white px-7 text-slate-900 hover:bg-white/90">
            <Link href="/register">Crear mi tienda gratis <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 dark:border-slate-800">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
          <Link href="/" className="font-medium text-slate-700 dark:text-slate-300">← WhatsCommerce</Link>
          <p>© {new Date().getFullYear()} WhatsCommerce</p>
        </div>
      </footer>
    </div>
  );
}
