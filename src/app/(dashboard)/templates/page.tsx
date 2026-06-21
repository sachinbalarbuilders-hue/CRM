import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTemplates } from "./actions";
import { TemplatesClient } from "./TemplatesClient";
import { prisma } from "@/auth";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId as string | undefined;

  if (!activeOrganizationId) {
    return <div className="p-4">Please select an organization.</div>;
  }

  const templates = await getTemplates(activeOrganizationId);
  const accounts = await prisma.whatsAppAccount.findMany({
    where: { organizationId: activeOrganizationId },
    select: { id: true, name: true, wabaId: true }
  });

  return <TemplatesClient templates={templates} organizationId={activeOrganizationId} accounts={accounts} />;
}
