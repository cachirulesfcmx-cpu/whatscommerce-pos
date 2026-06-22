import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { ChatbotBuilder } from "@/components/dashboard/chatbot-builder";
import { toFlowGraph } from "@/lib/chatbot/types";

export const metadata = { title: "Chatbot" };
export const dynamic = "force-dynamic";

export default async function ChatbotPage() {
  const { store, plan } = await getDashboardContext();
  if (!plan.features.whatsappAutomation) {
    return (
      <FeatureGate
        title="Chatbot con IA"
        description="Crea un asistente de WhatsApp sin código con bloques de mensajes, opciones e IA. Disponible en el plan Pro."
      />
    );
  }

  const flow = await prisma.chatFlow.findFirst({ where: { storeId: store.id, isDefault: true } });
  const graph = toFlowGraph(flow?.graph ?? null);
  const status = flow?.status ?? "DRAFT";

  return <ChatbotBuilder initialGraph={graph} initialStatus={status} />;
}
