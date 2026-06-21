import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export interface TenantResolution {
  storeSlug: string | null;
  via: "subdomain" | "custom-domain" | "path" | "none";
}

/**
 * Resolve which store a request targets, based on the Host header.
 * - <slug>.rootdomain  -> subdomain tenant
 * - custom domain      -> Domain table lookup
 * - rootdomain / www   -> marketing (no tenant)
 * Path-based (/store/<slug>) is handled directly by the route.
 */
export function parseHost(host: string | null): TenantResolution {
  if (!host) return { storeSlug: null, via: "none" };
  const root = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const hostname = host.split(":")[0].toLowerCase();

  // localhost / root domain -> marketing
  if (
    hostname === "localhost" ||
    hostname === root ||
    hostname === `www.${root}` ||
    hostname.endsWith(".vercel.app")
  ) {
    return { storeSlug: null, via: "none" };
  }

  // subdomain of root: <slug>.root
  if (hostname.endsWith(`.${root}`)) {
    const slug = hostname.replace(`.${root}`, "");
    if (slug && slug !== "www" && slug !== "app") {
      return { storeSlug: slug, via: "subdomain" };
    }
    return { storeSlug: null, via: "none" };
  }

  // *.localhost (dev subdomains: tienda.localhost)
  if (hostname.endsWith(".localhost")) {
    const slug = hostname.replace(".localhost", "");
    return { storeSlug: slug, via: "subdomain" };
  }

  // Otherwise treat as a custom domain (resolved against DB elsewhere).
  return { storeSlug: hostname, via: "custom-domain" };
}

/** DB-backed resolution of a store for a custom domain host. */
export async function resolveCustomDomain(host: string) {
  const hostname = host.split(":")[0].toLowerCase();
  const domain = await prisma.domain.findUnique({
    where: { host: hostname },
    include: { store: true },
  });
  if (domain?.status === "ACTIVE") return domain.store;
  return null;
}

export async function getStoreBySlug(slug: string) {
  return prisma.store.findUnique({ where: { slug } });
}
