import { prisma } from "./src/auth";

async function main() {
  const flow = await prisma.flow.findFirst({
    where: { status: "Active" }
  });
  if (!flow) return;
  const nodes = flow.nodes as any[];
  const edges = flow.edges as any[];
  
  const msgNodes = nodes.filter(n => n.type === "message" && n.data.message?.includes("We have received"));
  console.log("Message Nodes:", msgNodes.map(n => n.id));
  
  for (const node of msgNodes) {
    const outEdges = edges.filter(e => e.source === node.id);
    console.log(`Edges out of ${node.id}:`, outEdges);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
