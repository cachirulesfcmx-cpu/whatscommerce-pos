import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between gradient-brand p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <ShoppingBag className="h-6 w-6" /> WhatsCommerce
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Tu tienda online, lista para vender por WhatsApp.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Catálogo, carrito, checkout y POS profesional. Recibe pedidos
            directo en tu WhatsApp con un ticket impecable.
          </p>
        </div>
        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} WhatsCommerce POS
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
