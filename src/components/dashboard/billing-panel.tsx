"use client";
import * as React from "react";
import { Check, Sparkles, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, cn } from "@/lib/utils";

interface PlanRow {
  tier: string; name: string; description: string;
  priceMonthly: number; currency: string; highlight: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activa", TRIALING: "Período de prueba", PAST_DUE: "Pago pendiente",
  CANCELED: "Cancelada", UNPAID: "Sin pagar", INCOMPLETE: "Incompleta",
};

export function BillingPanel({
  currentTier, status, currentPeriodEnd, stripeEnabled, plans,
}: {
  currentTier: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeEnabled: boolean;
  plans: PlanRow[];
}) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState<string | null>(null);

  async function upgrade(tier: string) {
    if (!stripeEnabled) {
      toast({ variant: "destructive", title: "Stripe no configurado", description: "Agrega tus claves de Stripe en el .env para activar pagos." });
      return;
    }
    setLoading(tier);
    const res = await fetch("/api/billing/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: json?.error?.message }); return; }
    window.location.href = json.data.url;
  }

  async function portal() {
    setLoading("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: json?.error?.message }); return; }
    window.location.href = json.data.url;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Facturación y plan</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu suscripción.</p>
      </div>

      <Card className="glass-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm text-muted-foreground">Plan actual</p>
            <p className="text-xl font-bold">{plans.find((p) => p.tier === currentTier)?.name ?? currentTier}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={status === "ACTIVE" || status === "TRIALING" ? "success" : "warning"}>{STATUS_LABELS[status] ?? status}</Badge>
              {currentPeriodEnd && <span className="text-xs text-muted-foreground">Renueva: {new Date(currentPeriodEnd).toLocaleDateString("es-MX")}</span>}
            </div>
          </div>
          {currentTier !== "BASIC" && (
            <Button variant="outline" onClick={portal} disabled={loading === "portal"}>
              {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Administrar suscripción
            </Button>
          )}
        </CardContent>
      </Card>

      {!stripeEnabled && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            Stripe no está configurado en este entorno. Agrega <code>STRIPE_SECRET_KEY</code> y los price IDs en tu <code>.env</code> para habilitar el cobro de planes.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.tier === currentTier;
          return (
            <Card key={p.tier} className={cn("glass-card relative", p.highlight && "ring-2 ring-primary")}>
              {p.highlight && <Badge className="absolute -top-2 left-4">Más popular</Badge>}
              <CardContent className="p-5">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                <p className="mt-3 text-2xl font-bold">
                  {p.priceMonthly === 0 ? "Gratis" : formatMoney(p.priceMonthly, p.currency)}
                  {p.priceMonthly > 0 && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
                </p>
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? "outline" : p.highlight ? "brand" : "default"}
                  disabled={isCurrent || p.tier === "BASIC" || loading === p.tier}
                  onClick={() => upgrade(p.tier)}
                >
                  {loading === p.tier && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent ? <><Check className="h-4 w-4" /> Plan actual</> : p.tier === "BASIC" ? "Incluido" : <><Sparkles className="h-4 w-4" /> Cambiar a {p.name}</>}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
