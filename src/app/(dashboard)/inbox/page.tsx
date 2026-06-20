import { getConversations } from "@/lib/supabase/inbox";
import { InboxClient } from "./components/InboxClient";
import { auth } from "@/auth";
import { prisma } from "@/auth";
import { cookies } from "next/headers";

export default async function InboxPage() {
  // Fetch initial data on the server
  const initialConversations = await getConversations();
  
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (!organizationId) {
    return <div className="p-4">Please select an organization.</div>;
  }

  // Fetch all organizations the user has access to
  const userId = session?.user?.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  
  let organizations: { id: string; name: string }[] = [];
  
  if (user?.role === "SUPER_ADMIN") {
    organizations = await prisma.organization.findMany({ select: { id: true, name: true } });
  } else if (userId) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: { select: { id: true, name: true } } }
    });
    organizations = memberships.map(m => m.organization);
  }

  // Fetch org settings for mask phone numbers
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { settings: true } });
  const orgSettings = (org?.settings as Record<string, any>) || {};
  const maskPhoneNumbers = orgSettings.maskPhoneNumbers === true;

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] w-full overflow-hidden rounded-xl border bg-background shadow">
      <InboxClient 
        initialConversations={initialConversations} 
        organizationId={organizationId}
        organizations={organizations}
        orgSettings={orgSettings}
      />
    </div>
  );
}
