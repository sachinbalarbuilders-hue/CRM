import { prisma } from "./src/auth";

async function main() {
  const flow = await prisma.flow.findFirst({
    where: { status: "Active" }
  });
  if (!flow) return;
  const nodes = flow.nodes as any[];
  const transferNode = nodes.find(n => n.type.toLowerCase().includes("transfer"));
  console.log("Transfer Node Type:", transferNode?.type);
}

main().catch(console.error).finally(() => prisma.$disconnect());
