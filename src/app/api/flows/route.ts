import { NextResponse } from "next/server";
import { prisma } from "@/auth"; // Assume auth exports initialized prisma client

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, nodes, edges, organizationId } = body;

    if (!name || !organizationId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const flow = await prisma.flow.upsert({
      where: { id: id || "new_flow_id_that_never_matches" },
      update: {
        name,
        nodes,
        edges,
        status: "Active",
      },
      create: {
        id: id || undefined,
        name,
        nodes,
        edges,
        organizationId,
        status: "Active",
      },
    });

    return NextResponse.json(flow);
  } catch (error) {
    console.error("Error saving flow:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
