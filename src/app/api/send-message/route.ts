import { NextResponse } from "next/server";
import { prisma } from "@/auth";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, text, tempId, mediaUrl, mediaType, mediaName } = await req.json();

    if (!conversationId || (!text && !mediaUrl)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Insert message
    const message = await prisma.message.create({
      data: {
        conversationId,
        body: text,
        direction: "outbound",
        status: "sent",
        tempId: tempId, // Keep tempId for UI deduplication
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        mediaName: mediaName || null,
      }
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: text 
          ? text.substring(0, 50) + (text.length > 50 ? "..." : "") 
          : `Sent a ${mediaType || "file"}`,
        lastMessageAt: new Date(),
        status: "open", // Reopen if it was resolved
        activeFlowId: null, // Instantly disable any active bot flow
        currentFlowNodeId: "transferred", // Mark as human-controlled so bot ignores inbound replies
      }
    });

    // Find the default WhatsApp account for this organization
    const account = await prisma.whatsAppAccount.findFirst({
      where: { 
        organizationId: conversation.organizationId,
        isDefaultOutgoing: true 
      }
    }) || await prisma.whatsAppAccount.findFirst({
      where: { organizationId: conversation.organizationId }
    });

    if (!account) {
      throw new Error("No connected WhatsApp account found for this organization");
    }

    // Build Meta payload
    let metaPayload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: conversation.phoneNumber.replace(/[^0-9]/g, ''),
    };

    if (mediaUrl && mediaType) {
      const typeStr = mediaType === "document" ? "document" :
                      mediaType === "video" ? "video" :
                      mediaType === "audio" ? "audio" :
                      mediaType === "sticker" ? "sticker" : "image";
      
      metaPayload.type = typeStr;
      metaPayload[typeStr] = {
        link: mediaUrl
      };
      
      if (text && typeStr !== "audio" && typeStr !== "sticker") {
        metaPayload[typeStr].caption = text;
      }
      
      if (typeStr === "document" && mediaName) {
        metaPayload[typeStr].filename = mediaName;
      }
    } else {
      metaPayload.type = "text";
      metaPayload.text = { preview_url: false, body: text };
    }

    // Send the message via Meta WhatsApp API
    const metaResponse = await fetch(`https://graph.facebook.com/${account.apiVersion}/${account.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaPayload)
    });

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      // Mark message as failed
      await prisma.message.update({
        where: { id: message.id },
        data: { status: "failed" }
      });
      console.error("Meta API Error:", metaResult);
      throw new Error(`Meta API error: ${metaResult.error?.message || 'Unknown error'}`);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
