import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Crea tu tienda gratis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        En 1 minuto tendrás tu catálogo online listo.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
