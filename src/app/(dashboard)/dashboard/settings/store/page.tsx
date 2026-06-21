import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { SettingsPanel } from "@/components/dashboard/settings-panel";

export const metadata = { title: "Editor de tienda" };
export const dynamic = "force-dynamic";

export default async function StoreEditorPage() {
  const { store } = await getDashboardContext();
  const wa = await prisma.whatsAppSettings.findUnique({ where: { storeId: store.id } });
  return (
    <SettingsPanel
      defaultTab="appearance"
      storeSlug={store.slug}
      store={{ name: store.name, description: store.description, logoUrl: store.logoUrl, bannerUrl: store.bannerUrl, primaryColor: store.primaryColor, templateKey: store.templateKey, seoTitle: store.seoTitle, seoDescription: store.seoDescription }}
      whatsapp={{ phone: wa?.phone ?? null, displayName: wa?.displayName ?? null, notifyCustomer: wa?.notifyCustomer ?? false, templates: (wa?.templates as Record<string, string>) ?? {} }}
    />
  );
}
