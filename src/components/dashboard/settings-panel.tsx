"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Monitor, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TEMPLATES, PAYMENT_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TEMPLATE_VARIABLES, DEFAULT_TEMPLATE_LABELS } from "@/lib/whatsapp/customer-messages";
import { ThemePreview } from "@/components/dashboard/theme-preview";
import { LOCALES } from "@/lib/i18n";

interface ProfileData {
  verified: boolean;
  addressText: string | null;
  hoursText: string | null;
  instagramUrl: string | null;
  instagramFollowers: number | null;
  facebookFollowers: number | null;
  tiktokFollowers: number | null;
  promoEnabled: boolean;
  promoTitle: string | null;
  promoText: string | null;
  promoCtaLabel: string | null;
  promoCtaUrl: string | null;
  promoImageUrl: string | null;
  paymentMethods: { key?: string; method: string; label: string; instructions?: string; enabled?: boolean }[];
}

export function SettingsPanel({
  defaultTab = "general", store, whatsapp, storeSlug, storeId, profile,
}: {
  defaultTab?: string;
  storeSlug?: string;
  storeId?: string;
  store: { name: string; description: string | null; logoUrl: string | null; bannerUrl: string | null; primaryColor: string; templateKey: string; locale?: string | null; seoTitle: string | null; seoDescription: string | null };
  whatsapp: { phone: string | null; displayName: string | null; notifyCustomer: boolean; templates?: Record<string, string>; mode?: string | null; bridgeUrl?: string | null; bridgeToken?: string | null; bridgeStatus?: string | null };
  profile?: ProfileData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [savingStore, setSavingStore] = React.useState(false);
  const [savingWa, setSavingWa] = React.useState(false);
  const [device, setDevice] = React.useState<"mobile" | "desktop">("desktop");
  const [previewKey, setPreviewKey] = React.useState(0);
  const [s, setS] = React.useState(store);
  const [wa, setWa] = React.useState({
    phone: whatsapp.phone ?? "", displayName: whatsapp.displayName ?? "", notifyCustomer: whatsapp.notifyCustomer,
    mode: whatsapp.mode ?? "link", bridgeUrl: whatsapp.bridgeUrl ?? "", bridgeToken: whatsapp.bridgeToken ?? "",
  });
  const [templates, setTemplates] = React.useState<Record<string, string>>(whatsapp.templates ?? {});
  // QR bridge connection state
  const [qr, setQr] = React.useState<{ status: string; qr: string | null; configured: boolean } | null>(null);
  const [qrPolling, setQrPolling] = React.useState(false);
  React.useEffect(() => {
    if (!qrPolling) return;
    let active = true;
    const tick = async () => {
      const res = await fetch("/api/whatsapp/qr").then((r) => r.json()).catch(() => null);
      if (active && res?.data) setQr(res.data);
      if (active && res?.data?.status === "connected") setQrPolling(false);
    };
    tick();
    const iv = setInterval(tick, 3000);
    return () => { active = false; clearInterval(iv); };
  }, [qrPolling]);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [p, setP] = React.useState({
    addressText: profile?.addressText ?? "",
    hoursText: profile?.hoursText ?? "",
    instagramUrl: profile?.instagramUrl ?? "",
    instagramFollowers: profile?.instagramFollowers ?? "",
    facebookFollowers: profile?.facebookFollowers ?? "",
    tiktokFollowers: profile?.tiktokFollowers ?? "",
    promoEnabled: profile?.promoEnabled ?? false,
    promoTitle: profile?.promoTitle ?? "",
    promoText: profile?.promoText ?? "",
    promoCtaLabel: profile?.promoCtaLabel ?? "",
    promoCtaUrl: profile?.promoCtaUrl ?? "",
    promoImageUrl: profile?.promoImageUrl ?? "",
  });
  const enabledPaymentKeys = (profile?.paymentMethods ?? []).map((m) => m.key).filter(Boolean) as string[];
  const [payKeys, setPayKeys] = React.useState<string[]>(
    enabledPaymentKeys.length ? enabledPaymentKeys : ["cash", "transfer"]
  );

  async function saveProfile() {
    setSavingProfile(true);
    const toNum = (v: string | number) => (v === "" || v == null ? null : Number(v));
    const paymentMethods = PAYMENT_PRESETS.filter((pp) => payKeys.includes(pp.key)).map((pp) => ({
      key: pp.key, method: pp.method, label: pp.label, instructions: pp.instructions, enabled: true,
    }));
    const res = await fetch("/api/stores", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressText: p.addressText || null, hoursText: p.hoursText || null,
        instagramUrl: p.instagramUrl || null,
        instagramFollowers: toNum(p.instagramFollowers), facebookFollowers: toNum(p.facebookFollowers), tiktokFollowers: toNum(p.tiktokFollowers),
        promoEnabled: p.promoEnabled, promoTitle: p.promoTitle || null, promoText: p.promoText || null,
        promoCtaLabel: p.promoCtaLabel || null, promoCtaUrl: p.promoCtaUrl || null, promoImageUrl: p.promoImageUrl || null,
        paymentMethods,
      }),
    });
    setSavingProfile(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Error al guardar" }); return; }
    toast({ variant: "success", title: "Perfil actualizado" }); router.refresh();
  }

  async function saveStore() {
    setSavingStore(true);
    const res = await fetch("/api/stores", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: s.name, description: s.description, logoUrl: s.logoUrl || null, bannerUrl: s.bannerUrl || null,
        primaryColor: s.primaryColor, templateKey: s.templateKey, locale: s.locale ?? "es", seoTitle: s.seoTitle, seoDescription: s.seoDescription,
      }),
    });
    setSavingStore(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Error al guardar" }); return; }
    toast({ variant: "success", title: "Guardado" }); router.refresh();
  }

  async function saveWa() {
    setSavingWa(true);
    const res = await fetch("/api/whatsapp", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: wa.phone, displayName: wa.displayName, language: "es", notifyCustomer: wa.notifyCustomer, templates,
        mode: wa.mode, bridgeUrl: wa.bridgeUrl || null, bridgeToken: wa.bridgeToken || null,
      }),
    });
    setSavingWa(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Error al guardar" }); return; }
    toast({ variant: "success", title: "WhatsApp actualizado" }); router.refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="profile">Perfil & Pagos</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card><CardContent className="space-y-4 p-5">
            <div className="space-y-1.5"><Label>Nombre de la tienda</Label><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={s.description ?? ""} onChange={(e) => setS({ ...s, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Idioma de la tienda</Label>
              <select
                value={s.locale ?? "es"}
                onChange={(e) => setS({ ...s, locale: e.target.value })}
                className="h-10 w-full max-w-[220px] rounded-lg border bg-background px-3 text-sm"
              >
                {LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Idioma de la tienda pública y el checkout.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Logo (URL)</Label><Input value={s.logoUrl ?? ""} onChange={(e) => setS({ ...s, logoUrl: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Banner (URL)</Label><Input value={s.bannerUrl ?? ""} onChange={(e) => setS({ ...s, bannerUrl: e.target.value })} /></div>
            </div>
            <Button variant="brand" onClick={saveStore} disabled={savingStore}>{savingStore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card><CardContent className="space-y-4 p-5">
            <div className="space-y-1.5"><Label>Color principal</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={s.primaryColor} onChange={(e) => setS({ ...s, primaryColor: e.target.value })} className="h-10 w-14 rounded-lg border" />
                <Input value={s.primaryColor} onChange={(e) => setS({ ...s, primaryColor: e.target.value })} className="max-w-[140px]" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Plantilla</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TEMPLATES.map((t) => (
                  <button key={t.key} type="button" onClick={() => setS({ ...s, templateKey: t.key, primaryColor: t.color })}
                    className={cn("rounded-xl border p-2 text-left", s.templateKey === t.key && "ring-2 ring-primary")}>
                    <ThemePreview templateKey={t.key} className="mb-1.5" />
                    <span className="text-xs">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button variant="brand" onClick={() => { saveStore(); setTimeout(() => setPreviewKey((k) => k + 1), 800); }} disabled={savingStore}>{savingStore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar y previsualizar</Button>
          </CardContent></Card>

          {storeSlug && (
            <Card className="mt-4"><CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <Label>Vista previa</Label>
                <div className="flex items-center gap-1 rounded-lg border p-1">
                  <Button variant={device === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setDevice("desktop")}><Monitor className="h-4 w-4" /> Escritorio</Button>
                  <Button variant={device === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setDevice("mobile")}><Smartphone className="h-4 w-4" /> Móvil</Button>
                  <Button asChild variant="ghost" size="sm"><a href={`/store/${storeSlug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Guarda para ver tus cambios reflejados aquí.</p>
              <div className="flex justify-center overflow-hidden rounded-2xl border bg-muted/30 p-4">
                <iframe
                  key={previewKey}
                  src={`/store/${storeSlug}`}
                  title="Vista previa de la tienda"
                  className={cn("h-[600px] rounded-xl border bg-background shadow-lg transition-all", device === "mobile" ? "w-[390px]" : "w-full")}
                />
              </div>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="profile">
          <Card><CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>Verificación</Label>
                <p className="text-xs text-muted-foreground">El badge azul lo otorga la plataforma. {profile?.verified ? "Tu tienda está verificada ✅" : "Aún no verificada."}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Dirección (texto)</Label><Input value={p.addressText} onChange={(e) => setP({ ...p, addressText: e.target.value })} placeholder="CDMX, México" /></div>
              <div className="space-y-1.5"><Label>Horario (texto)</Label><Input value={p.hoursText} onChange={(e) => setP({ ...p, hoursText: e.target.value })} placeholder="Lun–Sáb 9:00–18:00" /></div>
            </div>
            <div className="space-y-1.5"><Label>Instagram (URL)</Label><Input value={p.instagramUrl} onChange={(e) => setP({ ...p, instagramUrl: e.target.value })} placeholder="https://instagram.com/tutienda" /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Seguidores IG</Label><Input type="number" value={p.instagramFollowers} onChange={(e) => setP({ ...p, instagramFollowers: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Seguidores FB</Label><Input type="number" value={p.facebookFollowers} onChange={(e) => setP({ ...p, facebookFollowers: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Seguidores TikTok</Label><Input type="number" value={p.tiktokFollowers} onChange={(e) => setP({ ...p, tiktokFollowers: e.target.value })} /></div>
            </div>
          </CardContent></Card>

          <Card className="mt-4"><CardContent className="space-y-3 p-5">
            <Label>Métodos de pago aceptados</Label>
            <p className="text-xs text-muted-foreground">Se muestran en el checkout con sus instrucciones.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_PRESETS.map((pp) => {
                const on = payKeys.includes(pp.key);
                return (
                  <button
                    key={pp.key}
                    type="button"
                    onClick={() => setPayKeys((k) => on ? k.filter((x) => x !== pp.key) : [...k, pp.key])}
                    className={cn("flex items-center gap-2 rounded-xl border p-3 text-left text-sm", on && "ring-2 ring-primary")}
                  >
                    <span>{pp.emoji}</span>
                    <span className="flex-1">{pp.label}</span>
                    {on && <span className="text-xs font-medium text-primary">Activo</span>}
                  </button>
                );
              })}
            </div>
          </CardContent></Card>

          <Card className="mt-4"><CardContent className="space-y-3 p-5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={p.promoEnabled} onChange={(e) => setP({ ...p, promoEnabled: e.target.checked })} />
              Mostrar popup promocional en la tienda
            </label>
            {p.promoEnabled && (
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Título</Label><Input value={p.promoTitle} onChange={(e) => setP({ ...p, promoTitle: e.target.value })} placeholder="🎉 2x1 esta semana" /></div>
                <div className="space-y-1.5"><Label>Texto</Label><Textarea value={p.promoText} onChange={(e) => setP({ ...p, promoText: e.target.value })} placeholder="Aprovecha nuestra promo de bienvenida." /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label>Texto del botón</Label><Input value={p.promoCtaLabel} onChange={(e) => setP({ ...p, promoCtaLabel: e.target.value })} placeholder="Ver productos" /></div>
                  <div className="space-y-1.5"><Label>Link del botón (opcional)</Label><Input value={p.promoCtaUrl} onChange={(e) => setP({ ...p, promoCtaUrl: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label>Imagen (URL, opcional)</Label><Input value={p.promoImageUrl} onChange={(e) => setP({ ...p, promoImageUrl: e.target.value })} /></div>
              </div>
            )}
          </CardContent></Card>

          <Button variant="brand" className="mt-4" onClick={saveProfile} disabled={savingProfile}>{savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar perfil</Button>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card><CardContent className="space-y-4 p-5">
            <div className="space-y-1.5"><Label>Número de WhatsApp (con código de país)</Label><Input value={wa.phone} onChange={(e) => setWa({ ...wa, phone: e.target.value })} placeholder="5215512345678" /></div>
            <div className="space-y-1.5"><Label>Nombre para mostrar</Label><Input value={wa.displayName} onChange={(e) => setWa({ ...wa, displayName: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={wa.notifyCustomer} onChange={(e) => setWa({ ...wa, notifyCustomer: e.target.checked })} /> Notificar también al cliente</label>

            {/* connection mode */}
            <div className="space-y-2 border-t pt-4">
              <Label>Conexión</Label>
              <p className="text-xs text-muted-foreground">Cómo envía y recibe mensajes tu tienda.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { v: "link", t: "Enlace wa.me", d: "Sin automatización. Abre WhatsApp con el pedido prellenado." },
                  { v: "cloud", t: "API oficial (Cloud)", d: "Recomendado para producción. Requiere aprobación de Meta." },
                  { v: "qr", t: "QR (WhatsApp Web)", d: "Conecta por QR sin API. No oficial: riesgo de baneo." },
                ].map((m) => (
                  <button key={m.v} type="button" onClick={() => setWa({ ...wa, mode: m.v })}
                    className={cn("rounded-xl border p-3 text-left", wa.mode === m.v && "ring-2 ring-primary")}>
                    <span className="block text-sm font-medium">{m.t}</span>
                    <span className="block text-[11px] text-muted-foreground">{m.d}</span>
                  </button>
                ))}
              </div>

              {wa.mode === "qr" && (
                <div className="mt-2 space-y-3 rounded-xl border border-dashed p-4">
                  <p className="text-xs text-muted-foreground">
                    Despliega el <code className="rounded bg-muted px-1">bridge</code> (carpeta del proyecto) en un servicio always-on (Railway/Render/VPS) y pega aquí su URL y token.
                  </p>
                  {storeId && (
                    <div className="space-y-1"><Label className="text-xs">STORE_ID (cópialo al bridge)</Label>
                      <Input readOnly value={storeId} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
                    </div>
                  )}
                  <div className="space-y-1"><Label className="text-xs">URL del bridge</Label>
                    <Input value={wa.bridgeUrl} onChange={(e) => setWa({ ...wa, bridgeUrl: e.target.value })} placeholder="https://mi-bridge.up.railway.app" />
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Token del bridge (BRIDGE_TOKEN)</Label>
                    <Input value={wa.bridgeToken} onChange={(e) => setWa({ ...wa, bridgeToken: e.target.value })} placeholder="secreto-compartido" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={async () => { await saveWa(); setQrPolling(true); }}>
                      Guardar y conectar
                    </Button>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                      qr?.status === "connected" ? "bg-emerald-100 text-emerald-700" :
                      qr?.status === "qr" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>
                      {qr?.status === "connected" ? "Conectado ✅" : qr?.status === "qr" ? "Escanea el QR" : qr?.status === "error" ? "Bridge no responde" : "Desconectado"}
                    </span>
                  </div>
                  {qr?.qr && qr.status === "qr" && (
                    <div className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr.qr} alt="QR de WhatsApp" className="h-52 w-52 rounded-lg border bg-white p-2" />
                      <p className="text-xs text-muted-foreground">WhatsApp → Dispositivos vinculados → Vincular un dispositivo</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Plantillas de mensajes por estado del pedido</Label>
              <p className="text-xs text-muted-foreground">
                Personaliza el mensaje que envías al cliente. Variables disponibles:{" "}
                {TEMPLATE_VARIABLES.map((v) => <code key={v} className="mx-0.5 rounded bg-muted px-1">{v}</code>)}.
                Deja vacío para usar el mensaje por defecto.
              </p>
              {DEFAULT_TEMPLATE_LABELS.map((t) => (
                <div key={t.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t.label}</Label>
                  <Textarea
                    rows={2}
                    value={templates[t.key] ?? ""}
                    onChange={(e) => setTemplates((prev) => ({ ...prev, [t.key]: e.target.value }))}
                    placeholder="Ej: Hola {cliente}, tu pedido {pedido} en {tienda} está listo 🎉"
                  />
                </div>
              ))}
            </div>

            <Button variant="brand" onClick={saveWa} disabled={savingWa}>{savingWa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card><CardContent className="space-y-4 p-5">
            <div className="space-y-1.5"><Label>Título SEO</Label><Input value={s.seoTitle ?? ""} onChange={(e) => setS({ ...s, seoTitle: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Descripción SEO</Label><Textarea value={s.seoDescription ?? ""} onChange={(e) => setS({ ...s, seoDescription: e.target.value })} /></div>
            <Button variant="brand" onClick={saveStore} disabled={savingStore}>{savingStore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
