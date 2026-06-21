"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      storeName: String(form.get("storeName")),
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "No se pudo crear la cuenta",
        description: json?.error?.message ?? "Intenta de nuevo.",
      });
      return;
    }

    // auto login
    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="storeName">Nombre de tu tienda</Label>
        <Input id="storeName" name="storeName" placeholder="Tacos El Güero" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Tu nombre</Label>
        <Input id="name" name="name" placeholder="Miguel Díaz" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="tu@negocio.com" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, con letras y números.</p>
      </div>
      <Button type="submit" variant="brand" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Crear mi tienda gratis
      </Button>
    </form>
  );
}
