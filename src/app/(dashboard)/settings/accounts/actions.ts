"use server";

import { revalidatePath } from "next/cache";
import { auth, prisma } from "@/auth";
import { z } from "zod";
import { assertPermission } from "@/lib/permissions";
import { cookies } from "next/headers";

const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  appId: z.string().optional().or(z.literal("")),
  phoneNumberId: z.string().min(1, "Phone Number ID is required"),
  wabaId: z.string().min(1, "WhatsApp Business Account ID is required"),
  apiVersion: z.string().default("v21.0"),
  accessToken: z.string().min(1, "Access Token is required"),
  appSecret: z.string().optional().or(z.literal("")),
  isDefaultIncoming: z.boolean().default(false),
  isDefaultOutgoing: z.boolean().default(false),
  autoReadReceipts: z.boolean().default(true),
});

export type AccountFormData = z.infer<typeof accountSchema>;

export async function createWhatsAppAccount(data: AccountFormData) {
  // Enforce permission: must have "create" on "accounts"
  await assertPermission("accounts", "create");

  const session = await auth();
  const cookieStore = await cookies();
  const organizationId =
    cookieStore.get("activeOrganizationId")?.value || session!.user.organizationId as string;

  if (!organizationId) {
    throw new Error("User does not belong to an organization");
  }

  const validatedFields = accountSchema.parse(data);

  // Generate a unique verify token for the new account
  const crypto = require("crypto");
  const verifyToken = `whm_${crypto.randomBytes(16).toString("hex")}`;

  await prisma.whatsAppAccount.create({
    data: {
      ...validatedFields,
      organizationId,
      webhookVerifyToken: verifyToken,
    },
  });

  revalidatePath("/settings/accounts");
  return { success: true };
}

export async function updateWhatsAppAccount(id: string, data: AccountFormData) {
  // Enforce permission: must have "edit" on "accounts"
  await assertPermission("accounts", "edit");

  const session = await auth();
  const cookieStore = await cookies();
  const organizationId =
    cookieStore.get("activeOrganizationId")?.value || session!.user.organizationId as string;

  if (!organizationId) {
    throw new Error("User does not belong to an organization");
  }

  // Verify the account belongs to the user's organization
  const account = await prisma.whatsAppAccount.findUnique({ where: { id } });

  if (!account || account.organizationId !== organizationId) {
    throw new Error("Account not found or unauthorized");
  }

  const validatedFields = accountSchema.parse(data);

  await prisma.whatsAppAccount.update({
    where: { id },
    data: validatedFields,
  });

  revalidatePath("/settings/accounts");
  return { success: true };
}

export async function deleteWhatsAppAccount(id: string) {
  // Enforce permission: must have "delete" on "accounts"
  await assertPermission("accounts", "delete");

  const session = await auth();
  const cookieStore = await cookies();
  const organizationId =
    cookieStore.get("activeOrganizationId")?.value || session!.user.organizationId as string;

  if (!organizationId) {
    throw new Error("User does not belong to an organization");
  }

  // Verify the account belongs to the user's organization
  const account = await prisma.whatsAppAccount.findUnique({ where: { id } });

  if (!account || account.organizationId !== organizationId) {
    throw new Error("Account not found or unauthorized");
  }

  await prisma.whatsAppAccount.delete({ where: { id } });

  revalidatePath("/settings/accounts");
  return { success: true };
}
