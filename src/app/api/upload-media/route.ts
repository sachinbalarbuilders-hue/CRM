import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 16MB limit" }, { status: 400 });
    }

    const allowedMimeTypes = [
      "image/jpeg", "image/png", "image/webp",
      "video/mp4", "video/3gpp",
      "audio/aac", "audio/mp4", "audio/mpeg", "audio/amr", "audio/ogg",
      "application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Uploads are restricted to images, videos, audio, and documents." }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    
    const { data, error } = await supabaseAdmin.storage
      .from('whatsapp-media')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(error.message);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('whatsapp-media')
      .getPublicUrl(fileName);

    let mediaType = "document";
    if (file.type.startsWith("image/")) {
      mediaType = file.type === "image/webp" ? "sticker" : "image";
    } else if (file.type.startsWith("video/")) {
      mediaType = "video";
    } else if (file.type.startsWith("audio/")) {
      mediaType = "audio";
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrlData.publicUrl,
      mediaType,
      mediaName: file.name
    });

  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
