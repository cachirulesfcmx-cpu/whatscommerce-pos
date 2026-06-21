"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, MonitorSmartphone, Boxes, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart, permission: "orders:view" },
  { label: "POS", href: "/dashboard/pos", icon: MonitorSmartphone, permission: "pos:view" },
  { label: "Productos", href: "/dashboard/products", icon: Boxes, permission: "products:view" },
  { label: "Ajustes", href: "/dashboard/settings", icon: Settings, permission: "settings:view" },
];

export function MobileNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const has = (p: string) => permissions.includes(p) || permissions.includes(p.split(":")[0] + ":manage");
  const items = ITEMS.filter((i) => has(i.permission));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/90 backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", active && "scale-110")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
