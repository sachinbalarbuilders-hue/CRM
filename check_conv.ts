import { prisma } from "./src/auth";

async function main() {
  const convs = await prisma.conversation.findMany({
    where: { phoneNumber: "916352816306" }
  });
  
  console.log(convs.map(c => ({
    id: c.id,
    status: c.status,
    activeFlowId: c.activeFlowId,
    currentFlowNodeId: c.currentFlowNodeId,
    assignedToId: c.assignedToId
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
