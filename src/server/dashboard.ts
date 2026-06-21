import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorePlan } from "@/lib/plans/limits";
import { resolvePermissions, type Permission } from "@/lib/auth/rbac";
import type { Store, Staff, StaffRole } from "@prisma/client";

export interface DashboardContext {
  user: { id: string; name?: string | null; email?: string | null; isSuperAdmin?: boolean };
  store: Store;
  staff: Staff;
  permissions: Set<Permission>;
  plan: Awaited<ReturnType<typeof getStorePlan>>;
}

/**
 * Server-side guard for all /dashboard pages.
 * Redirects to /login when unauthenticated and /onboarding when the store
 * hasn't completed setup.
 */
export async function getDashboardContext(opts?: {
  requireOnboarded?: boolean;
}): Promise<DashboardContext> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const staff = await prisma.staff.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { store: true },
    orderBy: { invitedAt: "asc" },
  });

  if (!staff) {
    // super admins have no store membership -> send to the platform panel
    if (session.user.isSuperAdmin) redirect("/admin");
    // user without a store membership -> send to onboarding to create one
    redirect("/onboarding");
  }

  if (opts?.requireOnboarded !== false && !staff.store.onboarded) {
    redirect("/onboarding");
  }

  const overrides = Array.isArray(staff.permissions)
    ? (staff.permissions as string[])
    : [];
  const plan = await getStorePlan(staff.storeId);

  return {
    user: session.user,
    store: staff.store,
    staff,
    permissions: resolvePermissions(staff.role as StaffRole, overrides),
    plan,
  };
}
