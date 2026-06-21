import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function FeatureGate({ title, description }: { title: string; description: string }) {
  return (
    <Card className="glass-card mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Button asChild variant="brand" className="mt-5">
          <Link href="/dashboard/upgrade"><Sparkles className="h-4 w-4" /> Mejorar plan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
