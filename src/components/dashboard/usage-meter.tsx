"use client";
import { cn } from "@/lib/utils";

export interface UsageMeterProps {
  label: string;
  used: number;
  limit: number | null;
  percent: number;
  reached: boolean;
  near: boolean;
}

export function UsageMeter({ label, used, limit, percent, reached, near }: UsageMeterProps) {
  const unlimited = limit == null;
  const barColor = reached ? "bg-destructive" : near ? "bg-amber-500" : "bg-primary";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium tabular-nums", reached && "text-destructive")}>
          {used}
          {unlimited ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">· ilimitado</span>
          ) : (
            <span className="text-muted-foreground"> / {limit}</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", unlimited ? "bg-emerald-500/40" : barColor)}
          style={{ width: unlimited ? "12%" : `${Math.max(4, percent)}%` }}
        />
      </div>
    </div>
  );
}
