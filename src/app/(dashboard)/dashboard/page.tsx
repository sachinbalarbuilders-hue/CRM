import { prisma } from "@/auth";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, PhoneForwarded, MailOpen } from "lucide-react";
import { DashboardLineChart } from "./components/DashboardCharts";
import Link from "next/link";
import { format, subDays } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (!organizationId) {
    return <div className="p-4">Please select an organization to view insights.</div>;
  }

  // 1. Fetch High-Level Metrics
  const totalConversations = await prisma.conversation.count({ where: { organizationId } });
  const unreadConversations = await prisma.conversation.count({ where: { organizationId, unreadCount: { gt: 0 } } });
  const openTransfers = await prisma.conversation.count({ where: { organizationId, currentFlowNodeId: "transferred", status: "open", assignedToId: null } });

  // 2. Fetch Message Volume (Last 7 Days)
  const sevenDaysAgo = subDays(new Date(), 7);
  
  // We'll get all messages from the last 7 days for this org
  const recentMessages = await prisma.message.findMany({
    where: {
      conversation: { organizationId },
      createdAt: { gte: sevenDaysAgo }
    },
    select: {
      direction: true,
      createdAt: true
    }
  });

  // Process messages into a day-by-day array
  const volumeMap: Record<string, { date: string; Inbound: number; Outbound: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "MMM dd");
    volumeMap[dateStr] = { date: dateStr, Inbound: 0, Outbound: 0 };
  }

  for (const msg of recentMessages) {
    const dateStr = format(msg.createdAt, "MMM dd");
    if (volumeMap[dateStr]) {
      if (msg.direction === "INBOUND") volumeMap[dateStr].Inbound += 1;
      else volumeMap[dateStr].Outbound += 1;
    }
  }

  const lineChartData = Object.values(volumeMap);

  // 4. Recent Incoming Messages
  const recentConversations = await prisma.conversation.findMany({
    where: { organizationId, unreadCount: { gt: 0 } },
    orderBy: { lastMessageAt: "desc" },
    take: 5
  });

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Insights</h2>
      </div>
      
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">All time interactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadConversations}</div>
            <p className="text-xs text-muted-foreground">Requires your attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Transfers</CardTitle>
            <PhoneForwarded className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTransfers}</div>
            <p className="text-xs text-muted-foreground">In the queue right now</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Message Volume (Last 7 Days)</CardTitle>
            <CardDescription>Compare inbound vs outbound messages</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardLineChart 
              data={lineChartData} 
              xKey="date" 
              yKeys={["Inbound", "Outbound"]} 
              colors={["#3b82f6", "#22c55e"]} // blue for inbound, green for outbound
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Unread Conversations</CardTitle>
            <CardDescription>Customers waiting for a reply</CardDescription>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No unread messages! You're all caught up.
              </div>
            ) : (
              <div className="space-y-4">
                {recentConversations.map(conv => (
                  <div key={conv.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{conv.contactName || conv.phoneNumber}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {conv.lastMessage || "Media message"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {conv.lastMessageAt ? format(conv.lastMessageAt, "MMM d, h:mm a") : ""}
                      </span>
                      <Link href={`/inbox?chat=${conv.id}`}>
                        <span className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">
                          View Chat
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
