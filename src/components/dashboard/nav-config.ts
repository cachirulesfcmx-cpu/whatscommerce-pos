import {
  LayoutDashboard, ShoppingCart, Boxes, Tags, Users, Ticket,
  BarChart3, Palette, Settings, CreditCard, MonitorSmartphone, Wallet, KeyRound, ShoppingBag,
} from "lucide-react";
import type { FeatureKey } from "@/lib/plans/plans";
import type { Permission } from "@/lib/auth/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
  feature?: FeatureKey;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart, permission: "orders:view" },
  { label: "POS", href: "/dashboard/pos", icon: MonitorSmartphone, permission: "pos:view" },
  { label: "Productos", href: "/dashboard/products", icon: Boxes, permission: "products:view" },
  { label: "Inventario", href: "/dashboard/inventory", icon: Tags, permission: "inventory:view", feature: "inventory" },
  { label: "Clientes", href: "/dashboard/customers", icon: Users, permission: "customers:view", feature: "customers" },
  { label: "Cupones", href: "/dashboard/coupons", icon: Ticket, permission: "coupons:view", feature: "coupons" },
  { label: "Carritos", href: "/dashboard/carts", icon: ShoppingBag, permission: "orders:view", feature: "cartRecovery" },
  { label: "Reportes", href: "/dashboard/reports", icon: BarChart3, permission: "reports:view", feature: "reports" },
  { label: "Editor de tienda", href: "/dashboard/settings/store", icon: Palette, permission: "settings:view" },
  { label: "Pagos", href: "/dashboard/payments", icon: Wallet, permission: "orders:view" },
  { label: "Facturación", href: "/dashboard/billing", icon: CreditCard, permission: "billing:view" },
  { label: "API", href: "/dashboard/api", icon: KeyRound, permission: "settings:manage", feature: "api" },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings, permission: "settings:view" },
];
