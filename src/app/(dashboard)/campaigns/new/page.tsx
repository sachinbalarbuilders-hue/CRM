import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewCampaignWizard from "./NewCampaignClient";

export default async function NewCampaignPage() {
  const session = await auth();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  return <NewCampaignWizard organizationId={organizationId} />;
}
