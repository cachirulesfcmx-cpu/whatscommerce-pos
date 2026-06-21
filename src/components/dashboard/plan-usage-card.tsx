"use client";
import Link from "next/link";
import { Sparkles, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UsageMeter, type UsageMeterProps } from "@/components/dashboard/usage-meter";

export function PlanUsageCard({
  planName,
  tier,
  metrics,
  anyNear,
  anyReached,
}: {
  planName: string;
  tier: string;
  metrics: UsageMeterProps[];
  anyNear: boolean;
  anyReached: boolean;
}) {
  const showUpgrade = tier !== "ENTERPRISE";
  return (
    <Card className="glass-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4" /> Uso de tu plan
        </CardTitle>
        <Badge variant={anyReached ? "destructive" : anyNear ? "warning" : "success"}>
          Plan {planName}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((m) => (
          <UsageMeter key={m.label} {...m} />
        ))}
        {showUpgrade && (anyNear || anyReached) && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-medium">
              {anyReached ? "Alcanzaste un límite de tu plan." : "Estás cerca de un límite."}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Mejora a Pro para productos y pedidos ilimitados.
            </p>
            <Button asChild variant="brand" size="sm" className="mt-2">
              <Link href="/dashboard/upgrade">
                <Sparkles className="h-4 w-4" /> Mejorar plan
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
