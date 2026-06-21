"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";

export function Sidebar({
  permissions,
  features,
  storeName,
  planTier,
}: {
  permissions: string[];
  features: Record<string, boolean>;
  storeName: string;
  planTier?: string;
}) {
  const pathname = usePathname();
  const has = (p?: string) =>
    !p || permissions.includes(p) || permissions.includes(p.split(":")[0] + ":manage");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/40 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white shadow-sm shadow-primary/30">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">{storeName}</div>
          <div className="text-[11px] text-muted-foreground">WhatsCommerce POS</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.filter((i) => has(i.permission)).map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const locked = item.feature ? !features[item.feature] : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
              <span className="flex-1 truncate">{item.label}</span>
              {locked && <Lock className="h-3.5 w-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {planTier !== "ENTERPRISE" && (
        <div className="m-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Mejora tu plan
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Pagos con tarjeta, dominio propio y más.</p>
          <Button asChild variant="brand" size="sm" className="mt-2 w-full">
            <Link href="/dashboard/upgrade">Ver planes</Link>
          </Button>
        </div>
      )}
    </aside>
  );
}
