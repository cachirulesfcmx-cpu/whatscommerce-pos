import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  getStorefrontBySlug, getStorefrontByHost, serializeStorefront,
} from "@/server/storefront";
import { Storefront } from "@/components/store/storefront";

async function load(storeSlug: string) {
  if (storeSlug === "_host") {
    const host = (await headers()).get("x-tenant-host");
    if (!host) return null;
    return getStorefrontByHost(host);
  }
  return getStorefrontBySlug(storeSlug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await load(storeSlug);
  if (!store) return { title: "Tienda no encontrada" };
  return {
    title: store.seoTitle ?? store.name,
    description: store.seoDescription ?? store.description ?? `Compra en ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description ?? "",
      images: store.ogImageUrl ? [store.ogImageUrl] : store.bannerUrl ? [store.bannerUrl] : [],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await load(storeSlug);
  if (!store) notFound();
  return <Storefront store={serializeStorefront(store)} />;
}
