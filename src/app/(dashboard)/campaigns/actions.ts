"use server";

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { assertPermission, getActiveOrgId } from "@/lib/permissions";

export async function uploadCampaignMedia(formData: FormData) {
  try {
    await assertPermission("campaigns", "create");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure bucket exists
    try {
      await supabaseAdmin.storage.createBucket("campaign-media", { public: true });
    } catch {
      // Ignore bucket exists error
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    const { error } = await supabaseAdmin.storage
      .from("campaign-media")
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("campaign-media")
      .getPublicUrl(fileName);

    return { publicUrl };
  } catch (error) {
    console.error("Failed to upload campaign media:", error);
    throw new Error("Failed to upload media");
  }
}

export async function getCampaigns(organizationId: string) {
  try {
    await assertPermission("campaigns", "view");
    const activeOrgId = await getActiveOrgId();
    if (activeOrgId !== organizationId) throw new Error("Unauthorized for this organization");

    const campaigns = await prisma.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
    return campaigns;
  } catch (error) {
    console.error("Failed to get campaigns:", error);
    throw new Error("Failed to load campaigns.");
  }
}

export async function getCampaign(id: string) {
  try {
    await assertPermission("campaigns", "view");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const activeOrgId = await getActiveOrgId();
    const campaign = await prisma.campaign.findUnique({
      where: { id, organizationId: activeOrgId },
    });
    return campaign;
  } catch (error) {
    console.error("Failed to get campaign:", error);
    throw new Error("Failed to load campaign.");
  }
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  type: string;
  templateName?: string;
  variableMapping?: string;
  audienceType: string;
  audienceList?: string[];
  audienceCount: number;
  status?: string;
  organizationId: string;
  whatsAppAccountId?: string;
  mediaUrl?: string;
}) {
  try {
    await assertPermission("campaigns", "create");
    const activeOrgId = await getActiveOrgId();
    if (activeOrgId !== data.organizationId) throw new Error("Unauthorized for this organization");

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        templateName: data.templateName,
        variableMapping: data.variableMapping,
        audienceType: data.audienceType,
        audienceList: data.audienceList,
        audienceCount: data.audienceCount,
        status: data.status || "Draft",
        organizationId: data.organizationId,
        whatsAppAccountId: data.whatsAppAccountId,
        sentAt: data.status === "Active" ? new Date() : null,
      },
    });

    if (campaign.status === "Active") {
      processCampaignInBackground(campaign.id).catch(err => console.error("Campaign background process failed:", err));
    }

    revalidatePath("/campaigns");
    return campaign;
  } catch (error) {
    console.error("Failed to create campaign:", error);
    throw new Error("Failed to create campaign.");
  }
}

export async function updateCampaign(id: string, data: {
  name: string;
  description?: string;
  type: string;
  templateName?: string;
  variableMapping?: string;
  audienceType: string;
  audienceList?: string[];
  audienceCount: number;
  status?: string;
  whatsAppAccountId?: string;
  mediaUrl?: string;
}) {
  try {
    await assertPermission("campaigns", "edit");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const activeOrgId = await getActiveOrgId();
    const campaign = await prisma.campaign.update({
      where: { id, organizationId: activeOrgId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        templateName: data.templateName,
        variableMapping: data.variableMapping,
        audienceType: data.audienceType,
        audienceList: data.audienceList,
        audienceCount: data.audienceCount,
        status: data.status || "Draft",
        whatsAppAccountId: data.whatsAppAccountId,
        sentAt: data.status === "Active" ? new Date() : undefined,
      },
    });

    if (campaign.status === "Active") {
      processCampaignInBackground(campaign.id).catch(err => console.error("Campaign background process failed:", err));
    }

    revalidatePath("/campaigns");
    return campaign;
  } catch (error) {
    console.error("Failed to update campaign:", error);
    throw new Error("Failed to update campaign.");
  }
}

async function processCampaignInBackground(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || !campaign.templateName || !campaign.audienceList || !Array.isArray(campaign.audienceList)) {
      return;
    }

    const { sendWhatsAppTemplate } = await import("@/lib/whatsapp");
    const phones = campaign.audienceList as string[];
    const CHUNK_SIZE = 20; // 20 concurrent requests
    const DELAY_MS = 200; // 200ms delay between chunks (~100 msgs/sec max)

    let deliveredCount = campaign.deliveredCount;
    let hitRateLimit = false;

    for (let i = deliveredCount; i < phones.length; i += CHUNK_SIZE) {
      if (hitRateLimit) break;
      
      const chunk = phones.slice(i, i + CHUNK_SIZE);
      
      const results = await Promise.allSettled(chunk.map(async (phone) => {
        if (hitRateLimit) throw new Error("Rate limit hit");
        
        const components: Record<string, unknown>[] = [];
        
        // Handle Variable Mapping
        const tpl = await prisma.template.findFirst({
          where: { name: campaign.templateName!, organizationId: campaign.organizationId }
        });

        let logBody = `[Template: ${campaign.templateName}]`;
        let logMediaType: string | undefined = undefined;
        let logMediaUrl: string | undefined = undefined;

        if (tpl?.bodyContent) {
           logBody = tpl.bodyContent;
           if (tpl.bodyContent.includes("{{1}}")) {
             let firstName = "there"; // default fallback

             if (campaign.variableMapping === "name") {
               const lead = await prisma.lead.findFirst({
                 where: { phone: { contains: phone }, organizationId: campaign.organizationId }
               });
               if (lead?.name) {
                 firstName = lead.name.split(' ')[0];
               }
             }

             logBody = logBody.replace("{{1}}", firstName);
             components.push({
               type: "body",
               parameters: [
                 { type: "text", text: firstName }
               ]
             });
           }
        }
        
        if (tpl?.headerType && ["image", "video", "document"].includes(tpl.headerType.toLowerCase()) && tpl.headerContent) {
           const finalMediaUrl = tpl.headerContent;
           const mediaTypeLower = tpl.headerType.toLowerCase();
           logMediaType = mediaTypeLower;
           logMediaUrl = finalMediaUrl;
           
           components.push({
             type: "header",
             parameters: [
               {
                 type: mediaTypeLower,
                 [mediaTypeLower]: {
                   link: finalMediaUrl
                 }
               }
             ]
           });
        }

        try {
          await sendWhatsAppTemplate({
            organizationId: campaign.organizationId,
            phoneNumber: phone,
            templateName: campaign.templateName!,
            languageCode: tpl?.language || "en_US",
            components,
            bizOpaqueCallbackData: campaign.id,
            logBody,
            logMediaType,
            logMediaUrl,
            whatsAppAccountId: campaign.whatsAppAccountId || undefined
          });
          return true;
        } catch (err: unknown) {
          const error = err as Error;
          console.error(`Failed to send to ${phone}:`, error);
          if (error.message && (error.message.includes("[131048]") || error.message.includes("[130429]"))) {
             hitRateLimit = true;
          }
          throw err;
        }
      }));

      // Count successes
      const successes = results.filter(r => r.status === "fulfilled").length;
      deliveredCount += successes;

      // Update progress in DB every chunk
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { 
          deliveredCount,
          status: hitRateLimit ? "Paused (Rate Limit)" : "Active" 
        }
      });

      // Throttle to respect Meta API limits
      if (!hitRateLimit && i + CHUNK_SIZE < phones.length) {
        await new Promise(res => setTimeout(res, DELAY_MS));
      }
    }

    if (!hitRateLimit) {
      // Mark as completed
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "Completed" }
      });
    }

    try {
      revalidatePath("/campaigns");
    } catch {
      // Ignore if revalidatePath fails in background context
    }

  } catch (error) {
    console.error(`Fatal error processing campaign ${campaignId}:`, error);
  }
}

export async function launchCampaign(id: string) {
  try {
    await assertPermission("campaigns", "edit");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const campaignData = await prisma.campaign.findUnique({
      where: { id, organizationId: session.user.organizationId },
      select: { audienceCount: true }
    });
    
    if (!campaignData || campaignData.audienceCount === 0) {
      throw new Error("Cannot launch a campaign with 0 recipients.");
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: "Active",
        sentAt: new Date(),
      },
    });
    
    if (campaign.status === "Active") {
      processCampaignInBackground(campaign.id).catch(err => console.error("Campaign background process failed:", err));
    }

    revalidatePath("/campaigns");
    return campaign;
  } catch (error) {
    console.error("Failed to launch campaign:", error);
    throw new Error("Failed to launch campaign.");
  }
}

export async function deleteCampaign(id: string) {
  try {
    await assertPermission("campaigns", "delete");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const activeOrgId = await getActiveOrgId();
    await prisma.campaign.delete({
      where: { id, organizationId: activeOrgId },
    });
    
    revalidatePath("/campaigns");
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    throw new Error("Failed to delete campaign.");
  }
}
