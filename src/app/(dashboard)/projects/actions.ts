"use server";

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { assertPermission } from "@/lib/permissions";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadBrochure(formData: FormData) {
  try {
    await assertPermission("projects", "create");
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file provided" };

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Ensure bucket exists or ignore error
    try {
      await supabase.storage.createBucket("brochures", { public: true });
    } catch (e) {}

    const { data, error } = await supabase.storage
      .from("brochures")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("brochures")
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Upload failed:", error);
    return { success: false, error: "Upload failed" };
  }
}

export async function createProject(data: {
  organizationId: string;
  name: string;
  description?: string;
  type?: string;
  location?: string;
  brochureUrl?: string;
  virtualTourUrl?: string;
  order?: number;
  status?: string;
}) {
  try {
    await assertPermission("projects", "create");
    const session = await auth();
    if (!session?.user || session.user.organizationId !== data.organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        location: data.location,
        brochureUrl: data.brochureUrl,
        virtualTourUrl: data.virtualTourUrl,
        order: data.order || 0,
        status: data.status || "ACTIVE",
        organizationId: data.organizationId,
      },
    });
    revalidatePath("/projects");
    return { success: true, project };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateProject(id: string, data: {
  name?: string;
  description?: string;
  type?: string;
  location?: string;
  brochureUrl?: string;
  virtualTourUrl?: string;
  order?: number;
  status?: string;
}) {
  try {
    await assertPermission("projects", "edit");
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const project = await prisma.project.update({
      where: { id, organizationId: session.user.organizationId },
      data,
    });
    revalidatePath("/projects");
    return { success: true, project };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProject(id: string) {
  try {
    await assertPermission("projects", "delete");
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await prisma.project.delete({
      where: { id, organizationId: session.user.organizationId },
    });
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}
