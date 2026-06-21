import { getDashboardContext } from "@/server/dashboard";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getDashboardContext();
  const permissions = Array.from(ctx.permissions);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        permissions={permissions}
        features={ctx.plan.features}
        storeName={ctx.store.name}
        planTier={ctx.plan.tier}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          storeSlug={ctx.store.slug}
          planName={ctx.plan.name}
          userName={ctx.user.name ?? ctx.user.email}
          isSuperAdmin={ctx.user.isSuperAdmin}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
        <MobileNav permissions={permissions} />
      </div>
    </div>
  );
}
