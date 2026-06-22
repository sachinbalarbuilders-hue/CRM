import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { auth, prisma } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { PermissionsMap } from "@/app/(dashboard)/settings/roles/role-constants";
import { headers } from "next/headers";

// Map of URL path segments → permission section keys
const PATH_TO_SECTION: Record<string, string> = {
  dashboard: "dashboard",
  inbox: "inbox",
  campaigns: "campaigns",
  templates: "templates",
  "flow-builder": "flows",
  "meta-insights": "meta-insights",
  projects: "projects",
  contacts: "contacts",
  settings: "settings",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("activeOrganizationId")?.value || session.user.organizationId as string | undefined;

  // Fetch the organizations this user is a member of (or all if SUPER_ADMIN)
  let organizations: { id: string; name: string }[] = [];
  let userPermissions: PermissionsMap | null = null;

  if (session.user.role === "SUPER_ADMIN") {
    organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    });
    // Super admins always have full access
  } else {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: session.user.id },
      include: { 
        organization: { select: { id: true, name: true } },
        customRole: { select: { permissions: true } }
      }
    });
    organizations = memberships.map(m => m.organization);

    // Find the current membership for active org
    const activeMembership = memberships.find(m => m.organizationId === activeOrganizationId);
    
    if (activeMembership) {
      if (activeMembership.role === "ORG_ADMIN" || activeMembership.role === "MANAGER") {
        // ORG_ADMIN and MANAGER have full access
        userPermissions = null;
      } else if (activeMembership.customRole?.permissions) {
        // Regular member with a custom role — enforce permissions
        userPermissions = activeMembership.customRole.permissions as PermissionsMap;
      } else {
        // Member with no custom role (e.g. EXECUTIVE defaults) gets empty permissions
        userPermissions = {} as PermissionsMap;
      }
    }
  }

  // Enforce page-level access: check if user can VIEW the current path
  if (userPermissions) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || 
                     headersList.get("next-url") || "";
    
    // Extract the first path segment (e.g. /campaigns/new → campaigns)
    const segment = pathname.replace(/^\//, "").split("/")[0];
    const section = PATH_TO_SECTION[segment];
    
    if (section && section !== "dashboard" && !userPermissions[section]?.view) {
      redirect("/dashboard");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        organizations={organizations} 
        currentOrganizationId={activeOrganizationId}
        userPermissions={userPermissions}
      />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
