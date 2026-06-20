import { prisma } from "@/auth";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { GeneralSettingsClient } from "./GeneralSettingsClient";

export default async function GeneralSettingsPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (!session?.user || !organizationId) {
    return <div className="p-4">Please select an organization.</div>;
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  });

  if (!organization) {
    return <div className="p-4">Organization not found.</div>;
  }

  return <GeneralSettingsClient organization={organization} />;
}
