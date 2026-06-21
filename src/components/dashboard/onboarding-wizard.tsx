"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowRight, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPES, CURRENCIES, TEMPLATES } from "@/lib/constants";

const STEPS = ["Negocio", "WhatsApp", "Plantilla"] as const;

export function OnboardingWizard({
  initial,
}: {
  initial: { name: string; whatsappPhone: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    name: initial.name,
    description: "",
    businessType: "restaurant",
    currency: "MXN",
    country: "MX",
    timezone: "America/Mexico_City",
    whatsappPhone: initial.whatsappPhone,
    templateKey: "minimal-store",
    primaryColor: "#16a34a",
  });

  const [sampleData, setSampleData] = React.useState(true);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function finish() {
    setLoading(true);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: json?.error?.message });
      return;
    }
    // Optional: preload sample catalog for the chosen business type
    if (sampleData) {
      await fetch("/api/stores/sample-data", { method: "POST" }).catch(() => {});
    }
    setLoading(false);
    toast({ variant: "success", title: "¡Tienda lista!", description: sampleData ? "Cargamos productos de ejemplo para empezar." : "Empieza a agregar productos." });
    router.push("/dashboard/products");
    router.refresh();
  }

  const canNext =
    step === 0 ? form.name.length >= 2 : step === 1 ? form.whatsappPhone.length >= 7 : true;

  return (
    <Card className="w-full glass-card">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Configura tu tienda</h1>
            <p className="text-xs text-muted-foreground">Paso {step + 1} de {STEPS.length}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
              <span className={cn("mt-1 block text-xs", i <= step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Nombre de la tienda</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="¿Qué vendes?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={form.businessType} onChange={(e) => set("businessType", e.target.value)}>
                      {BUSINESS_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                      {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Número de WhatsApp (con código de país)</Label>
                  <Input
                    value={form.whatsappPhone}
                    onChange={(e) => set("whatsappPhone", e.target.value)}
                    placeholder="5215512345678"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aquí recibirás los pedidos de tus clientes. Ej: 52 + 10 dígitos.
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { set("templateKey", t.key); set("primaryColor", t.color); }}
                    className={cn(
                      "relative rounded-xl border p-3 text-left transition-all",
                      form.templateKey === t.key ? "ring-2 ring-primary" : "hover:border-primary/40"
                    )}
                  >
                    <div className="mb-2 h-12 rounded-lg" style={{ background: t.color }} />
                    <span className="text-xs font-medium">{t.name}</span>
                    {form.templateKey === t.key && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={sampleData}
                  onChange={(e) => setSampleData(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Precargar productos de ejemplo de mi giro</span>
                  <span className="block text-xs text-muted-foreground">
                    Te dejamos categorías y productos demo listos para editar. Podrás borrarlos cuando quieras.
                  </span>
                </span>
              </label>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="brand" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="brand" onClick={finish} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Finalizar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
