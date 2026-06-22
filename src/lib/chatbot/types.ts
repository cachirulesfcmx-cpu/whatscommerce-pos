/** No-code chatbot flow model. */

/* ── Legacy linear model (kept for backward conversion) ── */
export type BlockType = "message" | "options" | "ai" | "handoff";
export interface ChatBlock {
  id: string;
  type: BlockType;
  text?: string;
  options?: { label: string }[];
}
export interface ChatGraph {
  blocks: ChatBlock[];
}

/* ── Visual node-graph model (canvas) ── */
export type NodeType = "start" | "message" | "options" | "ai" | "condition" | "handoff";

export interface FlowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  text?: string;
  options?: { label: string }[];
  /** condition: keyword(s) to match against the customer's message (comma separated) */
  keyword?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  /** which output handle of the source node: "out" | "opt-<i>" | "yes" | "no" */
  sourceHandle?: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export const NODE_LABELS: Record<NodeType, string> = {
  start: "Inicio",
  message: "Mensaje",
  options: "Mensaje con opciones",
  ai: "Respuesta con IA",
  condition: "Condición",
  handoff: "Transferir a humano",
};

export const NODE_HINTS: Record<NodeType, string> = {
  start: "Punto de entrada de la conversación.",
  message: "Envía un mensaje al cliente.",
  options: "Botones de respuesta; cada opción es una rama.",
  ai: "La IA responde usando estas instrucciones y el catálogo.",
  condition: "Bifurca según palabras del mensaje del cliente.",
  handoff: "Avisa que un humano continuará la conversación.",
};

/** Output handles for a node type (id + label). For options it's per-option. */
export function outHandles(node: FlowNode): { id: string; label: string }[] {
  switch (node.type) {
    case "handoff":
      return [];
    case "options":
      return (node.options ?? []).map((o, i) => ({ id: `opt-${i}`, label: o.label || `Opción ${i + 1}` }));
    case "condition":
      return [{ id: "yes", label: "Sí" }, { id: "no", label: "No" }];
    default:
      return [{ id: "out", label: "" }];
  }
}

let _n = 0;
function nid() {
  _n += 1;
  return `n${Date.now().toString(36)}${_n}`;
}

export function newNode(type: NodeType, x: number, y: number): FlowNode {
  const base: FlowNode = { id: nid(), type, x, y };
  if (type === "message") base.text = "Escribe tu mensaje…";
  if (type === "options") { base.text = "¿En qué te ayudo?"; base.options = [{ label: "Ver productos" }, { label: "Hacer un pedido" }]; }
  if (type === "ai") base.text = "Responde dudas de productos, precios y entregas de forma breve y amable.";
  if (type === "condition") base.keyword = "precio, costo, cuánto";
  if (type === "handoff") base.text = "¡Gracias! Un miembro del equipo continuará contigo. 🙌";
  return base;
}

export function defaultFlowGraph(): FlowGraph {
  const start: FlowNode = { id: "start", type: "start", x: 80, y: 60, text: "Inicio" };
  const welcome: FlowNode = { id: "welcome", type: "message", x: 80, y: 200, text: "¡Hola! 👋 Soy el asistente de la tienda." };
  const menu: FlowNode = {
    id: "menu", type: "options", x: 80, y: 360, text: "¿Qué te gustaría hacer?",
    options: [{ label: "Ver productos" }, { label: "Hacer un pedido" }, { label: "Hablar con alguien" }],
  };
  const ai: FlowNode = { id: "ai", type: "ai", x: 380, y: 520, text: "Responde dudas de productos y precios de forma breve y amable." };
  const handoff: FlowNode = { id: "handoff", type: "handoff", x: 80, y: 520, text: "Un miembro del equipo continuará contigo. 🙌" };
  return {
    nodes: [start, welcome, menu, ai, handoff],
    edges: [
      { id: "e1", source: "start", target: "welcome", sourceHandle: "out" },
      { id: "e2", source: "welcome", target: "menu", sourceHandle: "out" },
      { id: "e3", source: "menu", target: "ai", sourceHandle: "opt-0" },
      { id: "e4", source: "menu", target: "ai", sourceHandle: "opt-1" },
      { id: "e5", source: "menu", target: "handoff", sourceHandle: "opt-2" },
    ],
  };
}

/** Accept old (blocks) or new (nodes/edges) shapes and return a FlowGraph. */
export function toFlowGraph(raw: unknown): FlowGraph {
  const g = raw as Partial<FlowGraph> & Partial<ChatGraph>;
  if (g && Array.isArray(g.nodes) && g.nodes.length > 0) {
    return { nodes: g.nodes, edges: Array.isArray(g.edges) ? g.edges : [] };
  }
  // convert legacy linear blocks → vertical chain with edges
  if (g && Array.isArray(g.blocks) && g.blocks.length > 0) {
    const nodes: FlowNode[] = [{ id: "start", type: "start", x: 80, y: 40, text: "Inicio" }];
    const edges: FlowEdge[] = [];
    let prev = "start";
    let y = 180;
    for (const b of g.blocks) {
      const node: FlowNode = { id: b.id || nid(), type: b.type, x: 80, y, text: b.text, options: b.options };
      nodes.push(node);
      edges.push({ id: nid(), source: prev, target: node.id, sourceHandle: "out" });
      prev = node.id;
      y += 150;
    }
    return { nodes, edges };
  }
  return defaultFlowGraph();
}
