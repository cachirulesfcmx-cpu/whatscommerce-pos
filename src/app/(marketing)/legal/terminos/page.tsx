import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
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
      <main className="container max-w-3xl py-12 prose-slate">
        <h1 className="text-3xl font-bold">Términos y condiciones</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {new Date().getFullYear()}</p>
        <div className="mt-6 space-y-5 text-slate-600 dark:text-slate-300">
          <p>Bienvenido a WhatsCommerce POS. Al crear una cuenta y usar la plataforma aceptas estos términos. Léelos con atención.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. El servicio</h2>
          <p>WhatsCommerce es una plataforma SaaS que permite a negocios crear un catálogo en línea, recibir pedidos por WhatsApp y administrar ventas. El servicio se ofrece «tal cual» y puede evolucionar con el tiempo.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Cuentas</h2>
          <p>Eres responsable de la información de tu cuenta y de la actividad en ella. Debes proporcionar datos veraces y mantener segura tu contraseña.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Planes y pagos</h2>
          <p>Los planes de pago se facturan según el ciclo elegido. Puedes cambiar o cancelar tu plan desde el portal de facturación. Los pagos de pedidos entre tu negocio y tus clientes son tu responsabilidad.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Uso aceptable</h2>
          <p>No debes usar la plataforma para actividades ilegales, contenido prohibido o que infrinja derechos de terceros. Podemos suspender tiendas que incumplan estas reglas.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Responsabilidad</h2>
          <p>WhatsCommerce no es responsable por pérdidas derivadas del uso del servicio en la medida que lo permita la ley aplicable.</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Contacto</h2>
          <p>Para dudas sobre estos términos, contáctanos desde tu panel o por los canales oficiales.</p>
        </div>
        <div className="mt-10 text-sm"><Link href="/legal/privacidad" className="text-primary hover:underline">Ver Aviso de privacidad →</Link></div>
      </main>
    </div>
  );
}
