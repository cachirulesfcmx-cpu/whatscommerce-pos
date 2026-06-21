import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Bienvenido de vuelta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Inicia sesión para gestionar tu tienda.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Empieza gratis
        </Link>
      </p>
    </div>
  );
}
