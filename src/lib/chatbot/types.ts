/** No-code chatbot flow model (block-based). */
export type BlockType = "message" | "options" | "ai" | "handoff";

export interface ChatBlock {
  id: string;
  type: BlockType;
  /** message / ai prompt text or instructions */
  text?: string;
  /** options block choices */
  options?: { label: string }[];
}

export interface ChatGraph {
  blocks: ChatBlock[];
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  message: "Mensaje",
  options: "Mensaje con opciones",
  ai: "Respuesta con IA",
  handoff: "Transferir a humano",
};

export const BLOCK_HINTS: Record<BlockType, string> = {
  message: "Envía un mensaje al cliente.",
  options: "Ofrece botones de respuesta predefinidos.",
  ai: "La IA responde usando estas instrucciones y el catálogo.",
  handoff: "Avisa que un humano continuará la conversación.",
};

export function emptyBlock(type: BlockType): ChatBlock {
  const id = Math.random().toString(36).slice(2, 9);
  if (type === "options") {
    return { id, type, text: "¿En qué te ayudo?", options: [{ label: "Ver catálogo" }, { label: "Hacer un pedido" }] };
  }
  if (type === "ai") {
    return { id, type, text: "Eres el asistente de la tienda. Responde dudas de productos, precios y horarios de forma breve y amable." };
  }
  if (type === "handoff") {
    return { id, type, text: "¡Gracias! Un miembro del equipo continuará contigo en breve. 🙌" };
  }
  return { id, type, text: "¡Hola! 👋 Bienvenido a nuestra tienda." };
}

export function defaultGraph(): ChatGraph {
  return {
    blocks: [
      { id: "welcome", type: "message", text: "¡Hola! 👋 Soy el asistente de la tienda." },
      {
        id: "menu", type: "options", text: "¿Qué te gustaría hacer?",
        options: [{ label: "Ver productos" }, { label: "Hacer un pedido" }, { label: "Hablar con alguien" }],
      },
      { id: "assist", type: "ai", text: "Responde dudas de productos, precios y entregas de forma breve y amable. Si no sabes algo, ofrece transferir con una persona." },
    ],
  };
}
