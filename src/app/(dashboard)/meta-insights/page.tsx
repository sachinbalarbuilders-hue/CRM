import { prisma } from "@/auth";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Send, Check, CheckCheck } from "lucide-react";
import { DashboardPieChart } from "../dashboard/components/DashboardCharts";
import { format, subDays } from "date-fns";
import { AccountSelector } from "./AccountSelector";

export default async function MetaInsightsPage({ searchParams }: { searchParams: Promise<{ accountId?: string }> }) {
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;
  const sp = await searchParams;

  if (!organizationId) {
    return <div className="p-4">Please select an organization to view insights.</div>;
  }

  // 1. WhatsApp Accounts
  const waAccounts = await prisma.whatsAppAccount.findMany({
    where: { organizationId }
  });

  const selectedAccountId = sp.accountId || (waAccounts.length > 0 ? waAccounts[0].id : undefined);
  const selectedAccount = waAccounts.find(a => a.id === selectedAccountId);

  // 2. Message Delivery Funnel (Outbound only)
  // Filter messages that belong to campaigns from this specific WhatsApp Account
  const messageWhereClause: any = { 
    conversation: { organizationId },
    direction: { in: ['outbound', 'OUTBOUND'] }
  };
  
  if (selectedAccountId) {
    messageWhereClause.campaign = { whatsAppAccountId: selectedAccountId };
  }

  const outboundMessages = await prisma.message.groupBy({
    by: ['status'],
    where: messageWhereClause,
    _count: { status: true }
  });

  const funnelData = { SENT: 0, DELIVERED: 0, READ: 0, FAILED: 0 };

  outboundMessages.forEach(m => {
    const status = m.status.toUpperCase();
    if (status === "SENT") funnelData.SENT += m._count.status;
    if (status === "DELIVERED") funnelData.DELIVERED += m._count.status;
    if (status === "READ") funnelData.READ += m._count.status;
    if (status === "FAILED") funnelData.FAILED += m._count.status;
  });

  const totalSent = funnelData.SENT + funnelData.DELIVERED + funnelData.READ + funnelData.FAILED;
  const totalDelivered = funnelData.DELIVERED + funnelData.READ;
  const totalRead = funnelData.READ;

  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const readRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

  // 3. Inbound vs Outbound Ratio
  const directionWhereClause: any = { conversation: { organizationId } };
  if (selectedAccountId) {
    // Note: Since inbound messages aren't tied to campaigns, they won't have campaign.whatsAppAccountId.
    // For now, if an account is selected, we only show ratio for messages tied to its campaigns 
    // to keep the visual stats completely locked to the selected account's known traffic.
    directionWhereClause.campaign = { whatsAppAccountId: selectedAccountId };
  }

  const messageDirection = await prisma.message.groupBy({
    by: ['direction'],
    where: directionWhereClause,
    _count: { direction: true }
  });

  const pieDataMap: Record<string, number> = {};
  messageDirection.forEach(d => {
    const dir = d.direction.toUpperCase();
    let name = "Sent";
    if (dir === "INBOUND") name = "Received";
    else if (dir === "SYSTEM") name = "System";
    else if (dir && dir !== "OUTBOUND") name = d.direction;
    
    pieDataMap[name] = (pieDataMap[name] || 0) + d._count.direction;
  });

  const pieData = Object.entries(pieDataMap).map(([name, value]) => ({ name, value }));
  if (pieData.length === 0) pieData.push({ name: "No Data", value: 1 });

  // 4. Marketing Campaigns Cost
  const campaigns = await prisma.campaign.findMany({
    where: { 
      organizationId,
      status: "Active",
      ...(selectedAccountId ? { whatsAppAccountId: selectedAccountId } : {})
    }
  });

  const marketingCost = campaigns.reduce((acc, campaign) => acc + (campaign.deliveredCount * 0.08), 0);

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Meta Insights</h2>
      </div>

      <p className="text-muted-foreground">
        Analytics and health metrics for your WhatsApp Business integration.
      </p>

      {/* WhatsApp Accounts */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="text-xl font-semibold">Connected WhatsApp Numbers</h3>
      </div>
      
      <AccountSelector accounts={waAccounts} selectedId={selectedAccountId} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {selectedAccount && (
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{selectedAccount.name}</CardTitle>
              {selectedAccount.status === "CONNECTED" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : selectedAccount.status === "UNTESTED" ? (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{selectedAccount.phoneNumberId}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Status: {selectedAccount.status.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="col-span-1 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">Service Cost</CardTitle>
            <span className="text-green-500 text-sm font-bold">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-800 dark:text-green-100">
              ${(totalSent * 0.03).toFixed(2)}
            </div>
            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
              ~$0.03 / session
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">Marketing Cost</CardTitle>
            <span className="text-blue-500 text-sm font-bold">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-800 dark:text-blue-100">
              ${marketingCost.toFixed(2)}
            </div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
              ~$0.08 / delivered campaign message
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {/* Delivery Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Funnel</CardTitle>
            <CardDescription>Performance of your outbound messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Send className="h-4 w-4 mr-2" />
                  Total Sent
                </div>
                <span className="font-bold">{totalSent}</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Check className="h-4 w-4 mr-2" />
                  Delivered ({deliveryRate}%)
                </div>
                <span className="font-bold">{totalDelivered}</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${deliveryRate}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <CheckCheck className="h-4 w-4 mr-2 text-blue-500" />
                  Read ({readRate}%)
                </div>
                <span className="font-bold">{totalRead}</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all" style={{ width: `${readRate}%` }} />
              </div>
            </div>
            
            {funnelData.FAILED > 0 && (
              <div className="flex items-center justify-between text-sm text-red-500 pt-4 border-t">
                <span>Failed Messages</span>
                <span className="font-bold">{funnelData.FAILED}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inbound vs Outbound */}
        <Card>
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>Inbound vs Outbound Ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardPieChart data={pieData} colors={["#3b82f6", "#22c55e", "#eab308", "#9333ea"]} />
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center text-sm">
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: ["#3b82f6", "#22c55e", "#eab308", "#9333ea"][i % 4] }}
                  />
                  {d.name}: <span className="font-bold ml-1">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
