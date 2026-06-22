"use client";
import * as React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, Bot, MessageSquare, ListChecks, Sparkles, UserRound, Send, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BLOCK_LABELS, BLOCK_HINTS, emptyBlock, type ChatBlock, type ChatGraph, type BlockType } from "@/lib/chatbot/types";

const ICONS: Record<BlockType, typeof MessageSquare> = {
  message: MessageSquare, options: ListChecks, ai: Sparkles, handoff: UserRound,
};

export function ChatbotBuilder({ initialGraph, initialStatus }: { initialGraph: ChatGraph; initialStatus: string }) {
  const { toast } = useToast();
  const [blocks, setBlocks] = React.useState<ChatBlock[]>(initialGraph.blocks ?? []);
  const [status, setStatus] = React.useState(initialStatus);
  const [saving, setSaving] = React.useState(false);

  const update = (id: string, patch: Partial<ChatBlock>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => setBlocks((bs) => bs.filter((b) => b.id !== id));
  const move = (i: number, dir: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const add = (type: BlockType) => setBlocks((bs) => [...bs, emptyBlock(type)]);

  async function save(publish?: boolean) {
    setSaving(true);
    const newStatus = publish ? "PUBLISHED" : status;
    const res = await fetch("/api/chatbot", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graph: { blocks }, status: newStatus }),
    });
    setSaving(false);
    if (!res.ok) { toast({ variant: "destructive", title: "No se pudo guardar" }); return; }
    setStatus(newStatus);
    toast({ variant: "success", title: publish ? "Chatbot publicado 🚀" : "Guardado" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Bot className="h-6 w-6" /> Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Crea tu asistente sin código.{" "}
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
              {status === "PUBLISHED" ? "Publicado" : "Borrador"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</Button>
          <Button variant="brand" onClick={() => save(true)} disabled={saving}><Rocket className="h-4 w-4" /> Publicar</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* editor */}
        <div className="space-y-3">
          {blocks.map((b, i) => {
            const Icon = ICONS[b.type];
            return (
              <Card key={b.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" /> {BLOCK_LABELS[b.type]}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{BLOCK_HINTS[b.type]}</p>
                  <Textarea
                    rows={b.type === "ai" ? 3 : 2}
                    value={b.text ?? ""}
                    onChange={(e) => update(b.id, { text: e.target.value })}
                    placeholder={b.type === "ai" ? "Instrucciones para la IA…" : "Texto del mensaje…"}
                  />
                  {b.type === "options" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Opciones</Label>
                      {(b.options ?? []).map((o, oi) => (
                        <div key={oi} className="flex gap-2">
                          <Input
                            value={o.label}
                            onChange={(e) => update(b.id, { options: (b.options ?? []).map((x, xi) => xi === oi ? { label: e.target.value } : x) })}
                          />
                          <Button variant="ghost" size="icon" onClick={() => update(b.id, { options: (b.options ?? []).filter((_, xi) => xi !== oi) })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => update(b.id, { options: [...(b.options ?? []), { label: "Nueva opción" }] })}><Plus className="h-4 w-4" /> Opción</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex flex-wrap gap-2">
            {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => {
              const Icon = ICONS[t];
              return (
                <Button key={t} variant="outline" size="sm" onClick={() => add(t)}><Icon className="h-4 w-4" /> {BLOCK_LABELS[t]}</Button>
              );
            })}
          </div>
        </div>

        {/* simulator */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ChatSimulator blocks={blocks} />
        </div>
      </div>
    </div>
  );
}

function ChatSimulator({ blocks }: { blocks: ChatBlock[] }) {
  const [log, setLog] = React.useState<{ from: "bot" | "user"; text: string; options?: string[] }[]>([]);
  const [step, setStep] = React.useState(0);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const run = React.useCallback(async (fromStep: number) => {
    let i = fromStep;
    while (i < blocks.length) {
      const b = blocks[i];
      if (b.type === "message") {
        setLog((l) => [...l, { from: "bot", text: b.text ?? "" }]);
        i++;
      } else if (b.type === "handoff") {
        setLog((l) => [...l, { from: "bot", text: b.text ?? "Un humano continuará." }]);
        i++;
      } else if (b.type === "options") {
        setLog((l) => [...l, { from: "bot", text: b.text ?? "", options: (b.options ?? []).map((o) => o.label) }]);
        setStep(i + 1);
        return; // wait for user choice
      } else if (b.type === "ai") {
        setStep(i + 1);
        return; // wait for user question
      }
    }
    setStep(i);
  }, [blocks]);

  function start() {
    setLog([]);
    setStep(0);
    setTimeout(() => run(0), 50);
  }

  async function send() {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setLog((l) => [...l, { from: "user", text }]);
    // if previous block was AI, call the AI preview
    const prev = blocks[step - 1];
    if (prev?.type === "ai") {
      setBusy(true);
      const res = await fetch("/api/chatbot/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: prev.text ?? "", message: text }),
      });
      const json = await res.json().catch(() => null);
      setBusy(false);
      setLog((l) => [...l, { from: "bot", text: json?.data?.reply ?? "…" }]);
    }
    run(step);
  }

  function choose(opt: string) {
    setLog((l) => [...l, { from: "user", text: opt }]);
    run(step);
  }

  const lastOptions = log.length && log[log.length - 1].from === "bot" ? log[log.length - 1].options : undefined;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b bg-[#075E54] px-4 py-3 text-white">
          <span className="flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4" /> Vista previa</span>
          <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-white/20" onClick={start}>Reiniciar</Button>
        </div>
        <div className="h-[360px] space-y-2 overflow-y-auto bg-[#ECE5DD] p-3 dark:bg-slate-800">
          {log.length === 0 && <p className="mt-24 text-center text-xs text-slate-500">Pulsa “Reiniciar” para probar el flujo.</p>}
          {log.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm shadow", m.from === "user" ? "bg-[#DCF8C6] text-slate-900" : "bg-white text-slate-900")}>
                {m.text}
                {m.options && (
                  <div className="mt-2 flex flex-col gap-1">
                    {m.options.map((o) => (
                      <button key={o} onClick={() => choose(o)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50">{o}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <p className="text-center text-xs text-slate-500">La IA está escribiendo…</p>}
        </div>
        <div className="flex gap-2 border-t p-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={lastOptions ? "Elige una opción arriba…" : "Escribe un mensaje…"} />
          <Button size="icon" onClick={send} disabled={busy}><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
