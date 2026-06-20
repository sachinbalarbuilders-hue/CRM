"use server";

import { prisma } from "@/auth";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function verifyAccess(conversationId: string) {
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (!session?.user || !organizationId) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation || conversation.organizationId !== organizationId) {
    throw new Error("Contact not found or access denied");
  }

  return { conversation, organizationId };
}

export async function updateContact(id: string, contactName: string, phoneNumber: string) {
  await verifyAccess(id);

  await prisma.conversation.update({
    where: { id },
    data: { contactName, phoneNumber }
  });

  revalidatePath("/settings/contacts");
  revalidatePath("/inbox");
}

export async function deleteContact(id: string) {
  await verifyAccess(id);

  // Prisma will cascade delete messages if schema is set up for it, 
  // otherwise we should delete messages first.
  await prisma.message.deleteMany({
    where: { conversationId: id }
  });

  await prisma.conversation.delete({
    where: { id }
  });

  revalidatePath("/settings/contacts");
  revalidatePath("/inbox");
}
