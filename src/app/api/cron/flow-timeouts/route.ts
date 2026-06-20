import { NextResponse } from "next/server";
import { prisma } from "@/auth";
import { processFlow } from "@/lib/flowEngine";

// You can trigger this endpoint via Vercel Cron, Supabase Cron, or any external ping service
export async function GET(request: Request) {
  try {
    // 1. Find all conversations currently waiting in a flow
    const waitingConversations = await prisma.conversation.findMany({
      where: {
        status: "open",
        activeFlowId: { not: null },
        currentFlowNodeId: { not: null },
      },
      include: { activeFlow: true }
    });

    let timeoutCount = 0;

    for (const conv of waitingConversations) {
      if (!conv.activeFlow || !conv.currentFlowNodeId || !conv.lastMessageAt) continue;

      const nodes = conv.activeFlow.nodes as any[];
      const edges = conv.activeFlow.edges as any[];

      const currentNode = nodes.find(n => n.id === conv.currentFlowNodeId);
      
      // If they are stuck on a Wait node
      if (currentNode && currentNode.type === "wait") {
        const durationMinutes = parseInt(currentNode.data.duration as string) || 60;
        const cutoffTime = new Date(conv.lastMessageAt.getTime() + durationMinutes * 60000);
        
        // Has the wait duration expired?
        if (new Date() >= cutoffTime) {
          // Time to trigger the timeout edge!
          const timeoutEdge = edges.find(e => e.source === currentNode.id && e.sourceHandle === "timeout");
          
          if (timeoutEdge) {
            // Re-run the flow engine, simulating an empty incoming text since they timed out
            // We do NOT update the currentFlowNodeId. We let the engine process the wait node's timeout branch!
            await processFlow(conv.id, "timeout_triggered");
            timeoutCount++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, timeoutsTriggered: timeoutCount });
  } catch (error) {
    console.error("Cron flow-timeout error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
