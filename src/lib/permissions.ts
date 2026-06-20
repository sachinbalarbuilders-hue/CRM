/**
 * Shared server-side permission enforcement utility.
 * Import and call assertPermission() at the top of any server action that needs protection.
 */
import { auth, prisma } from "@/auth";
import { cookies } from "next/headers";
import type { PermissionsMap } from "@/app/(dashboard)/settings/roles/role-constants";

type PermAction = "view" | "create" | "edit" | "delete";

export async function assertPermission(section: string, action: PermAction) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // SUPER_ADMIN and ORG_ADMIN always have full access
  if (session.user.role === "SUPER_ADMIN" || session.user.role === "ORG_ADMIN") {
    return session;
  }

  const cookieStore = await cookies();
  const organizationId =
    cookieStore.get("activeOrganizationId")?.value || session.user.organizationId;

  if (!organizationId) throw new Error("No active organization");

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId } },
    include: { customRole: { select: { permissions: true } } }
  });

  // ORG_ADMIN on the membership also gets full access
  if (membership?.role === "ORG_ADMIN" || membership?.role === "MANAGER") {
    return session;
  }

  // If no custom role assigned, deny by default
  if (!membership?.customRole?.permissions) {
    throw new Error(`You do not have permission to ${action} ${section}`);
  }

  const permissions = membership.customRole.permissions as PermissionsMap;

  if (!permissions[section]?.[action]) {
    throw new Error(
      `You do not have permission to ${action} in ${section}. Contact your administrator.`
    );
  }

  return session;
}
