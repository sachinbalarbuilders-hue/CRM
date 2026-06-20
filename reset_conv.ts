import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.conversation.updateMany({
    where: { phoneNumber: "916352816306" },
    data: { 
      assignedToId: null, 
      currentFlowNodeId: "transferred",
      activeFlowId: null,
      status: "open"
    }
  });
  console.log("Conversation reset!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
