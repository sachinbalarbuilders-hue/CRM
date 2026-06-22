import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewCampaignWizard from "../../new/NewCampaignClient";
import { prisma } from "@/auth";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id, organizationId }
  });

  if (!campaign) {
    redirect("/campaigns");
  }

  if (campaign.status !== "Draft") {
    redirect(`/campaigns/${campaign.id}`);
  }

  const templates = await prisma.template.findMany({
    where: { organizationId, status: "Approved" }
  });

  const accounts = await prisma.whatsAppAccount.findMany({
    where: { organizationId },
    select: { id: true, name: true, wabaId: true }
  });

  return (
    <NewCampaignWizard 
      organizationId={organizationId} 
      campaignId={campaign.id} 
      initialData={campaign} 
      templates={templates} 
      accounts={accounts} 
    />
  );
}
