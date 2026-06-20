// Shared constants and helpers for the Roles system
// NOT a server action file — safe to import from client components

export const SECTIONS_LIST = [
  "dashboard", "inbox", "campaigns", "templates",
  "flows", "leads", "projects", "contacts", "accounts", "settings"
] as const;

export const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  inbox: "Inbox (Chat)",
  campaigns: "Campaigns",
  templates: "Templates",
  flows: "Flows",
  leads: "Leads",
  projects: "Projects",
  contacts: "Contacts",
  accounts: "Accounts",
  settings: "Settings",
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
