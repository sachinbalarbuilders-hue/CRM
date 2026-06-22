"use server";

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { assertPermission } from "@/lib/permissions";
import type { PermissionsMap } from "./role-constants";

async function getActiveOrgId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId;
  if (!activeOrg) throw new Error("No active organization");
  return { userId: session.user.id, organizationId: activeOrg };
}

async function assertRoleManager(action: "view" | "create" | "edit" | "delete") {
  await assertPermission("settings-roles", action);
}

export async function getRoles() {
  await assertRoleManager("view");
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
  await assertRoleManager("create");
  const { userId, organizationId } = await getActiveOrgId();

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
  await assertRoleManager("edit");
  const { userId, organizationId } = await getActiveOrgId();

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
  await assertRoleManager("delete");
  const { userId, organizationId } = await getActiveOrgId();

  const existing = await prisma.customRole.findFirst({
    where: { id: roleId, organizationId }
  });
  if (!existing) throw new Error("Role not found");

  await prisma.customRole.delete({ where: { id: roleId } });

  revalidatePath("/settings/roles");
  return { success: true };
}
