"use client";
import * as React from "react";
import { Inbox as InboxIcon, Send, Sparkles, Loader2, MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Conv {
  id: string;
  channel: string;
  customerName: string | null;
  customerHandle: string;
  status: string;
  lastMessageAt: string;
  preview: string;
}
interface Msg { id: string; direction: string; text: string; createdAt: string }

export function InboxView({ conversations, aiEnabled }: { conversations: Conv[]; aiEnabled: boolean }) {
  const { toast } = useToast();
  const [active, setActive] = React.useState<Conv | null>(conversations[0] ?? null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(false);

  const loadThread = React.useCallback(async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/inbox?conversationId=${id}`);
    const json = await res.json().catch(() => null);
    setLoading(false);
    setMessages(json?.data?.messages ?? []);
  }, []);

  React.useEffect(() => { if (active) loadThread(active.id); }, [active, loadThread]);

  async function send() {
    if (!text.trim() || !active) return;
    const body = text;
    setText("");
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, direction: "OUT", text: body, createdAt: new Date().toISOString() }]);
    const res = await fetch("/api/inbox", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: active.id, text: body }),
    });
    if (!res.ok) { toast({ variant: "destructive", title: "No se pudo enviar" }); return; }
    const json = await res.json();
    if (!json?.data?.delivered) toast({ title: "Guardado", description: "Conecta WhatsApp Cloud API para enviar automáticamente." });
  }

  async function suggest() {
    if (!active) return;
    setAiBusy(true);
    const res = await fetch("/api/inbox/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: active.id }),
    });
    const json = await res.json().catch(() => null);
    setAiBusy(false);
    if (json?.data?.reply) setText(json.data.reply);
    else toast({ title: "IA no disponible", description: "Agrega OPENAI_API_KEY para sugerencias." });
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><InboxIcon className="h-6 w-6" /> Inbox</h1>
        <Card><CardContent className="py-16">
          <EmptyState icon={InboxIcon} title="Aún no hay conversaciones" description="Cuando un cliente te escriba por WhatsApp (con la Cloud API conectada) o Instagram, sus mensajes aparecerán aquí." />
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><InboxIcon className="h-6 w-6" /> Inbox</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* list */}
        <Card><CardContent className="max-h-[70vh] overflow-y-auto p-0">
          <div className="divide-y">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setActive(c)} className={cn("flex w-full items-start gap-2 p-3 text-left hover:bg-muted/50", active?.id === c.id && "bg-muted")}>
                {c.channel === "INSTAGRAM" ? <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" /> : <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.customerName || c.customerHandle}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent></Card>

        {/* thread */}
        <Card><CardContent className="flex h-[70vh] flex-col p-0">
          {active ? (
            <>
              <div className="border-b p-3">
                <p className="text-sm font-semibold">{active.customerName || active.customerHandle}</p>
                <p className="text-xs text-muted-foreground">{active.channel === "INSTAGRAM" ? "Instagram" : "WhatsApp"} · {active.customerHandle}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-3">
                {loading && <p className="text-center text-xs text-muted-foreground">Cargando…</p>}
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.direction === "OUT" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm", m.direction === "OUT" ? "bg-[#DCF8C6] text-slate-900" : "bg-white text-slate-900")}>{m.text}</div>
                  </div>
                ))}
                {!loading && messages.length === 0 && <p className="text-center text-xs text-muted-foreground">Sin mensajes aún.</p>}
              </div>
              <div className="space-y-2 border-t p-2">
                {aiEnabled && (
                  <Button variant="outline" size="sm" onClick={suggest} disabled={aiBusy}>
                    {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Sugerir respuesta con IA
                  </Button>
                )}
                <div className="flex gap-2">
                  <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escribe una respuesta…" />
                  <Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Selecciona una conversación</div>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
