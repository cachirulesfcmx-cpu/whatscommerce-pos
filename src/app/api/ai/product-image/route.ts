import { NextRequest } from "next/server";
import { handle, ok, ApiError } from "@/server/api";
import { getActiveStore, requireStoreAccess, assertPermission } from "@/server/context";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ prompt: z.string().min(2).max(300) });

// POST /api/ai/product-image — generate a product image and host it on Supabase Storage.
export const POST = handle(async (req: NextRequest) => {
  const store = await getActiveStore();
  if (!store) throw new ApiError(404, "No tienes una tienda", "NO_STORE");
  const ctx = await requireStoreAccess(store.id);
  assertPermission(ctx.staff, "products:create");

  const rl = await rateLimit(`ai-image:${store.id}:${clientIp(req.headers)}`, 20, 3600);
  if (!rl.success) throw new ApiError(429, "Llegaste al límite de generaciones por hora.", "RATE_LIMIT");

  const openaiKey = process.env.OPENAI_API_KEY;
  const sbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!openaiKey) throw new ApiError(503, "Configura OPENAI_API_KEY para generar imágenes con IA.", "AI_OFF");
  if (!sbUrl || !sbKey) throw new ApiError(503, "Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para alojar las imágenes.", "STORAGE_OFF");

  const { prompt } = schema.parse(await req.json());

  // 1) Generate with OpenAI Images
  const gen = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: `Foto de producto profesional para e-commerce de: ${prompt}. Fondo limpio de estudio, iluminación suave, alta nitidez, sin texto.`,
      size: "1024x1024",
      n: 1,
    }),
  });
  if (!gen.ok) {
    const err = await gen.text();
    throw new ApiError(502, `Error generando la imagen: ${err.slice(0, 140)}`, "AI_ERROR");
  }
  const genJson = (await gen.json()) as { data?: { b64_json?: string }[] };
  const b64 = genJson.data?.[0]?.b64_json;
  if (!b64) throw new ApiError(502, "La IA no devolvió imagen.", "AI_EMPTY");
  const bytes = Buffer.from(b64, "base64");

  // 2) Ensure public bucket exists (ignore "already exists")
  await fetch(`${sbUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey, "Content-Type": "application/json" },
    body: JSON.stringify({ id: "product-images", name: "product-images", public: true }),
  }).catch(() => {});

  // 3) Upload
  const path = `${store.id}/${Date.now()}.png`;
  const up = await fetch(`${sbUrl}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sbKey}`,
      apikey: sbKey,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!up.ok) {
    const err = await up.text();
    throw new ApiError(502, `No se pudo guardar la imagen: ${err.slice(0, 140)}`, "UPLOAD_ERROR");
  }

  const url = `${sbUrl}/storage/v1/object/public/product-images/${path}`;
  return ok({ url });
});
