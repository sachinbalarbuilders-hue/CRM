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
  } else if (text && text.trim().match(/^https?:\/\/[^\s]+$/)) {
    metaPayload.type = "interactive";
    metaPayload.interactive = {
      type: "cta_url",
      body: { text: "Click the button below to view the link:" },
      action: {
        name: "cta_url",
        parameters: {
          display_text: "View Link",
          url: text.trim()
        }
      }
    };
  } else {
    metaPayload.type = "text";
    metaPayload.text = { preview_url: true, body: text };
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

export async function sendWhatsAppTemplate({
  organizationId,
  phoneNumber,
  templateName,
  languageCode = "en_US",
  components = [],
  bizOpaqueCallbackData,
  logBody,
  logMediaType,
  logMediaUrl,
  whatsAppAccountId
}: {
  organizationId: string;
  phoneNumber: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
  bizOpaqueCallbackData?: string;
  logBody?: string;
  logMediaType?: string;
  logMediaUrl?: string;
  whatsAppAccountId?: string;
}) {
  let account;
  if (whatsAppAccountId) {
    account = await prisma.whatsAppAccount.findUnique({ where: { id: whatsAppAccountId } });
  } else {
    account = await prisma.whatsAppAccount.findFirst({
      where: { 
        organizationId,
        isDefaultOutgoing: true 
      }
    }) || await prisma.whatsAppAccount.findFirst({
      where: { organizationId }
    });
  }

  if (!account) {
    throw new Error("No connected WhatsApp account found for this organization");
  }

  // Ensure there is a conversation log for this recipient
  let conversation = await prisma.conversation.findFirst({
    where: { phoneNumber, organizationId }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        phoneNumber,
        organizationId,
        status: "archived" // Campaigns are archived until they reply
      }
    });
  }

  const metaPayload: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber.replace(/[^0-9]/g, ''),
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: components
    }
  };

  if (bizOpaqueCallbackData) {
    metaPayload.biz_opaque_callback_data = bizOpaqueCallbackData;
  }

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
    console.error("Meta API Template Error:", metaResult);
    
    // Log failed message attempt
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        body: logBody || `[Template: ${templateName}]`,
        mediaType: logMediaType,
        mediaUrl: logMediaUrl,
        direction: "outbound",
        status: "failed",
        campaignId: bizOpaqueCallbackData || undefined,
      }
    });

    const errorCode = metaResult.error?.code || 'Unknown';
    throw new Error(`Meta API error [${errorCode}]: ${metaResult.error?.message || 'Unknown error'}`);
  }

  const waMessageId = metaResult.messages?.[0]?.id;

  // Log successful message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      body: logBody || `[Template: ${templateName}]`,
      mediaType: logMediaType,
      mediaUrl: logMediaUrl,
      direction: "outbound",
      status: "sent",
      waMessageId,
      campaignId: bizOpaqueCallbackData || undefined,
    }
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessage: logMediaType ? `[${logMediaType}] ${logBody || `Template: ${templateName}`}` : (logBody || `[Template: ${templateName}]`),
      lastMessageAt: new Date()
    }
  });

  return metaResult;
}
