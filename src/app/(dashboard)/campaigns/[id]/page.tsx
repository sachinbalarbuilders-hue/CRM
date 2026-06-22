import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/auth";
import CampaignStatisticsClient from "./CampaignStatisticsClient";

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id, organizationId },
    include: { messages: { include: { conversation: true } } }
  });

  if (!campaign) {
    redirect("/campaigns");
  }

  return <CampaignStatisticsClient campaign={campaign} />;
}
