"use server";

import { prisma, auth } from "@/auth";

export async function assignConversationToMe(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedToId: session.user.id,
      },
    });
    return { success: true, conversation: updated };
  } catch (error) {
    console.error("Failed to assign conversation:", error);
    return { success: false, error: "Failed to assign conversation" };
  }
}
