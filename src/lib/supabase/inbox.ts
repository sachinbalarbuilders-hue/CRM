"use server";

import { prisma } from "@/auth";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

/**
 * Helper to get the current organization ID
 */
async function getOrganizationId() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId;
  
  if (!organizationId) throw new Error("No active organization");
  return organizationId;
}

export async function getConversations() {
  noStore();
  const organizationId = await getOrganizationId();
  
  return prisma.conversation.findMany({
    where: { organizationId },
    orderBy: { lastMessageAt: "desc" },
    include: {
      assignedTo: {
        select: { name: true, image: true }
      }
    }
  });
}

export async function getMessages(conversationId: string, cursor?: string, limit: number = 50) {
  noStore();
  const organizationId = await getOrganizationId();
  
  // Verify conversation belongs to org
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });
  
  if (!conversation || conversation.organizationId !== organizationId) {
    throw new Error("Conversation not found or access denied");
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" }
  });

  return messages.reverse();
}

export async function markAsRead(conversationId: string) {
  const organizationId = await getOrganizationId();
  
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });
  
  if (!conversation || conversation.organizationId !== organizationId) {
    throw new Error("Conversation not found or access denied");
  }

  return prisma.conversation.update({
    where: { id: conversationId },
    data: { unreadCount: 0 }
  });
}

export async function resolveConversation(conversationId: string) {
  const organizationId = await getOrganizationId();
  
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });
  
  if (!conversation || conversation.organizationId !== organizationId) {
    throw new Error("Conversation not found or access denied");
  }

  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "resolved" }
  });
}

export async function createConversation(data: {
  contactName: string;
  phoneNumber: string;
  organizationId: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify the user has access to this organization
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: data.organizationId
      }
    }
  });

  if (!membership && session.user.role !== "SUPER_ADMIN") {
    throw new Error("You do not have access to this organization");
  }

  // Check if conversation already exists for this phone number in this org
  const existing = await prisma.conversation.findUnique({
    where: {
      phoneNumber_organizationId: {
        phoneNumber: data.phoneNumber,
        organizationId: data.organizationId
      }
    }
  });

  if (existing) {
    // If it exists, maybe we just return it so the UI can navigate to it
    return existing;
  }

  return prisma.conversation.create({
    data: {
      contactName: data.contactName,
      phoneNumber: data.phoneNumber,
      organizationId: data.organizationId,
      status: "open",
    }
  });
}
