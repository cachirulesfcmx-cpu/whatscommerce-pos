import type { FlowGraph, FlowNode, ActionKind } from "@/lib/chatbot/types";

export interface FlowState {
  nodeId: string | null;
  awaiting: "none" | "options" | "ai";
}

export interface RunContext {
  /** Generate an AI reply for an `ai` node. */
  ai?: (instructions: string, message: string) => Promise<string>;
  /** Perform an `action` node side effect. */
  onAction?: (action: ActionKind, text: string | undefined) => Promise<void>;
}

export interface RunResult {
  replies: string[];
  state: FlowState;
  /** true → conversation handed to a human; bot should stop. */
  ended: boolean;
}

function matchesKeyword(keyword: string | undefined, text: string): boolean {
  const kws = (keyword || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const lu = text.toLowerCase();
  return kws.some((k) => lu.includes(k));
}

function matchOption(node: FlowNode, text: string): number {
  const opts = node.options ?? [];
  const lu = text.trim().toLowerCase();
  // numeric pick ("1", "2"…)
  const num = parseInt(lu, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= opts.length) return num - 1;
  // label match
  const exact = opts.findIndex((o) => o.label.trim().toLowerCase() === lu);
  if (exact >= 0) return exact;
  return opts.findIndex((o) => lu.includes(o.label.trim().toLowerCase()) || o.label.trim().toLowerCase().includes(lu));
}

function numberedOptions(node: FlowNode): string {
  return (node.options ?? []).map((o, i) => `${i + 1}. ${o.label}`).join("\n");
}

/**
 * Run the published flow for one inbound message.
 * `prevState` is null for a brand-new conversation.
 */
export async function runFlow(
  graph: FlowGraph,
  prevState: FlowState | null,
  userText: string,
  ctx: RunContext = {}
): Promise<RunResult> {
  const byId = (id: string | null) => graph.nodes.find((n) => n.id === id) || null;
  const next = (id: string, handle = "out") =>
    graph.edges.find((e) => e.source === id && (e.sourceHandle ?? "out") === handle)?.target ?? null;

  const replies: string[] = [];
  let cur: string | null = null;

  // resume points
  if (!prevState) {
    const startNode = graph.nodes.find((n) => n.type === "start") ?? graph.nodes[0];
    cur = startNode?.id ?? null;
  } else if (prevState.awaiting === "options") {
    const node = byId(prevState.nodeId);
    if (!node) return { replies, state: { nodeId: null, awaiting: "none" }, ended: true };
    const idx = matchOption(node, userText);
    if (idx < 0) {
      replies.push(`${node.text || "Elige una opción:"}\n${numberedOptions(node)}`);
      return { replies, state: prevState, ended: false };
    }
    cur = next(node.id, `opt-${idx}`);
  } else if (prevState.awaiting === "ai") {
    const node = byId(prevState.nodeId);
    const reply = ctx.ai ? await ctx.ai(node?.text ?? "", userText) : "";
    if (reply) replies.push(reply);
    cur = node ? next(node.id, "out") : null;
  } else {
    cur = prevState.nodeId ? next(prevState.nodeId, "out") : null;
  }

  let guard = 0;
  while (cur && guard++ < 100) {
    const n = byId(cur);
    if (!n) break;
    if (n.type === "start") { cur = next(n.id, "out"); continue; }
    if (n.type === "message") { if (n.text) replies.push(n.text); cur = next(n.id, "out"); continue; }
    if (n.type === "condition") { cur = next(n.id, matchesKeyword(n.keyword, userText) ? "yes" : "no"); continue; }
    if (n.type === "action") {
      await ctx.onAction?.(n.action ?? "tag", n.text);
      if (n.action === "close") return { replies, state: { nodeId: n.id, awaiting: "none" }, ended: true };
      cur = next(n.id, "out"); continue;
    }
    if (n.type === "options") {
      replies.push(`${n.text || "¿En qué te ayudo?"}\n${numberedOptions(n)}`);
      return { replies, state: { nodeId: n.id, awaiting: "options" }, ended: false };
    }
    if (n.type === "ai") {
      if (replies.length === 0) replies.push("Cuéntame, ¿en qué te ayudo? 🙂");
      return { replies, state: { nodeId: n.id, awaiting: "ai" }, ended: false };
    }
    if (n.type === "handoff") { if (n.text) replies.push(n.text); return { replies, state: { nodeId: n.id, awaiting: "none" }, ended: true }; }
    break;
  }

  return { replies, state: { nodeId: cur, awaiting: "none" }, ended: true };
}
