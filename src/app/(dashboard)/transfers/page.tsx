import { prisma, auth } from "@/auth";
import { redirect } from "next/navigation";
import TransfersClient from "./TransfersClient";
import { getActiveOrgId } from "@/lib/permissions";

export default async function TransfersPage() {
  const organizationId = await getActiveOrgId();

  if (!organizationId) {
    redirect("/login");
  }

  // Fetch conversations that are open, unassigned, and not actively handled by a flow (bot)
  const waitingConversations = await prisma.conversation.findMany({
    where: {
      organizationId,
      status: "open",
      assignedToId: null,
      activeFlowId: null,
      currentFlowNodeId: "transferred", // Only conversations explicitly transferred by the bot
    },
    select: {
      id: true,
      contactName: true,
      phoneNumber: true,
      lastMessage: true,
      lastMessageAt: true,
    },
    orderBy: {
      lastMessageAt: "asc", // Oldest waiting first
    },
  });

  const historyConversations = await prisma.conversation.findMany({
    where: {
      organizationId,
      currentFlowNodeId: "transferred",
      assignedToId: { not: null },
    },
    select: {
      id: true,
      contactName: true,
      phoneNumber: true,
      updatedAt: true,
      assignedTo: {
        select: { name: true, email: true },
      },
    },
    orderBy: {
      updatedAt: "desc", // Most recently assigned first
    },
    take: 100, // Limit history to recent 100
  });

  return (
    <div className="h-full w-full p-4 md:p-6 overflow-y-auto">
      <TransfersClient 
        conversations={waitingConversations} 
        history={historyConversations} 
      />
    </div>
  );
}
