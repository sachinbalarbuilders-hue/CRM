import { NextResponse } from 'next/server';
import { prisma } from '@/auth';

export async function GET(req: Request) {
  const messages = await prisma.message.findMany({
    where: { conversationId: 'cmqgpqk2j0005ucdczvmi8s9r' },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({
    messages: messages.map(m => ({
      body: m.body,
      createdAt: m.createdAt,
      localTime: new Date(m.createdAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })
    }))
  });
}
