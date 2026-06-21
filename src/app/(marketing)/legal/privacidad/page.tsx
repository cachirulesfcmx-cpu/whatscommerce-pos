import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Aviso de privacidad" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-100 dark:border-slate-800">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand text-white"><ShoppingBag className="h-5 w-5" /></span>
            WhatsCommerce
          </Link>
        </div>
      </header>
      <main className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold">Aviso de privacidad</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {new Date().getFullYear()}</p>
        <div className="mt-6 space-y-5 text-slate-600 dark:text-slate-300">
          <p>Tu privacidad es importante. Este aviso explica qué datos tratamos y cómo.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Datos que recopilamos</h2>
          <p>Datos de tu cuenta (nombre, email), datos de tu negocio y tienda, y datos de los pedidos y clientes que tú gestionas en la plataforma.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Cómo los usamos</h2>
          <p>Para operar el servicio, procesar pagos (vía proveedores como Stripe), enviar notificaciones y mejorar la plataforma.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Terceros</h2>
          <p>Usamos proveedores como Vercel (hosting), Supabase (base de datos), Stripe (pagos) y opcionalmente WhatsApp/Meta. Cada uno trata datos bajo sus propias políticas.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Tus derechos</h2>
          <p>Puedes acceder, corregir o eliminar tus datos. Como dueño de tienda, eres responsable de los datos de tus clientes que administras.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Contacto</h2>
          <p>Para ejercer tus derechos o resolver dudas, contáctanos por los canales oficiales.</p>
        </div>
        <div className="mt-10 text-sm"><Link href="/legal/terminos" className="text-primary hover:underline">Ver Términos y condiciones →</Link></div>
      </main>
    </div>
  );
}
