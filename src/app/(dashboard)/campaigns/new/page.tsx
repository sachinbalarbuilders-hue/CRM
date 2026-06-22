import { auth } from "@/auth";
import { getActiveOrgId } from "@/lib/permissions";
import { redirect } from "next/navigation";
import NewCampaignWizard from "./NewCampaignClient";
import { prisma } from "@/auth";

export default async function NewCampaignPage() {
  const session = await auth();
  const organizationId = await getActiveOrgId();

  if (!organizationId) {
    redirect("/login");
  }

  const templates = await prisma.template.findMany({
    where: { organizationId, status: "Approved" }
  });

  const accounts = await prisma.whatsAppAccount.findMany({
    where: { organizationId },
    select: { id: true, name: true, wabaId: true }
  });

  return <NewCampaignWizard organizationId={organizationId} templates={templates} accounts={accounts} />;
}

