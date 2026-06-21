import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import { can, type Permission } from "@/lib/auth/rbac";
import type { Staff, Store, StaffRole } from "@prisma/client";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "No autenticado", "UNAUTHENTICATED");
  return user;
}

/** Assert the current user is the platform super admin. */
export async function requireSuperAdmin() {
  const user = await requireUser();
  if (!user.isSuperAdmin) throw new ApiError(403, "Solo super administradores", "FORBIDDEN");
  return user;
}

export interface StoreContext {
  user: { id: string; isSuperAdmin?: boolean; email?: string | null; name?: string | null };
  store: Store;
  staff: Staff;
}

/**
 * Resolve the user's membership in a store and assert access.
 * SuperAdmins bypass membership (acts as OWNER).
 */
export async function requireStoreAccess(storeId: string): Promise<StoreContext> {
  const user = await requireUser();
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError(404, "Tienda no encontrada", "NOT_FOUND");

  if (user.isSuperAdmin) {
    const fakeStaff = {
      id: "superadmin",
      storeId,
      userId: user.id,
      role: "OWNER" as StaffRole,
      permissions: [],
      branchId: null,
      isActive: true,
      invitedAt: new Date(),
      acceptedAt: new Date(),
    } as Staff;
    return { user, store, staff: fakeStaff };
  }

  const staff = await prisma.staff.findUnique({
    where: { storeId_userId: { storeId, userId: user.id } },
  });
  if (!staff || !staff.isActive) {
    throw new ApiError(403, "No tienes acceso a esta tienda", "FORBIDDEN");
  }
  return { user, store, staff };
}

/** Resolve the active store for the current dashboard user (first owned/joined). */
export async function getActiveStore(storeId?: string) {
  const user = await requireUser();
  if (storeId) {
    const ctx = await requireStoreAccess(storeId);
    return ctx.store;
  }
  const staff = await prisma.staff.findFirst({
    where: { userId: user.id, isActive: true },
    include: { store: true },
    orderBy: { invitedAt: "asc" },
  });
  return staff?.store ?? null;
}

export function assertPermission(staff: Staff, permission: Permission) {
  const overrides = Array.isArray(staff.permissions)
    ? (staff.permissions as string[])
    : [];
  if (!can(staff.role, permission, overrides)) {
    throw new ApiError(403, "No tienes permiso para esta acción", "FORBIDDEN");
  }
}
