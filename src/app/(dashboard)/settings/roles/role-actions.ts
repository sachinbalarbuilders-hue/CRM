"use server";

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { PermissionsMap } from "./role-constants";

async function getActiveOrgId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId;
  if (!activeOrg) throw new Error("No active organization");
  return { userId: session.user.id, organizationId: activeOrg };
}

async function assertAdmin(userId: string, organizationId: string) {
  const [membership, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { customRole: true }
    }),
    prisma.user.findUnique({ where: { id: userId } })
  ]);

  const isAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ORG_ADMIN" ||
    membership?.role === "ORG_ADMIN";

  if (!isAdmin) {
    throw new Error("Only organization admins can manage roles");
  }
}

export async function getRoles() {
  const { organizationId } = await getActiveOrgId();

  const roles = await prisma.customRole.findMany({
    where: { organizationId },
    include: {
      _count: { select: { members: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  return roles;
}

export async function createRole(name: string, permissions: PermissionsMap) {
  const { userId, organizationId } = await getActiveOrgId();
  await assertAdmin(userId, organizationId);

  const role = await prisma.customRole.create({
    data: {
      name,
      organizationId,
      permissions: permissions as any
    }
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function updateRole(roleId: string, name: string, permissions: PermissionsMap) {
  const { userId, organizationId } = await getActiveOrgId();
  await assertAdmin(userId, organizationId);

  const existing = await prisma.customRole.findFirst({
    where: { id: roleId, organizationId }
  });
  if (!existing) throw new Error("Role not found");

  const role = await prisma.customRole.update({
    where: { id: roleId },
    data: { name, permissions: permissions as any }
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function deleteRole(roleId: string) {
  const { userId, organizationId } = await getActiveOrgId();
  await assertAdmin(userId, organizationId);

  const existing = await prisma.customRole.findFirst({
    where: { id: roleId, organizationId }
  });
  if (!existing) throw new Error("Role not found");

  await prisma.customRole.delete({ where: { id: roleId } });

  revalidatePath("/settings/roles");
  return { success: true };
}
