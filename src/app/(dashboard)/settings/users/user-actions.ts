"use server";

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { assertPermission } from "@/lib/permissions";

async function getActiveOrgId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId;
  if (!activeOrg) throw new Error("No active organization");
  return { userId: session.user.id, organizationId: activeOrg };
}

async function assertUserManager(action: "view" | "create" | "edit" | "delete") {
  await assertPermission("settings-users", action);
}

export async function getOrgMembers() {
  await assertUserManager("view");
  const { organizationId } = await getActiveOrgId();

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
      customRole: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  return members;
}

export async function inviteUser(
  name: string,
  email: string,
  password: string,
  customRoleId: string | null
) {
  await assertUserManager("create");
  const { userId, organizationId } = await getActiveOrgId();

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Create a new user with a hashed temporary password
    const hashedPassword = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        organizationId,
        role: "EXECUTIVE"
      }
    });
  }

  // Check if already a member
  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } }
  });

  if (existing) {
    throw new Error("This user is already a member of this organization");
  }

  // Add as member
  await prisma.organizationMember.create({
    data: {
      userId: user.id,
      organizationId,
      role: "EXECUTIVE",
      customRoleId: customRoleId || null
    }
  });

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateMemberRole(memberId: string, customRoleId: string | null) {
  await assertUserManager("edit");
  const { userId, organizationId } = await getActiveOrgId();

  // Verify member belongs to this org
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId }
  });
  if (!member) throw new Error("Member not found");

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { customRoleId: customRoleId || null }
  });

  revalidatePath("/settings/users");
  return { success: true };
}

export async function removeMember(memberId: string) {
  await assertUserManager("delete");
  const { userId, organizationId } = await getActiveOrgId();

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId }
  });
  if (!member) throw new Error("Member not found");

  // Don't allow removing yourself
  if (member.userId === userId) {
    throw new Error("You cannot remove yourself from the organization");
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });

  revalidatePath("/settings/users");
  return { success: true };
}
