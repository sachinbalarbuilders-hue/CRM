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

    revalidatePath("/campaigns");
    return campaign;
  } catch (error) {
    console.error("Failed to update campaign:", error);
    throw new Error("Failed to update campaign.");
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
