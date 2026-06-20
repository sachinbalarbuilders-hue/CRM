import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const flow = await prisma.flow.findUnique({
    where: { id: "balar_main_flow" }
  });
  
  if (!flow) {
    console.log("Flow not found");
    return;
  }
  
  console.log("Nodes:");
  (flow.nodes as any[]).forEach(n => {
    if (n.type === "interactive_menu") {
      console.log(`Node ${n.id} (${n.data.label}): options =`, n.data.options);
    }
  });
  
  console.log("\nEdges:");
  (flow.edges as any[]).forEach(e => {
    console.log(`Edge from ${e.source} (handle ${e.sourceHandle}) to ${e.target}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
