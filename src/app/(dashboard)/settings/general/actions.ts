"use server";

import { prisma } from "@/auth";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/permissions";

export async function updateOrganizationSettings(data: {
  name?: string;
  timezone?: string;
  dateFormat?: string;
  language?: string;
  maskPhoneNumbers?: boolean;
  emailNotifications?: boolean;
  newMessageAlerts?: boolean;
  campaignUpdates?: boolean;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("activeOrganizationId")?.value || session?.user?.organizationId;

  if (!session?.user || !organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify permission
  await assertPermission("settings-general", "edit");

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const currentSettings = (org.settings as Record<string, any>) || {};
  const newSettings = {
    ...currentSettings,
    timezone: data.timezone ?? currentSettings.timezone ?? "utc",
    dateFormat: data.dateFormat ?? currentSettings.dateFormat ?? "ddmm",
    language: data.language ?? currentSettings.language ?? "en",
    maskPhoneNumbers: data.maskPhoneNumbers ?? currentSettings.maskPhoneNumbers ?? false,
    emailNotifications: data.emailNotifications ?? currentSettings.emailNotifications ?? true,
    newMessageAlerts: data.newMessageAlerts ?? currentSettings.newMessageAlerts ?? true,
    campaignUpdates: data.campaignUpdates ?? currentSettings.campaignUpdates ?? true,
  };

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      name: data.name || org.name,
      settings: newSettings
    }
  });

  // Revalidate the entire dashboard layout so global settings changes propagate to Inbox, Contacts, etc.
  revalidatePath("/", "layout");
}
