import { prisma } from "./src/auth";

async function main() {
  const flow = await prisma.flow.findFirst({
    where: { status: "Active" }
  });
  if (!flow) return;
  const nodes = flow.nodes as any[];
  const edges = flow.edges as any[];
  
  const transferNode = nodes.find(n => n.type === "transfer");
  console.log("Transfer Node ID:", transferNode?.id);
  
  const edgesToTransfer = edges.filter(e => e.target === transferNode?.id);
  console.log("Edges pointing to Transfer Node:", edgesToTransfer);
  
  if (edgesToTransfer.length > 0) {
    const sourceNode = nodes.find(n => n.id === edgesToTransfer[0].source);
    console.log("Source Node Type:", sourceNode?.type, "Message:", sourceNode?.data?.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
