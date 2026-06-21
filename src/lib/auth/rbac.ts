import type { StaffRole } from "@prisma/client";

/**
 * Granular permission model. Each permission is `<module>:<action>`.
 * Roles map to a default permission set; individual Staff rows may carry
 * `permissions` overrides (extra grants) on top of their role defaults.
 */
export const MODULES = [
  "dashboard",
  "products",
  "orders",
  "pos",
  "customers",
  "inventory",
  "coupons",
  "reports",
  "settings",
  "staff",
  "billing",
  "automations",
  "broadcasts",
] as const;

export type Module = (typeof MODULES)[number];
export type Action = "view" | "create" | "update" | "delete" | "manage";
export type Permission = `${Module}:${Action}`;

const ALL: Permission[] = MODULES.flatMap((m) => [
  `${m}:view`,
  `${m}:create`,
  `${m}:update`,
  `${m}:delete`,
  `${m}:manage`,
]) as Permission[];

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  OWNER: ALL,
  MANAGER: ALL.filter(
    (p) => !p.startsWith("billing:") && !p.startsWith("staff:delete")
  ),
  STAFF: [
    "dashboard:view",
    "products:view",
    "products:update",
    "orders:view",
    "orders:create",
    "orders:update",
    "pos:view",
    "pos:create",
    "customers:view",
    "customers:create",
    "inventory:view",
  ],
  CASHIER: [
    "dashboard:view",
    "pos:view",
    "pos:create",
    "orders:view",
    "orders:create",
    "customers:view",
    "products:view",
  ],
};

export function resolvePermissions(
  role: StaffRole,
  overrides: string[] = []
): Set<Permission> {
  return new Set<Permission>([
    ...ROLE_PERMISSIONS[role],
    ...(overrides as Permission[]),
  ]);
}

export function can(
  role: StaffRole,
  permission: Permission,
  overrides: string[] = []
): boolean {
  const perms = resolvePermissions(role, overrides);
  if (perms.has(permission)) return true;
  const [mod] = permission.split(":") as [Module];
  return perms.has(`${mod}:manage`);
}
