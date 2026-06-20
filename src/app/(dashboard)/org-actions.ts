"use server";

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function createOrganization(name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Create the new organization
  const org = await prisma.organization.create({
    data: {
      name,
    }
  });

  // Create the membership for the user
  await prisma.organizationMember.create({
    data: {
      userId: session.user.id,
      organizationId: org.id,
      role: "ORG_ADMIN"
    }
  });

  // Automatically switch the user to the newly created organization
  await prisma.user.update({
    where: { id: session.user.id },
    data: { organizationId: org.id }
  });

  (await cookies()).set("activeOrganizationId", org.id);
  revalidatePath("/");

  // Since we updated the database, the client should update their session JWT
  return { success: true, organizationId: org.id };
}

export async function switchOrganization(orgId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify the user is actually a member of this organization
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId
      }
    }
  });

  if (!membership) {
    // If not a regular member, check if they are a SUPER_ADMIN who can view any org
    const user = await prisma.user.findUnique({ where: { id: session.user.id }});
    if (user?.role !== "SUPER_ADMIN") {
      throw new Error("You do not have access to this organization");
    }
  }

  // Update the user's active organization in the database
  await prisma.user.update({
    where: { id: session.user.id },
    data: { organizationId: orgId }
  });

  (await cookies()).set("activeOrganizationId", orgId);
  revalidatePath("/");

  return { success: true, organizationId: orgId };
}

export async function deleteOrganization() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId;
  
  if (!activeOrganizationId) {
    throw new Error("No active organization to delete");
  }
  
  // Verify membership and role
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: activeOrganizationId
      }
    }
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }});

  if (user?.role !== "SUPER_ADMIN" && membership?.role !== "ORG_ADMIN") {
    throw new Error("Only organization administrators can delete the organization");
  }

  // Find another organization to switch to after deletion
  const otherMemberships = await prisma.organizationMember.findMany({
    where: { 
      userId: session.user.id,
      organizationId: { not: activeOrganizationId }
    },
    take: 1
  });
  
  // Delete the organization
  await prisma.organization.delete({
    where: { id: activeOrganizationId }
  });
  
  const nextOrgId = otherMemberships[0]?.organizationId || null;
  
  // Switch to another organization if one exists
  await prisma.user.update({
    where: { id: session.user.id },
    data: { organizationId: nextOrgId }
  });
  
  if (nextOrgId) {
    cookieStore.set("activeOrganizationId", nextOrgId);
  } else {
    cookieStore.delete("activeOrganizationId");
  }
  
  revalidatePath("/");
  return { success: true };
}
