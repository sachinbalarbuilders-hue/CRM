import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { prisma } from "@/auth";
import { auth } from "@/auth";
import { AccountActions } from "./components/AccountActions";
import { cookies } from "next/headers";
import type { PermissionsMap } from "@/app/(dashboard)/settings/roles/role-constants";

async function getUserPermissions(userId: string, organizationId: string) {
  // SUPER_ADMIN or ORG_ADMIN on User table → full access
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === "SUPER_ADMIN" || user?.role === "ORG_ADMIN") return null;

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: { customRole: { select: { permissions: true } } }
  });

  // ORG_ADMIN or MANAGER on membership → full access
  if (membership?.role === "ORG_ADMIN" || membership?.role === "MANAGER") return null;

  // Return the custom role permissions (or empty if none assigned)
  return (membership?.customRole?.permissions ?? {}) as PermissionsMap;
}

export default async function AccountsPage() {
  const session = await auth();
  
  let accounts: any[] = [];
  
  const cookieStore = await cookies();
  const organizationId =
    cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (organizationId) {
    accounts = await prisma.whatsAppAccount.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // null means full access, object means restricted
  const permissions = session?.user?.id && organizationId
    ? await getUserPermissions(session.user.id, organizationId)
    : ({} as PermissionsMap);

  const canCreate = permissions === null || !!permissions?.accounts?.create;
  const canEdit   = permissions === null || !!permissions?.accounts?.edit;
  const canDelete = permissions === null || !!permissions?.accounts?.delete;

  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">Manage your connected WhatsApp Business accounts.</p>
        </div>
        {canCreate && (
          <Link
            href="/settings/accounts/new"
            className={cn(buttonVariants({ variant: "default" }), "bg-green-600 hover:bg-green-700 text-white gap-2")}
          >
            <Plus className="h-4 w-4" /> Add Account
          </Link>
        )}
      </div>

      <div className="grid gap-6">
        {accounts.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">No Accounts Found</h3>
              <p className="text-sm text-muted-foreground mb-4 mt-1 max-w-sm">
                You haven't connected any WhatsApp Business accounts yet. Add your first account to start sending and receiving messages.
              </p>
              {canCreate && (
                <Link
                  href="/settings/accounts/new"
                  className={buttonVariants({ variant: "outline" }) + " border-green-600 text-green-600 hover:bg-green-50"}
                >
                  Add Your First Account
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="bg-green-600/10 p-2 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    {account.name}
                  </CardTitle>
                  <CardDescription>WhatsApp Business Account</CardDescription>
                </div>
                <AccountActions accountId={account.id} canEdit={canEdit} canDelete={canDelete} />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Phone Number ID</p>
                    <p className="font-medium font-mono">{account.phoneNumberId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">WABA ID</p>
                    <p className="font-medium font-mono">{account.wabaId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      {account.status === "CONNECTED" ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <p className="font-medium text-green-600">Connected</p>
                        </>
                      ) : account.status === "DISCONNECTED" ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                          </span>
                          <p className="font-medium text-destructive">Disconnected</p>
                        </>
                      ) : (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <p className="font-medium text-amber-600">Untested</p>
                        </>
                      )}
                    </div>
                    {account.lastTestedAt && (
                      <p className="text-[10px] text-muted-foreground">Last checked: {account.lastTestedAt.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
