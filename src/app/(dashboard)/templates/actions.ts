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

export async function createTemplate(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const language = formData.get("language") as string;
    const headerType = formData.get("headerType") as string;
    const headerContent = formData.get("headerContent") as string | undefined;
    const bodyContent = formData.get("bodyContent") as string;
    const footerContent = formData.get("footerContent") as string | undefined;
    const status = formData.get("status") as string;
    const organizationId = formData.get("organizationId") as string;
    const whatsAppAccountId = formData.get("whatsAppAccountId") as string;
    const file = formData.get("file") as File | null;

    if (!whatsAppAccountId) throw new Error("WhatsApp account ID is required.");

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: whatsAppAccountId }
    });

    if (!account || !account.wabaId) {
      throw new Error("No connected WhatsApp Business Account found.");
    }
    
    if (!account.appId && file) {
      throw new Error("App ID is required in WhatsApp Settings to upload media templates.");
    }

    // Build the Meta components array
    const components: any[] = [];

    if (headerType && headerType !== "none") {
      const headerComp: any = {
        type: "HEADER",
        format: headerType.toUpperCase(),
      };
      if (headerType === "text" && headerContent) {
        headerComp.text = headerContent;
      } else if (file && (headerType === "image" || headerType === "video" || headerType === "document")) {
        // Step 1: Initialize Resumable Upload Session
        const initResponse = await fetch(`https://graph.facebook.com/${account.apiVersion}/${account.appId}/uploads?file_length=${file.size}&file_type=${file.type}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${account.accessToken}`
          }
        });
        const initResult = await initResponse.json();
        
        if (!initResponse.ok || !initResult.id) {
          throw new Error("Failed to initialize Meta upload session: " + (initResult.error?.message || "Unknown error"));
        }
        
        const uploadSessionId = initResult.id;
        
        // Step 2: Upload File Data
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const uploadResponse = await fetch(`https://graph.facebook.com/${account.apiVersion}/${uploadSessionId}`, {
          method: "POST",
          headers: {
            "Authorization": `OAuth ${account.accessToken}`,
            "file_offset": "0"
          },
          body: fileBuffer
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (!uploadResponse.ok || !uploadResult.h) {
          throw new Error("Failed to upload media to Meta: " + (uploadResult.error?.message || "Unknown error"));
        }
        
        // Add handle to component
        headerComp.example = {
          header_handle: [uploadResult.h]
        };
      }
      components.push(headerComp);
    }

    components.push({
      type: "BODY",
      text: bodyContent
    });

    if (footerContent) {
      components.push({
        type: "FOOTER",
        text: footerContent
      });
    }

    const payload = {
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      language: language,
      category: category.toUpperCase(),
      components
    };

    const response = await fetch(`https://graph.facebook.com/${account.apiVersion}/${account.wabaId}/message_templates`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${account.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Meta Template Creation Error:", result);
      throw new Error(result.error?.message || result.error?.error_user_msg || "Failed to submit template to Meta.");
    }

    let finalStatus = "Pending";
    if (result.status === "APPROVED") finalStatus = "Approved";
    else if (result.status === "REJECTED") finalStatus = "Rejected";

    const template = await prisma.template.create({
      data: {
        name: payload.name, // Save the sanitized name
        category: category,
        language: language,
        headerType: headerType,
        headerContent: headerContent,
        bodyContent: bodyContent,
        footerContent: footerContent,
        status: finalStatus,
        organizationId: organizationId,
        whatsAppAccountId: account.id,
      },
    });

    revalidatePath("/templates");
    return template;
  } catch (error: any) {
    console.error("Failed to create template:", error);
    throw new Error(error.message || "Failed to create template.");
  }
}

export async function updateTemplate(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const language = formData.get("language") as string;
    const headerType = formData.get("headerType") as string;
    const headerContent = formData.get("headerContent") as string | undefined;
    const bodyContent = formData.get("bodyContent") as string;
    const footerContent = formData.get("footerContent") as string | undefined;
    const whatsAppAccountId = formData.get("whatsAppAccountId") as string;
    const file = formData.get("file") as File | null;

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) throw new Error("Template not found in database.");

    // If an account ID was passed, use it, otherwise fall back to the existing one
    const targetAccountId = whatsAppAccountId || existing.whatsAppAccountId;
    if (!targetAccountId) throw new Error("No WhatsApp account linked to this template.");

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: targetAccountId }
    });

    if (!account || !account.wabaId) {
      throw new Error("No connected WhatsApp Business Account found.");
    }

    // Step 1: Fetch Meta Template ID
    // We fetch all templates and find the match in memory because the Graph API name filter can be unreliable
    const listResponse = await fetch(`https://graph.facebook.com/${account.apiVersion}/${account.wabaId}/message_templates?limit=100`, {
      headers: { "Authorization": `Bearer ${account.accessToken}` }
    });
    const listResult = await listResponse.json();
    
    let metaTemplateId = null;
    let metaTemplate = null;
    if (listResult.data && Array.isArray(listResult.data)) {
      const allMatches = listResult.data.filter((t: any) => t.name === existing.name);
      if (allMatches.length > 0) {
        metaTemplate = allMatches.find((t: any) => t.language === language) || allMatches[0];
        metaTemplateId = metaTemplate.id;
      }
    }
    
    if (!metaTemplateId) {
      console.error("Meta API list result:", listResult);
      throw new Error("Could not find this template in Meta. It may have been deleted or not successfully created yet.");
    }

    // Step 2: Build Components
    const components: any[] = [];
    if (headerType && headerType !== "none") {
      const headerComp: any = { type: "HEADER", format: headerType.toUpperCase() };
      if (headerType === "text" && headerContent) {
        headerComp.text = headerContent;
      } else if (file && (headerType === "image" || headerType === "video" || headerType === "document")) {
        if (!account.appId) throw new Error("App ID is required in WhatsApp Settings to upload new media.");
        const initResponse = await fetch(`https://graph.facebook.com/${account.apiVersion}/${account.appId}/uploads?file_length=${file.size}&file_type=${file.type}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${account.accessToken}` }
        });
        const initResult = await initResponse.json();
        if (!initResponse.ok) throw new Error(initResult.error?.message || "Failed to init upload");
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const uploadResponse = await fetch(`https://graph.facebook.com/${account.apiVersion}/${initResult.id}`, {
          method: "POST",
          headers: { "Authorization": `OAuth ${account.accessToken}`, "file_offset": "0" },
          body: fileBuffer
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadResult.error?.message || "Failed to upload media");
        
        headerComp.example = { header_handle: [uploadResult.h] };
      } else if (metaTemplate && metaTemplate.components) {
        // No new file uploaded, so reuse the existing media example from Meta to prevent rejection
        const existingHeader = metaTemplate.components.find((c: any) => c.type === "HEADER");
        if (existingHeader && existingHeader.example) {
          headerComp.example = existingHeader.example;
        }
      }
      components.push(headerComp);
    }

    components.push({ type: "BODY", text: bodyContent });
    if (footerContent) components.push({ type: "FOOTER", text: footerContent });

    // Step 3: Send to Meta API
    const updateResponse = await fetch(`https://graph.facebook.com/${account.apiVersion}/${metaTemplateId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${account.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ components })
    });

    const updateResult = await updateResponse.json();
    if (!updateResponse.ok) {
      console.error("Meta Update Error Detailed:", JSON.stringify(updateResult, null, 2));
      console.error("Payload sent to Meta:", JSON.stringify({ components }, null, 2));
      throw new Error(updateResult.error?.error_user_msg || updateResult.error?.message || "Failed to update template in Meta.");
    }

    let finalStatus = "Pending";
    if (updateResult.status === "APPROVED") finalStatus = "Approved";
    else if (updateResult.status === "REJECTED") finalStatus = "Rejected";

    // Step 4: Update Database
    const template = await prisma.template.update({
      where: { id },
      data: {
        category,
        headerType,
        headerContent,
        bodyContent,
        footerContent,
        status: finalStatus,
        whatsAppAccountId: account.id,
      },
    });

    revalidatePath("/templates");
    return template;
  } catch (error: any) {
    console.error("Failed to update template:", error);
    throw new Error(error.message || "Failed to update template.");
  }
}

export async function deleteTemplate(id: string) {
  try {
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) throw new Error("Template not found");

    // Try deleting from Meta if account is linked
    if (template.whatsAppAccountId) {
      const account = await prisma.whatsAppAccount.findUnique({
        where: { id: template.whatsAppAccountId }
      });

      if (account && account.wabaId && account.accessToken) {
        const deleteResponse = await fetch(`https://graph.facebook.com/${account.apiVersion || "v20.0"}/${account.wabaId}/message_templates?name=${template.name}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${account.accessToken}`
          }
        });

        if (!deleteResponse.ok) {
          const deleteResult = await deleteResponse.json();
          console.error("Failed to delete template from Meta:", deleteResult);
          // We intentionally don't throw here so we can still delete it from the CRM database
          // even if Meta already deleted it or threw an error.
        }
      }
    }

    await prisma.template.delete({
      where: { id },
    });
    
    revalidatePath("/templates");
  } catch (error) {
    console.error("Failed to delete template:", error);
    throw new Error("Failed to delete template.");
  }
}

export async function syncTemplatesFromMeta(whatsAppAccountId: string) {
  try {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: whatsAppAccountId }
    });

    if (!account) {
      throw new Error("No WhatsApp account found to sync templates from.");
    }

    const response = await fetch(`https://graph.facebook.com/${account.apiVersion}/${account.wabaId}/message_templates`, {
      headers: {
        'Authorization': `Bearer ${account.accessToken}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to fetch templates from Meta.");
    }

    if (result.data && Array.isArray(result.data)) {
      for (const metaTpl of result.data) {
        let headerType = "none";
        let headerContent = "";
        let bodyContent = "";
        let footerContent = "";

        // Parse components
        if (metaTpl.components) {
          for (const comp of metaTpl.components) {
            if (comp.type === "HEADER") {
              headerType = comp.format ? comp.format.toLowerCase() : "text";
              if (headerType === "text") {
                headerContent = comp.text || "";
              } else if (comp.example?.header_url?.length > 0) {
                headerContent = comp.example.header_url[0];
              } else if (comp.example?.header_handle?.length > 0) {
                headerContent = comp.example.header_handle[0];
              }
            } else if (comp.type === "BODY") {
              bodyContent = comp.text || "";
            } else if (comp.type === "FOOTER") {
              footerContent = comp.text || "";
            }
          }
        }

        // Map status
        let status = "Pending";
        if (metaTpl.status === "APPROVED") status = "Approved";
        else if (metaTpl.status === "REJECTED") status = "Rejected";

        await prisma.template.upsert({
          where: { name_organizationId: { name: metaTpl.name, organizationId: account.organizationId } },
          update: {
            category: metaTpl.category?.toLowerCase() || "utility",
            language: metaTpl.language,
            status,
            headerType,
            headerContent,
            bodyContent,
            footerContent,
            whatsAppAccountId: account.id,
          },
          create: {
            name: metaTpl.name,
            category: metaTpl.category?.toLowerCase() || "utility",
            language: metaTpl.language,
            status,
            headerType,
            headerContent,
            bodyContent,
            footerContent,
            organizationId: account.organizationId,
            whatsAppAccountId: account.id,
          }
        });
      }
    }

    revalidatePath("/templates");
  } catch (error: any) {
    console.error("Failed to sync templates:", error);
    throw new Error(error.message || "Failed to sync templates.");
  }
}
