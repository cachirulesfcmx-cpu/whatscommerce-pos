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
import { TEMPLATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TEMPLATE_VARIABLES, DEFAULT_TEMPLATE_LABELS } from "@/lib/whatsapp/customer-messages";
import { ThemePreview } from "@/components/dashboard/theme-preview";
import { LOCALES } from "@/lib/i18n";

export function SettingsPanel({
  defaultTab = "general", store, whatsapp, storeSlug,
}: {
  defaultTab?: string;
  storeSlug?: string;
  store: { name: string; description: string | null; logoUrl: string | null; bannerUrl: string | null; primaryColor: string; templateKey: string; locale?: string | null; seoTitle: string | null; seoDescription: string | null };
  whatsapp: { phone: string | null; displayName: string | null; notifyCustomer: boolean; templates?: Record<string, string> };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [savingStore, setSavingStore] = React.useState(false);
  const [savingWa, setSavingWa] = React.useState(false);
  const [device, setDevice] = React.useState<"mobile" | "desktop">("desktop");
  const [previewKey, setPreviewKey] = React.useState(0);
  const [s, setS] = React.useState(store);
  const [wa, setWa] = React.useState({ phone: whatsapp.phone ?? "", displayName: whatsapp.displayName ?? "", notifyCustomer: whatsapp.notifyCustomer });
  const [templates, setTemplates] = React.useState<Record<string, string>>(whatsapp.templates ?? {});

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
      body: JSON.stringify({ phone: wa.phone, displayName: wa.displayName, language: "es", notifyCustomer: wa.notifyCustomer, templates }),
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

        <TabsContent value="whatsapp">
          <Card><CardContent className="space-y-4 p-5">
            <div className="space-y-1.5"><Label>Número de WhatsApp (con código de país)</Label><Input value={wa.phone} onChange={(e) => setWa({ ...wa, phone: e.target.value })} placeholder="5215512345678" /></div>
            <div className="space-y-1.5"><Label>Nombre para mostrar</Label><Input value={wa.displayName} onChange={(e) => setWa({ ...wa, displayName: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={wa.notifyCustomer} onChange={(e) => setWa({ ...wa, notifyCustomer: e.target.checked })} /> Notificar también al cliente</label>

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
