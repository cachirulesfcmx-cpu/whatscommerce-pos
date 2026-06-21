import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Storefront } from "@/components/store/storefront";
import { getDemoStore, demoToStorefrontDTO, allDemoSlugs } from "@/lib/demo/catalogs";
import { getIndustry } from "@/lib/industries";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return allDemoSlugs().map((industry) => ({ industry }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const ind = getIndustry(industry);
  if (!ind) return { title: "Demo" };
  return {
    title: `Demo ${ind.name} · WhatsCommerce`,
    description: `Mira cómo se vería una tienda de ${ind.name.toLowerCase()} en WhatsCommerce.`,
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const demo = getDemoStore(industry);
  if (!demo) notFound();
  const dto = demoToStorefrontDTO(demo);
  return <Storefront store={dto} demo />;
}
