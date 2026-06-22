// Shared constants and helpers for the Roles system
// NOT a server action file — safe to import from client components

export const SECTIONS_LIST = [
  "dashboard", "inbox", "campaigns", "templates",
  "flows", "transfers", "projects", "contacts", "accounts", "settings-general", "settings-roles", "settings-users", "meta-insights"
] as const;

export const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  inbox: "Inbox (Chat)",
  campaigns: "Campaigns",
  templates: "Templates",
  flows: "Flows",
  transfers: "Transfers",
  projects: "Projects",
  contacts: "Contacts",
  accounts: "Accounts",
  "settings-general": "Settings - General",
  "settings-roles": "Settings - Roles",
  "settings-users": "Settings - Users",
  "meta-insights": "Meta Insights",
};

export type Permission = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export type PermissionsMap = Record<string, Permission>;

export function defaultPermissions(): PermissionsMap {
  return Object.fromEntries(
    SECTIONS_LIST.map(s => [s, { view: false, create: false, edit: false, delete: false }])
  ) as PermissionsMap;
}
