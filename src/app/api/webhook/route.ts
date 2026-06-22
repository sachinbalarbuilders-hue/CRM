import { NextResponse } from "next/server";
import { prisma } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { processFlow } from "@/lib/flowEngine";

// Meta Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    // Look up the token in our database to see if it matches any account
    const account = await prisma.whatsAppAccount.findUnique({
      where: { webhookVerifyToken: token },
    });

    if (account) {
      console.log(`Webhook verified successfully for account: ${account.name}`);
      // Meta requires returning the challenge EXACTLY as provided (plain text)
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } else {
      console.error("Webhook verification failed: Token not found in database.");
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

// Meta Webhook Event Processing
export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      console.error("Missing X-Hub-Signature-256 header");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const rawBody = await request.text();
    const appSecret = process.env.META_APP_SECRET;
    
    if (!appSecret) {
      console.error("META_APP_SECRET is not configured");
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    // Verify signature
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", appSecret);
    const expectedSignature = `sha256=${hmac.update(rawBody).digest("hex")}`;

    if (signature !== expectedSignature) {
      console.error("Invalid Webhook Signature");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = JSON.parse(rawBody);
    
    // Meta wraps events in 'entry' arrays
    if (body.object === "whatsapp_business_account" && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages" && change.value.messages) {
            const value = change.value;
            const wabaPhoneId = value.metadata.phone_number_id;
            
            // Find the WhatsApp account to get the organizationId
            const account = await prisma.whatsAppAccount.findFirst({
              where: { phoneNumberId: wabaPhoneId },
            });

            if (!account) {
              console.error("No WhatsApp account found for phone_number_id:", wabaPhoneId);
              continue;
            }

            for (const msg of value.messages) {
              const fromPhone = msg.from;
              const contactName = value.contacts?.find((c: any) => c.wa_id === fromPhone)?.profile?.name || "Unknown";
              const isMedia = ['image', 'video', 'audio', 'document', 'sticker'].includes(msg.type);
              
              let textBody = "";
              let payloadId = "";
              let mediaId: string | undefined = undefined;
              let mediaType: string | undefined = undefined;
              let mediaUrl: string | undefined = undefined;
              let mediaName: string | undefined = undefined;

              if (msg.type === "text") {
                textBody = msg.text.body;
                payloadId = msg.text.body;
              } else if (isMedia) {
                mediaType = msg.type;
                mediaId = msg[msg.type].id;
                textBody = msg[msg.type].caption ?? "";
                mediaName = msg[msg.type].filename ?? `${mediaId}`;
                const mimeType = msg[msg.type].mime_type;

                try {
                  // 1. Get temporary download URL from Meta
                  const urlRes = await fetch(
                    `https://graph.facebook.com/v21.0/${mediaId}`,
                    { headers: { Authorization: `Bearer ${account.accessToken}` } }
                  );
                  const urlData = await urlRes.json();
                  
                  if (urlData.url) {
                    // 2. Download the file
                    const fileRes = await fetch(urlData.url, {
                      headers: { Authorization: `Bearer ${account.accessToken}` }
                    });
                    const buffer = await fileRes.arrayBuffer();

                    // 3. Determine folder
                    const folderMap: Record<string, string> = {
                      image: 'images',
                      video: 'videos',
                      audio: 'audio',
                      document: 'documents',
                      sticker: 'stickers',
                    };
                    const filePath = `${folderMap[msg.type]}/${mediaId}-${mediaName}`;

                    // 4. Upload to Supabase Storage
                    const { error: uploadError } = await supabaseAdmin.storage
                      .from('whatsapp-media')
                      .upload(filePath, buffer, {
                        contentType: mimeType,
                        upsert: true,
                      });

                    if (uploadError) {
                      console.error('Supabase storage upload failed:', uploadError);
                    } else {
                      // 5. Get permanent public URL
                      const { data: publicUrlData } = supabaseAdmin.storage
                        .from('whatsapp-media')
                        .getPublicUrl(filePath);
                      
                      mediaUrl = publicUrlData.publicUrl;
                    }
                  } else {
                    console.error("Failed to get media URL from Meta:", urlData);
                  }
                } catch (err) {
                  console.error("Failed to download and upload media:", err);
                }
              } else if (msg.type === "interactive") {
                if (msg.interactive.type === "button_reply") {
                  textBody = msg.interactive.button_reply.title || msg.interactive.button_reply.id;
                  payloadId = msg.interactive.button_reply.id;
                } else if (msg.interactive.type === "list_reply") {
                  textBody = msg.interactive.list_reply.title || msg.interactive.list_reply.id;
                  payloadId = msg.interactive.list_reply.id;
                }
              } else {
                // Unsupported message type
                console.log(`Unsupported message type: ${msg.type}`);
                continue;
              }

              // Find existing conversation to check its previous status
              const existingConv = await prisma.conversation.findUnique({
                where: {
                  phoneNumber_organizationId: {
                    phoneNumber: fromPhone,
                    organizationId: account.organizationId,
                  }
                }
              });
              const wasResolved = existingConv?.status === "resolved";
              
              // Auto-resolve check: If the last message was over 24 hours ago, 
              // we treat it as resolved so the bot can wake up.
              let isStale = false;
              if (existingConv?.lastMessageAt) {
                const hoursSinceLastMessage = (new Date().getTime() - new Date(existingConv.lastMessageAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastMessage > 24) {
                  isStale = true;
                }
              }

              // Find or create conversation
              const conversation = await prisma.conversation.upsert({
                where: {
                  phoneNumber_organizationId: {
                    phoneNumber: fromPhone,
                    organizationId: account.organizationId,
                  }
                },
                update: {
                  lastMessage: isMedia ? (textBody ? `📷 ${textBody}` : `📁 ${mediaType}`) : textBody,
                  lastMessageAt: new Date(),
                  unreadCount: { increment: 1 },
                  contactName: contactName !== "Unknown" ? contactName : undefined,
                  status: "open", // Reopen if it was resolved
                },
                create: {
                  phoneNumber: fromPhone,
                  contactName: contactName,
                  organizationId: account.organizationId,
                  lastMessage: isMedia ? (textBody ? `📷 ${textBody}` : `📁 ${mediaType}`) : textBody,
                  lastMessageAt: new Date(),
                  unreadCount: 1,
                }
              });

              // Create the inbound message
              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  body: textBody || null,
                  mediaId,
                  mediaType,
                  mediaUrl,
                  mediaName,
                  waMessageId: msg.id,
                  direction: "inbound",
                  status: "received",
                  tempId: msg.id,
                }
              });
              
              console.log(`Saved inbound message from ${fromPhone}: ${isMedia ? 'Media ' + mediaType : textBody}`);

              // Chatbot / Flow Engine Integration
              if (textBody) {
                const textBodyLower = textBody.trim().toLowerCase();
                const isForceRestart = ["0", "menu", "restart", "main menu"].includes(textBodyLower);
                
                // Start the bot IF:
                // 1. It's a brand new chat / no active flow (and they aren't talking to an agent)
                // 2. OR the chat was previously resolved (wake up the bot)
                // 3. OR the chat has been idle for > 24 hours (wake up the bot)
                // 4. OR they explicitly typed "menu" or "0" to force restart the flow
                const isNewOrResolved = !conversation.activeFlowId && (conversation.currentFlowNodeId !== "transferred" || wasResolved || isStale);

                if (isNewOrResolved || isForceRestart) {
                  // Find the active chatbot flow for the organization
                  const botFlow = await prisma.flow.findFirst({
                    where: { organizationId: account.organizationId, status: "Active" }
                  });

                  if (botFlow) {
                    await prisma.conversation.update({
                      where: { id: conversation.id },
                      data: { activeFlowId: botFlow.id, currentFlowNodeId: null }
                    });
                    // Trigger the flow from the beginning
                    await processFlow(conversation.id, payloadId || textBody);
                  }
                } else if (conversation.activeFlowId) {
                  // If they are already in a flow, pass their reply to the engine
                  await processFlow(conversation.id, payloadId || textBody);
                }
              }
            }
          } else if (change.field === "messages" && change.value.statuses) {
            // Handle message status updates (sent, delivered, read, failed)
            const value = change.value;
            for (const status of value.statuses) {
              const { id: wamid, status: statusType, biz_opaque_callback_data: campaignId } = status;
              
              // Update the Message table status
              await prisma.message.updateMany({
                where: { waMessageId: wamid },
                data: { status: statusType }
              });

              // If this was part of a campaign, update campaign metrics
              if (campaignId) {
                if (statusType === "read") {
                  await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { readCount: { increment: 1 } }
                  }).catch(() => {}); // ignore if campaign deleted
                } else if (statusType === "failed") {
                  // If it failed, we could optionally decrement deliveredCount or track failures
                }
              }
            }
          }
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
