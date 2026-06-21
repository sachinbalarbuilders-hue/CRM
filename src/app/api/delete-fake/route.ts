import { NextResponse } from "next/server";
import { prisma } from "@/auth";

export async function GET() {
  try {
    const deleted = await prisma.template.deleteMany({
      where: {
        name: {
          in: ["diwali_offer_v1", "site_visit_reminder"]
        }
      }
    });
    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
