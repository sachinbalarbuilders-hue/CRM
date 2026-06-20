import { auth } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FlowBuilderClient from "./FlowBuilderClient";
import { prisma } from "@/auth";

export default async function FlowBuilderPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (!session?.user || !organizationId) {
    redirect("/auth/login");
  }

  // Fetch the saved flow for this organization (assuming 'balar_main_flow' or any active flow)
  const savedFlow = await prisma.flow.findFirst({
    where: { 
      organizationId,
      id: "balar_main_flow" // We hardcoded this in FlowBuilderClient's saveFlow for now
    }
  });

  return <FlowBuilderClient 
    organizationId={organizationId} 
    initialSavedNodes={savedFlow?.nodes ? (savedFlow.nodes as any) : null}
    initialSavedEdges={savedFlow?.edges ? (savedFlow.edges as any) : null}
  />;
}
