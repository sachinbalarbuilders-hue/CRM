import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewCampaignWizard from "./NewCampaignClient";
import { prisma } from "@/auth";

export default async function NewCampaignPage() {
  const session = await auth();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const templates = await prisma.template.findMany({
    where: { organizationId, status: "Approved" }
  });

  return <NewCampaignWizard organizationId={organizationId} templates={templates} />;
}
