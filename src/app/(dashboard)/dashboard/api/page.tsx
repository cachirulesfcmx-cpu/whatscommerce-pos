import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { ApiKeysManager } from "@/components/dashboard/api-keys-manager";

export const metadata = { title: "API" };
export const dynamic = "force-dynamic";

export default async function ApiPage() {
  const { store, plan } = await getDashboardContext();
  if (!plan.features.api) {
    return <FeatureGate title="API privada" description="Integra WhatsCommerce con tus sistemas mediante una API REST con llaves seguras. Disponible en el plan Enterprise." />;
  }

  const keys = await prisma.apiKey.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
  });

  return (
    <ApiKeysManager
      baseUrl={env.NEXT_PUBLIC_APP_URL}
      keys={keys.map((k) => ({
        id: k.id, name: k.name, prefix: k.prefix,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        revokedAt: k.revokedAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  );
}
