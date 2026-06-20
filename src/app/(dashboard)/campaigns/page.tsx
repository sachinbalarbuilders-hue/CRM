import { CampaignsClient } from "./CampaignsClient";
import { auth } from "@/auth";
import { getCampaigns } from "./actions";
import { redirect } from "next/navigation";

export default async function CampaignsPage() {
  const session = await auth();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const campaigns = await getCampaigns(organizationId);

  return <CampaignsClient campaigns={campaigns} />;
}
