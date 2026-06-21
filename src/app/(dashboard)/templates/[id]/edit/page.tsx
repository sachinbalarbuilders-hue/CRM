import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTemplate } from "../../actions";
import { NewTemplateClient } from "../../new/NewTemplateClient";
import { prisma } from "@/auth";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
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
  const template = await getTemplate(resolvedParams.id);

  if (!template || template.organizationId !== activeOrganizationId) {
    redirect("/templates");
  }

  const accounts = await prisma.whatsAppAccount.findMany({
    where: { organizationId: activeOrganizationId },
    select: { id: true, name: true, wabaId: true }
  });

  return <NewTemplateClient organizationId={activeOrganizationId} templateId={template.id} initialData={template} accounts={accounts} />;
}
