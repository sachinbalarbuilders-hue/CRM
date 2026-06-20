"use server";

import { prisma } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getTemplates(organizationId: string) {
  try {
    const templates = await prisma.template.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    });
    return templates;
  } catch (error) {
    console.error("Failed to get templates:", error);
    throw new Error("Failed to load templates.");
  }
}

export async function getTemplate(id: string) {
  try {
    const template = await prisma.template.findUnique({
      where: { id },
    });
    return template;
  } catch (error) {
    console.error("Failed to get template:", error);
    throw new Error("Failed to load template.");
  }
}

export async function createTemplate(data: {
  name: string;
  category: string;
  language: string;
  headerType: string;
  headerContent?: string;
  bodyContent: string;
  footerContent?: string;
  status: string;
  organizationId: string;
}) {
  try {
    const template = await prisma.template.create({
      data: {
        name: data.name,
        category: data.category,
        language: data.language,
        headerType: data.headerType,
        headerContent: data.headerContent,
        bodyContent: data.bodyContent,
        footerContent: data.footerContent,
        status: data.status,
        organizationId: data.organizationId,
      },
    });

    revalidatePath("/templates");
    return template;
  } catch (error) {
    console.error("Failed to create template:", error);
    throw new Error("Failed to create template.");
  }
}

export async function updateTemplate(id: string, data: {
  name: string;
  category: string;
  language: string;
  headerType: string;
  headerContent?: string;
  bodyContent: string;
  footerContent?: string;
  status?: string;
}) {
  try {
    const template = await prisma.template.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        language: data.language,
        headerType: data.headerType,
        headerContent: data.headerContent,
        bodyContent: data.bodyContent,
        footerContent: data.footerContent,
        status: data.status,
      },
    });

    revalidatePath("/templates");
    return template;
  } catch (error) {
    console.error("Failed to update template:", error);
    throw new Error("Failed to update template.");
  }
}

export async function deleteTemplate(id: string) {
  try {
    await prisma.template.delete({
      where: { id },
    });
    
    revalidatePath("/templates");
  } catch (error) {
    console.error("Failed to delete template:", error);
    throw new Error("Failed to delete template.");
  }
}
