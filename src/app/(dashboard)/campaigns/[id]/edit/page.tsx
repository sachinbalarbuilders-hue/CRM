import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCampaign } from "../../actions";
import NewCampaignWizard from "../../new/NewCampaignClient";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId as string | undefined;

  if (!activeOrganizationId) {
    return <div className="p-4">Please select an organization.</div>;
  }

  const resolvedParams = await params;
  const campaign = await getCampaign(resolvedParams.id);

  if (!campaign || campaign.organizationId !== activeOrganizationId) {
    redirect("/campaigns");
  }

  return <NewCampaignWizard organizationId={activeOrganizationId} campaignId={campaign.id} initialData={campaign} />;
}
