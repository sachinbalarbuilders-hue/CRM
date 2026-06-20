import { prisma } from "./src/auth";

async function main() {
  const flow = await prisma.flow.findFirst({
    where: { status: "Active" }
  });
  if (!flow) return;
  const nodes = flow.nodes as any[];
  const edges = flow.edges as any[];
  
  const msgNodes = nodes.filter(n => n.type === "message" && n.data.message?.includes("We have received"));
  console.log("Message Node:", msgNodes.map(n => n.id));
  
  if (msgNodes.length > 0) {
    const outEdges = edges.filter(e => e.source === msgNodes[0].id);
    console.log("Edges out of Message node:", outEdges);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
