import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;
  const stores = await prisma.store.findMany({
    where: { status: "ACTIVE", onboarded: true },
    select: { slug: true, updatedAt: true },
    take: 5000,
  });
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/register`, priority: 0.8 },
    ...stores.map((s) => ({
      url: `${base}/store/${s.slug}`,
      lastModified: s.updatedAt,
      priority: 0.7,
    })),
  ];
}
