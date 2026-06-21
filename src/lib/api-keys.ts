import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import { hasFeature } from "@/lib/plans/limits";
import type { Store } from "@prisma/client";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Generate a new API key. Returns the plaintext (shown once) + prefix + hash. */
export function generateApiKey(): { key: string; prefix: string; hashedKey: string } {
  const secret = randomBytes(24).toString("base64url");
  const key = `wc_live_${secret}`;
  return { key, prefix: key.slice(0, 12), hashedKey: hashApiKey(key) };
}

function extractKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const x = req.headers.get("x-api-key");
  return x ? x.trim() : null;
}

/**
 * Authenticate a public API request via API key.
 * Returns the owning store, or throws ApiError(401/403).
 */
export async function resolveApiKey(req: Request): Promise<{ store: Store }> {
  const raw = extractKey(req);
  if (!raw) throw new ApiError(401, "Falta la API key (header Authorization: Bearer …)", "NO_API_KEY");

  const record = await prisma.apiKey.findUnique({
    where: { hashedKey: hashApiKey(raw) },
    include: { store: true },
  });
  if (!record || record.revokedAt) throw new ApiError(401, "API key inválida o revocada", "INVALID_API_KEY");
  if (record.store.status !== "ACTIVE") throw new ApiError(403, "La tienda no está activa", "STORE_INACTIVE");
  if (!(await hasFeature(record.storeId, "api"))) {
    throw new ApiError(403, "El plan de la tienda no incluye API.", "FEATURE_LOCKED");
  }

  // best-effort last-used timestamp
  prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { store: record.store };
}
