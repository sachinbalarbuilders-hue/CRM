import { NextResponse } from "next/server";
import { prisma } from "@/auth";
import { subDays, format } from "date-fns";

export async function GET() {
  try {
    const organizationId = "some-org-id"; // Just pick any org ID or fetch the first one
    const firstOrg = await prisma.organization.findFirst();
    if (!firstOrg) return NextResponse.json({ error: "No orgs" });
    
    const orgId = firstOrg.id;
    const sevenDaysAgo = subDays(new Date(), 7);

    const [
      totalConversations,
      unreadConversations,
      openTransfers,
      recentMessages,
      recentConversations
    ] = await Promise.all([
      prisma.conversation.count({ where: { organizationId: orgId } }),
      prisma.conversation.count({ where: { organizationId: orgId, unreadCount: { gt: 0 } } }),
      prisma.conversation.count({ where: { organizationId: orgId, currentFlowNodeId: "transferred", status: "open", assignedToId: null } }),
      prisma.message.findMany({
        where: {
          conversation: { organizationId: orgId },
          createdAt: { gte: sevenDaysAgo }
        },
        select: { direction: true, createdAt: true }
      }),
      prisma.conversation.findMany({
        where: { organizationId: orgId, unreadCount: { gt: 0 } },
        orderBy: { lastMessageAt: "desc" },
        take: 5
      })
    ]);

    return NextResponse.json({ success: true, data: totalConversations });
  } catch (err: any) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
