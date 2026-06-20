import { NextResponse } from "next/server";
import { prisma } from "@/auth";

export async function GET() {
  await prisma.flow.deleteMany();
  return NextResponse.json({ success: true });
}
