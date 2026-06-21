import { NextResponse, type NextRequest } from "next/server";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "whatscommerce.com";

// Edge-safe host parsing (no prisma import here).
function tenantSlug(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === ROOT ||
    hostname === `www.${ROOT}` ||
    hostname === `app.${ROOT}` ||
    hostname.endsWith(".vercel.app")
  ) {
    return null;
  }
  if (hostname.endsWith(`.${ROOT}`)) {
    const slug = hostname.replace(`.${ROOT}`, "");
    return slug === "www" || slug === "app" ? null : slug;
  }
  if (hostname.endsWith(".localhost")) {
    return hostname.replace(".localhost", "");
  }
  // custom domains: pass the full host; resolved against DB in the route via header
  return `@host:${hostname}`;
}

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";
  const slug = tenantSlug(host);

  // Protect app routes
  if (
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/admin")
  ) {
    const authed = SESSION_COOKIES.some((c) => req.cookies.has(c));
    if (!authed) {
      const login = new URL("/login", url);
      login.searchParams.set("callbackUrl", url.pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // Tenant storefront rewrite (subdomain or custom domain)
  if (slug && !url.pathname.startsWith("/store") && !url.pathname.startsWith("/api")) {
    const res = NextResponse.rewrite(
      new URL(
        `/store/${slug.startsWith("@host:") ? "_host" : slug}${url.pathname}`,
        req.url
      )
    );
    if (slug.startsWith("@host:")) {
      res.headers.set("x-tenant-host", slug.replace("@host:", ""));
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // run on everything except static assets
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|robots.txt|sitemap.xml).*)",
  ],
};
