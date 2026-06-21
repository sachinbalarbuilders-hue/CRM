import { NextResponse } from "next/server";
import { prisma } from "@/auth";

export async function GET() {
  const c = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 1 });
  return NextResponse.json(c[0]);
}
