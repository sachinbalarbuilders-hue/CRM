import { CampaignsClient } from "./CampaignsClient";
import { auth } from "@/auth";
import { getActiveOrgId } from "@/lib/permissions";
import { getCampaigns } from "./actions";
import { redirect } from "next/navigation";

export default async function CampaignsPage() {
  const session = await auth();
  const organizationId = await getActiveOrgId();

  if (!organizationId) {
    redirect("/login");
  }

  const campaigns = await getCampaigns(organizationId);

  return <CampaignsClient campaigns={campaigns} />;
}

