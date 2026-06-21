import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NewTemplateClient } from "./NewTemplateClient";
import { prisma } from "@/auth";

export default async function NewTemplatePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId as string | undefined;

  if (!activeOrganizationId) {
    return <div className="p-4">Please select an organization.</div>;
  }

  const accounts = await prisma.whatsAppAccount.findMany({
    where: { organizationId: activeOrganizationId },
    select: { id: true, name: true, wabaId: true }
  });

  return <NewTemplateClient organizationId={activeOrganizationId} accounts={accounts} />;
}
