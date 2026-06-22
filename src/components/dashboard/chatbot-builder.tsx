"use client";
import * as React from "react";
import {
  Bot, MessageSquare, ListChecks, Sparkles, GitBranch, UserRound, Flag,
  Save, Rocket, Loader2, Trash2, Plus, Send, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  NODE_LABELS, NODE_HINTS, newNode, outHandles,
  type FlowGraph, type FlowNode, type FlowEdge, type NodeType,
} from "@/lib/chatbot/types";

const NODE_W = 210;
const NODE_H = 76;

const META: Record<NodeType, { icon: typeof Bot; color: string }> = {
  start: { icon: Flag, color: "#0ea5e9" },
  message: { icon: MessageSquare, color: "#16a34a" },
  options: { icon: ListChecks, color: "#7c3aed" },
  ai: { icon: Sparkles, color: "#d97706" },
  condition: { icon: GitBranch, color: "#dc2626" },
  handoff: { icon: UserRound, color: "#475569" },
};

const ADDABLE: NodeType[] = ["message", "options", "ai", "condition", "handoff"];

function inputAnchor(n: FlowNode) {
  return { x: n.x + NODE_W / 2, y: n.y };
}
function outputAnchor(n: FlowNode, handleId: string) {
  const hs = outHandles(n);
  const idx = Math.max(0, hs.findIndex((h) => h.id === handleId));
  const k = hs.length || 1;
  return { x: n.x + (NODE_W * (idx + 1)) / (k + 1), y: n.y + NODE_H };
}

export function ChatbotBuilder({ initialGraph, initialStatus }: { initialGraph: FlowGraph; initialStatus: string }) {
  const { toast } = useToast();
  const [nodes, setNodes] = React.useState<FlowNode[]>(initialGraph.nodes);
  const [edges, setEdges] = React.useState<FlowEdge[]>(initialGraph.edges);
  const [status, setStatus] = React.useState(initialStatus);
  const [saving, setSaving] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [connecting, setConnecting] = React.useState<{ source: string; handle: string } | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ id: string; offX: number; offY: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const byId = React.useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);

  /* ── node dragging ── */
  React.useEffect(() => {
    if (!dragging) return;
    function move(e: PointerEvent) {
      const d = drag.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!d || !rect) return;
      const x = e.clientX - rect.left + (canvasRef.current?.scrollLeft ?? 0) - d.offX;
      const y = e.clientY - rect.top + (canvasRef.current?.scrollTop ?? 0) - d.offY;
      setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n)));
    }
    function up() { drag.current = null; setDragging(false); }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [dragging]);

  function startDrag(e: React.PointerEvent, n: FlowNode) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = {
      id: n.id,
      offX: e.clientX - rect.left + (canvasRef.current?.scrollLeft ?? 0) - n.x,
      offY: e.clientY - rect.top + (canvasRef.current?.scrollTop ?? 0) - n.y,
    };
    setSelected(n.id);
    setDragging(true);
  }

  /* ── connections ── */
  function clickOutput(nodeId: string, handle: string) {
    setConnecting((c) => (c && c.source === nodeId && c.handle === handle ? null : { source: nodeId, handle }));
  }
  function clickInput(targetId: string) {
    if (!connecting) return;
    if (connecting.source === targetId) { setConnecting(null); return; }
    setEdges((es) => {
      const filtered = es.filter((e) => !(e.source === connecting.source && (e.sourceHandle ?? "out") === connecting.handle));
      return [...filtered, { id: `e${Date.now().toString(36)}`, source: connecting.source, target: targetId, sourceHandle: connecting.handle }];
    });
    setConnecting(null);
  }

  function addNode(type: NodeType) {
    const n = newNode(type, 120 + Math.random() * 120, 120 + Math.random() * 120);
    setNodes((ns) => [...ns, n]);
    setSelected(n.id);
  }
  function deleteNode(id: string) {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    setSelected(null);
  }
  function updateNode(id: string, patch: Partial<FlowNode>) {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  async function save(publish?: boolean) {
    setSaving(true);
    const newStatus = publish ? "PUBLISHED" : status;
    const res = await fetch("/api/chatbot", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graph: { nodes, edges }, status: newStatus }),
    });
    setSaving(false);
    if (!res.ok) { toast({ variant: "destructive", title: "No se pudo guardar" }); return; }
    setStatus(newStatus);
    toast({ variant: "success", title: publish ? "Chatbot publicado 🚀" : "Guardado" });
  }

  const sel = selected ? byId(selected) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Bot className="h-6 w-6" /> Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Diseña el flujo arrastrando nodos y conectándolos.{" "}
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

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Agregar:</span>
        {ADDABLE.map((t) => {
          const Icon = META[t].icon;
          return <Button key={t} variant="outline" size="sm" onClick={() => addNode(t)}><Icon className="h-4 w-4" style={{ color: META[t].color }} /> {NODE_LABELS[t]}</Button>;
        })}
        {connecting && (
          <span className="ml-2 flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
            Conectando… haz clic en el nodo destino
            <button onClick={() => setConnecting(null)}><X className="h-3 w-3" /></button>
          </span>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* canvas */}
        <Card>
          <CardContent className="p-0">
            <div
              ref={canvasRef}
              onClick={(e) => { if (e.target === e.currentTarget) { setSelected(null); setConnecting(null); } }}
              className="relative h-[560px] w-full overflow-auto rounded-xl"
              style={{ background: "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            >
              <div className="relative" style={{ width: 2200, height: 1500 }} onClick={(e) => { if (e.target === e.currentTarget) { setSelected(null); setConnecting(null); } }}>
                {/* edges */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                  {edges.map((e) => {
                    const s = byId(e.source); const t = byId(e.target);
                    if (!s || !t) return null;
                    const a = outputAnchor(s, e.sourceHandle ?? "out");
                    const b = inputAnchor(t);
                    const d = `M ${a.x} ${a.y} C ${a.x} ${a.y + 50}, ${b.x} ${b.y - 50}, ${b.x} ${b.y}`;
                    return (
                      <g key={e.id}>
                        <path d={d} fill="none" stroke="#94a3b8" strokeWidth={2} />
                        <path d={d} fill="none" stroke="transparent" strokeWidth={14} className="pointer-events-auto cursor-pointer"
                          onClick={() => setEdges((es) => es.filter((x) => x.id !== e.id))}>
                          <title>Clic para borrar conexión</title>
                        </path>
                      </g>
                    );
                  })}
                </svg>

                {/* nodes */}
                {nodes.map((n) => {
                  const Icon = META[n.type].icon;
                  const hs = outHandles(n);
                  return (
                    <div
                      key={n.id}
                      className={cn("absolute select-none rounded-xl border bg-card shadow-sm", selected === n.id ? "ring-2 ring-primary" : "")}
                      style={{ left: n.x, top: n.y, width: NODE_W, minHeight: NODE_H }}
                      onClick={(e) => { e.stopPropagation(); setSelected(n.id); }}
                    >
                      {/* input handle */}
                      {n.type !== "start" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); clickInput(n.id); }}
                          className={cn("absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background", connecting ? "bg-sky-500 ring-2 ring-sky-300" : "bg-slate-400")}
                          aria-label="Entrada"
                        />
                      )}
                      {/* header (drag) */}
                      <div
                        onPointerDown={(e) => startDrag(e, n)}
                        className="flex cursor-grab items-center gap-2 rounded-t-xl px-3 py-2 text-xs font-semibold text-white active:cursor-grabbing"
                        style={{ background: META[n.type].color }}
                      >
                        <Icon className="h-3.5 w-3.5" /> {NODE_LABELS[n.type]}
                      </div>
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        <p className="line-clamp-2">{n.type === "condition" ? `Si contiene: ${n.keyword || "…"}` : (n.text || "…")}</p>
                      </div>
                      {/* output handles */}
                      {hs.map((h, i) => {
                        const left = (NODE_W * (i + 1)) / (hs.length + 1);
                        const isActive = connecting?.source === n.id && connecting.handle === h.id;
                        return (
                          <button
                            key={h.id}
                            onClick={(e) => { e.stopPropagation(); clickOutput(n.id, h.id); }}
                            className={cn("absolute bottom-0 flex -translate-x-1/2 translate-y-1/2 flex-col items-center", "")}
                            style={{ left }}
                            title={h.label || "Salida"}
                          >
                            <span className={cn("h-3 w-3 rounded-full border-2 border-background", isActive ? "bg-sky-500 ring-2 ring-sky-300" : "bg-slate-500")} />
                            {h.label && <span className="mt-0.5 max-w-[70px] truncate rounded bg-muted px-1 text-[9px] text-muted-foreground">{h.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* inspector + simulator */}
        <div className="space-y-4">
          {sel ? (
            <Card><CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{NODE_LABELS[sel.type]}</span>
                {sel.type !== "start" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNode(sel.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
              <p className="text-xs text-muted-foreground">{NODE_HINTS[sel.type]}</p>

              {(sel.type === "message" || sel.type === "ai" || sel.type === "handoff" || sel.type === "options") && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{sel.type === "ai" ? "Instrucciones para la IA" : "Texto"}</Label>
                  <Textarea rows={sel.type === "ai" ? 4 : 2} value={sel.text ?? ""} onChange={(e) => updateNode(sel.id, { text: e.target.value })} />
                </div>
              )}

              {sel.type === "condition" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Palabras clave (separadas por coma)</Label>
                  <Input value={sel.keyword ?? ""} onChange={(e) => updateNode(sel.id, { keyword: e.target.value })} placeholder="precio, costo, cuánto" />
                  <p className="text-[11px] text-muted-foreground">Si el mensaje del cliente contiene alguna, sigue la rama “Sí”.</p>
                </div>
              )}

              {sel.type === "options" && (
                <div className="space-y-2">
                  <Label className="text-xs">Opciones (cada una es una rama)</Label>
                  {(sel.options ?? []).map((o, oi) => (
                    <div key={oi} className="flex gap-2">
                      <Input value={o.label} onChange={(e) => updateNode(sel.id, { options: (sel.options ?? []).map((x, xi) => xi === oi ? { label: e.target.value } : x) })} />
                      <Button variant="ghost" size="icon" onClick={() => updateNode(sel.id, { options: (sel.options ?? []).filter((_, xi) => xi !== oi) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateNode(sel.id, { options: [...(sel.options ?? []), { label: "Nueva opción" }] })}><Plus className="h-4 w-4" /> Opción</Button>
                </div>
              )}
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-4 text-xs text-muted-foreground">
              Selecciona un nodo para editarlo. Para conectar: haz clic en el punto de salida (abajo) y luego en el punto de entrada (arriba) de otro nodo. Clic en una conexión para borrarla.
            </CardContent></Card>
          )}

          <Simulator nodes={nodes} edges={edges} />
        </div>
      </div>
    </div>
  );
}

/* ── Live simulator that walks the node graph ── */
type LogItem = { from: "bot" | "user"; text: string; options?: { label: string; i: number }[] };

function Simulator({ nodes, edges }: { nodes: FlowNode[]; edges: FlowEdge[] }) {
  const [log, setLog] = React.useState<LogItem[]>([]);
  const [awaiting, setAwaiting] = React.useState<"none" | "options" | "ai">("none");
  const [ctxId, setCtxId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const lastUser = React.useRef("");

  const byId = (id: string | null) => nodes.find((n) => n.id === id) || null;
  const next = (id: string, handle = "out") =>
    edges.find((e) => e.source === id && (e.sourceHandle ?? "out") === handle)?.target ?? null;

  const append = (item: LogItem) => setLog((l) => [...l, item]);

  function processFrom(startId: string | null) {
    let cur = startId;
    let guard = 0;
    while (cur && guard++ < 100) {
      const n = byId(cur);
      if (!n) break;
      if (n.type === "start") { cur = next(n.id, "out"); continue; }
      if (n.type === "message") { append({ from: "bot", text: n.text || "" }); cur = next(n.id, "out"); continue; }
      if (n.type === "handoff") { append({ from: "bot", text: n.text || "Un humano continuará." }); setAwaiting("none"); return; }
      if (n.type === "condition") {
        const lu = lastUser.current.toLowerCase();
        const kws = (n.keyword || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const hit = kws.some((k) => lu.includes(k));
        cur = next(n.id, hit ? "yes" : "no"); continue;
      }
      if (n.type === "options") {
        append({ from: "bot", text: n.text || "", options: (n.options ?? []).map((o, i) => ({ label: o.label, i })) });
        setAwaiting("options"); setCtxId(n.id); return;
      }
      if (n.type === "ai") { setAwaiting("ai"); setCtxId(n.id); append({ from: "bot", text: "Escríbeme tu pregunta 👇" }); return; }
      break;
    }
    setAwaiting("none");
  }

  function start() {
    setLog([]); setAwaiting("none"); setCtxId(null); lastUser.current = "";
    const startNode = nodes.find((n) => n.type === "start") ?? nodes[0];
    setTimeout(() => processFrom(startNode?.id ?? null), 30);
  }

  function choose(i: number, label: string) {
    if (awaiting !== "options" || !ctxId) return;
    append({ from: "user", text: label });
    lastUser.current = label;
    const t = next(ctxId, `opt-${i}`);
    setAwaiting("none");
    processFrom(t);
  }

  async function send() {
    if (!input.trim()) return;
    const text = input; setInput("");
    append({ from: "user", text });
    lastUser.current = text;
    if (awaiting === "ai" && ctxId) {
      const aiNode = byId(ctxId);
      setBusy(true);
      const res = await fetch("/api/chatbot/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: aiNode?.text ?? "", message: text }),
      });
      const json = await res.json().catch(() => null);
      setBusy(false);
      append({ from: "bot", text: json?.data?.reply ?? "…" });
      const t = next(ctxId, "out");
      setAwaiting("none");
      processFrom(t);
    }
  }

  const waitingOptions = awaiting === "options";

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b bg-[#075E54] px-4 py-3 text-white">
          <span className="flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4" /> Vista previa</span>
          <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-white/20" onClick={start}>Reiniciar</Button>
        </div>
        <div className="h-[300px] space-y-2 overflow-y-auto bg-[#ECE5DD] p-3 dark:bg-slate-800">
          {log.length === 0 && <p className="mt-20 text-center text-xs text-slate-500">Pulsa “Reiniciar” para probar el flujo.</p>}
          {log.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm shadow", m.from === "user" ? "bg-[#DCF8C6] text-slate-900" : "bg-white text-slate-900")}>
                {m.text}
                {m.options && (
                  <div className="mt-2 flex flex-col gap-1">
                    {m.options.map((o) => (
                      <button key={o.i} onClick={() => choose(o.i, o.label)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50">{o.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <p className="text-center text-xs text-slate-500">La IA está escribiendo…</p>}
        </div>
        <div className="flex gap-2 border-t p-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={waitingOptions ? "Elige una opción arriba…" : "Escribe un mensaje…"} disabled={waitingOptions} />
          <Button size="icon" onClick={send} disabled={busy || waitingOptions}><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
