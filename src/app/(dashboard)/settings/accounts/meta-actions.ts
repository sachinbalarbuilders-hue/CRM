"use server";

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getMetaAccountDetails(accountId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const account = await prisma.whatsAppAccount.findUnique({
    where: { 
      id: accountId,
      organizationId: session.user.organizationId
    }
  });

  if (!account) {
    throw new Error("Account not found");
  }

  return account;
}

export async function testMetaConnection(accountId: string) {
  const account = await getMetaAccountDetails(accountId);
  
  const url = `https://graph.facebook.com/${account.apiVersion}/${account.phoneNumberId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to connect to Meta");
    }
    
    // Save success to DB
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: { status: "CONNECTED", lastTestedAt: new Date() }
    });
    
    revalidatePath("/settings/accounts");
    return { success: true, data };
  } catch (error: any) {
    // Save failure to DB
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: { status: "DISCONNECTED", lastTestedAt: new Date() }
    });
    
    revalidatePath("/settings/accounts");
    throw new Error(`Connection test failed: ${error.message}`);
  }
}

export async function getBusinessProfile(accountId: string) {
  const account = await getMetaAccountDetails(accountId);
  
  const url = `https://graph.facebook.com/${account.apiVersion}/${account.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch business profile");
    }
    
    // The API returns an array of profiles under 'data'
    return data.data?.[0] || null;
  } catch (error: any) {
    throw new Error(`Failed to get business profile: ${error.message}`);
  }
}

export async function updateBusinessProfile(accountId: string, profileData: any) {
  const account = await getMetaAccountDetails(accountId);
  
  const url = `https://graph.facebook.com/${account.apiVersion}/${account.phoneNumberId}/whatsapp_business_profile`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.accessToken}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        ...profileData
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to update business profile");
    }
    
    return { success: true, data };
  } catch (error: any) {
    throw new Error(`Failed to update business profile: ${error.message}`);
  }
}

export async function subscribeWebhook(accountId: string) {
  const account = await getMetaAccountDetails(accountId);
  
  // Webhook subscriptions must be done at the WhatsApp Business Account (WABA) level
  const url = `https://graph.facebook.com/${account.apiVersion}/${account.wabaId}/subscribed_apps`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to subscribe webhook");
    }
    
    return { success: true, data };
  } catch (error: any) {
    throw new Error(`Subscribe failed: ${error.message}`);
  }
}
export async function uploadProfilePicture(accountId: string, formData: FormData) {
  const account = await getMetaAccountDetails(accountId);
  
  if (!account.appId) {
    throw new Error("Meta App ID is not configured for this account. Cannot upload profile picture.");
  }
  
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }
  
  const fileType = file.type;
  const fileLength = file.size;
  
  // Step 1: Initialize Upload Session
  const initUrl = `https://graph.facebook.com/${account.apiVersion}/${account.appId}/uploads?file_length=${fileLength}&file_type=${fileType}`;
  
  const initResponse = await fetch(initUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`
    }
  });
  
  const initData = await initResponse.json();
  if (!initResponse.ok) {
    throw new Error(initData.error?.message || "Failed to initialize upload session");
  }
  
  const uploadSessionId = initData.id;
  
  // Step 2: Upload File Data
  const uploadUrl = `https://graph.facebook.com/${account.apiVersion}/${uploadSessionId}`;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${account.accessToken}`,
      file_offset: "0"
    },
    body: buffer
  });
  
  const uploadData = await uploadResponse.json();
  if (!uploadResponse.ok) {
    throw new Error(uploadData.error?.message || "Failed to upload file data");
  }
  
  return { success: true, handle: uploadData.h };
}
