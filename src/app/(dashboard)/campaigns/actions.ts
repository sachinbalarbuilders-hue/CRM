"use server";

import { prisma } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getCampaigns(organizationId: string) {
  try {
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
    const campaign = await prisma.campaign.findUnique({
      where: { id },
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
}) {
  try {
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
}) {
  try {
    const campaign = await prisma.campaign.update({
      where: { id },
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
        
        let components: any[] = [];
        
        // Handle Variable Mapping
        const tpl = await prisma.template.findFirst({
          where: { name: campaign.templateName!, organizationId: campaign.organizationId }
        });

        let logBody = `[Template: ${campaign.templateName}]`;
        let logMediaType: string | undefined = undefined;
        let logMediaUrl: string | undefined = undefined;

        if (tpl?.bodyContent) {
           logBody = tpl.bodyContent;
           if (campaign.variableMapping === "name" && tpl.bodyContent.includes("{{1}}")) {
             const lead = await prisma.lead.findFirst({
               where: { phone: { contains: phone }, organizationId: campaign.organizationId }
             });
             const firstName = lead?.name ? lead.name.split(' ')[0] : "there";
             logBody = logBody.replace("{{1}}", firstName);
             components = [
               {
                 type: "body",
                 parameters: [
                   { type: "text", text: firstName }
                 ]
               }
             ];
           }
        }
        
        if (tpl?.headerType && ["image", "video", "document"].includes(tpl.headerType) && tpl.headerContent) {
           logMediaType = tpl.headerType;
           logMediaUrl = tpl.headerContent;
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
            logMediaUrl
          });
          return true;
        } catch (err: any) {
          console.error(`Failed to send to ${phone}:`, err);
          if (err.message && (err.message.includes("[131048]") || err.message.includes("[130429]"))) {
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
    } catch (e) {
      // Ignore if revalidatePath fails in background context
    }

  } catch (error) {
    console.error(`Fatal error processing campaign ${campaignId}:`, error);
  }
}

export async function launchCampaign(id: string) {
  try {
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
    await prisma.campaign.delete({
      where: { id },
    });
    
    revalidatePath("/campaigns");
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    throw new Error("Failed to delete campaign.");
  }
}
