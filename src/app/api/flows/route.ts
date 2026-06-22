import { NextResponse } from "next/server";
import { prisma, auth } from "@/auth";
import { assertPermission } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    await assertPermission("flows", "edit");
    const session = await auth();
    const organizationId = session?.user?.organizationId;

    if (!session || !organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, nodes, edges } = body;

    if (!nodes || !edges) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Find if the organization already has a flow
    const existingFlow = await prisma.flow.findFirst({
      where: { organizationId },
    });

    let flow;
    if (existingFlow) {
      flow = await prisma.flow.update({
        where: { id: existingFlow.id },
        data: { name: name || existingFlow.name, nodes, edges, status: "Active" },
      });
    } else {
      flow = await prisma.flow.create({
        data: {
          name: name || "Main Chatbot Flow",
          nodes,
          edges,
          organizationId,
          status: "Active",
        },
      });
    }

    return NextResponse.json(flow);
  } catch (error) {
    console.error("Error saving flow:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
