import { prisma } from "@/auth";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ContactActions } from "./ContactActions";
import { AddContactButton } from "./AddContactButton";
import { maskPhone } from "@/lib/phone";

const ITEMS_PER_PAGE = 10;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (!organizationId) {
    return <div className="p-4">Please select an organization.</div>;
  }

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

  // Handle pagination params
  const resolvedSearchParams = await searchParams;
  let page = 1;
  const pageParam = resolvedSearchParams.page;
  if (typeof pageParam === 'string' && !isNaN(parseInt(pageParam))) {
    page = parseInt(pageParam);
    if (page < 1) page = 1;
  }

  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Fetch contacts (conversations act as contacts)
  const [contacts, totalCount] = await Promise.all([
    prisma.conversation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        contactName: true,
        phoneNumber: true,
        createdAt: true,
      }
    }),
    prisma.conversation.count({
      where: { organizationId }
    })
  ]);

  // Fetch org settings for mask phone numbers
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { settings: true } });
  const orgSettings = (org?.settings as Record<string, any>) || {};
  const shouldMask = orgSettings.maskPhoneNumbers === true;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const displayPhone = (phone: string) => shouldMask ? maskPhone(phone) : phone;

  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
          <p className="text-muted-foreground">View all contacts added through the Inbox.</p>
        </div>
        <AddContactButton organizations={organizations} activeOrganizationId={organizationId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            You have {totalCount} total contacts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No contacts found. Go to Inbox to add a contact.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.contactName || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{displayPhone(contact.phoneNumber)}</TableCell>
                      <TableCell>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <ContactActions contact={contact} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {skip + 1} to {Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} contacts
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/settings/contacts?page=${Math.max(1, page - 1)}`}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
                <div className="text-sm font-medium">
                  Page {page} of {totalPages}
                </div>
                <Link
                  href={`/settings/contacts?page=${Math.min(totalPages, page + 1)}`}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" size="sm" disabled={page >= totalPages}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
