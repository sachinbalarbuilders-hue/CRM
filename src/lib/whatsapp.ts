import { prisma } from "@/auth";

export async function sendWhatsAppMessage({
  organizationId,
  conversationId,
  phoneNumber,
  text,
  mediaUrl,
  mediaType,
  mediaName,
  tempId,
  buttons,
}: {
  organizationId: string;
  conversationId: string;
  phoneNumber: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaName?: string;
  tempId?: string;
  buttons?: { id: string; title: string }[];
}) {
  // Insert message into our DB
  const message = await prisma.message.create({
    data: {
      conversationId,
      body: text || null,
      direction: "outbound",
      status: "sent",
      tempId,
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
      status: "open",
    }
  });

  // Find the default WhatsApp account for this organization
  const account = await prisma.whatsAppAccount.findFirst({
    where: { 
      organizationId,
      isDefaultOutgoing: true 
    }
  }) || await prisma.whatsAppAccount.findFirst({
    where: { organizationId }
  });

  if (!account) {
    throw new Error("No connected WhatsApp account found for this organization");
  }

  // Build Meta payload
  const metaPayload: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber.replace(/[^0-9]/g, ''),
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
  } else if (buttons && buttons.length > 0) {
    metaPayload.type = "interactive";
    if (buttons.length <= 3) {
      metaPayload.interactive = {
        type: "button",
        body: { text: text || "Please select an option" },
        action: {
          buttons: buttons.map(b => ({
            type: "reply",
            reply: { id: b.id, title: b.title.substring(0, 20) } // Meta limits title length
          }))
        }
      };
    } else {
      metaPayload.interactive = {
        type: "list",
        body: { text: text || "Please select an option" },
        action: {
          button: "View Options",
          sections: [
            {
              title: "Options",
              rows: buttons.slice(0, 10).map(b => ({ id: b.id, title: b.title.substring(0, 24) }))
            }
          ]
        }
      };
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

  return message;
}
