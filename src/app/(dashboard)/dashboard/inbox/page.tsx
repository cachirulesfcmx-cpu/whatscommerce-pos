import { getDashboardContext } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { InboxView } from "@/components/dashboard/inbox-view";
import { isAIEnabled } from "@/lib/ai";

export const metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { store } = await getDashboardContext();
  const conversations = await prisma.conversation.findMany({
    where: { storeId: store.id },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const data = conversations.map((c) => ({
    id: c.id,
    channel: c.channel,
    customerName: c.customerName,
    customerHandle: c.customerHandle,
    status: c.status,
    lastMessageAt: c.lastMessageAt.toISOString(),
    preview: c.messages[0]?.text ?? "",
  }));

  return <InboxView conversations={data} aiEnabled={isAIEnabled} />;
}
