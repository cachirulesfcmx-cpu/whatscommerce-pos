import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { SettingsPanel } from "@/components/dashboard/settings-panel";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { store } = await getDashboardContext();
  const [wa, settings] = await Promise.all([
    prisma.whatsAppSettings.findUnique({ where: { storeId: store.id } }),
    prisma.storeSettings.findUnique({ where: { storeId: store.id } }),
  ]);
  return (
    <SettingsPanel
      storeSlug={store.slug}
      storeId={store.id}
      store={{ name: store.name, description: store.description, logoUrl: store.logoUrl, bannerUrl: store.bannerUrl, primaryColor: store.primaryColor, templateKey: store.templateKey, locale: store.locale, seoTitle: store.seoTitle, seoDescription: store.seoDescription }}
      whatsapp={{ phone: wa?.phone ?? null, displayName: wa?.displayName ?? null, notifyCustomer: wa?.notifyCustomer ?? false, templates: (wa?.templates as Record<string, string>) ?? {}, mode: wa?.mode ?? "link", bridgeUrl: wa?.bridgeUrl ?? null, bridgeToken: wa?.bridgeToken ?? null, bridgeStatus: wa?.bridgeStatus ?? null }}
      profile={{
        verified: settings?.verified ?? false,
        addressText: settings?.addressText ?? null, hoursText: settings?.hoursText ?? null,
        instagramUrl: settings?.instagramUrl ?? null,
        instagramFollowers: settings?.instagramFollowers ?? null, facebookFollowers: settings?.facebookFollowers ?? null, tiktokFollowers: settings?.tiktokFollowers ?? null,
        promoEnabled: settings?.promoEnabled ?? false, promoTitle: settings?.promoTitle ?? null, promoText: settings?.promoText ?? null,
        promoCtaLabel: settings?.promoCtaLabel ?? null, promoCtaUrl: settings?.promoCtaUrl ?? null, promoImageUrl: settings?.promoImageUrl ?? null,
        paymentMethods: (settings?.paymentMethods as ProfilePay[]) ?? [],
      }}
    />
  );
}

type ProfilePay = { key?: string; method: string; label: string; instructions?: string; enabled?: boolean };
