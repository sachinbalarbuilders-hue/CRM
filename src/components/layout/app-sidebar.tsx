"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Inbox, 
  Users, 
  Briefcase, 
  GitMerge, 
  LayoutTemplate, 
  Megaphone, 
  BarChart, 
  Settings,
  Bot,
  Plus,
  Headset
} from "lucide-react";
import Link from "next/link";
import type { PermissionsMap } from "@/app/(dashboard)/settings/roles/role-constants";
import { usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const navMain = [
  { name: "Dashboard", href: "/dashboard", icon: Home, section: "dashboard" },
  { name: "Chat", href: "/inbox", icon: Inbox, section: "inbox" },
  { name: "Projects", href: "/projects", icon: Briefcase, section: "projects" },
];

const navMessaging = [
  { 
    name: "Chatbot", 
    icon: Bot, 
    section: "chatbot",
    items: [
      { name: "Flows", href: "/flow-builder", section: "flows" },
      { name: "Transfers", href: "/transfers", section: "transfers" }
    ]
  },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone, section: "campaigns" },
  { name: "Templates", href: "/templates", icon: LayoutTemplate, section: "templates" },
  { name: "Meta Insights", href: "/meta-insights", icon: BarChart, section: "meta-insights" },
];

const navSettings = [
  { 
    name: "Settings", 
    icon: Settings,
    items: [
      { name: "General", href: "/settings/general", section: "settings-general" },
      { name: "Accounts", href: "/settings/accounts", section: "accounts" },
      { name: "Roles", href: "/settings/roles", section: "settings-roles" },
      { name: "Users", href: "/settings/users", section: "settings-users" },
      { name: "Contacts", href: "/settings/contacts", section: "contacts" },
    ]
  }
];

import { useState } from "react";
import { switchOrganization, createOrganization } from "@/app/(dashboard)/org-actions";
import { useSession } from "next-auth/react";

export function AppSidebar({ 
  organizations = [], 
  currentOrganizationId,
  userPermissions = null
}: { 
  organizations?: { id: string, name: string }[],
  currentOrganizationId?: string,
  userPermissions?: PermissionsMap | null
}) {
  // Helper: can user view this section?
  const canView = (section: string) => {
    if (!userPermissions) return true; // full access
    if (section === "dashboard" || section === "chatbot") return true; // always visible
    return !!userPermissions[section]?.view;
  };
  const pathname = usePathname();
  const { update } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    setIsCreating(true);
    try {
      const res = await createOrganization(newOrgName);
      if (res.success) {
        setIsOpen(false);
        setNewOrgName("");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitch = async (orgId: string) => {
    try {
      const res = await switchOrganization(orgId);
      if (res.success) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="font-bold text-xl tracking-tight">Plot CRM</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between pr-2">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider">Organization</SidebarGroupLabel>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger render={<Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" />}>
                <Plus className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization to manage a separate workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    id="name" 
                    placeholder="Organization name" 
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="focus-visible:ring-green-600 focus-visible:border-green-600" 
                  />
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Cancel
                  </DialogClose>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <SidebarGroupContent className="px-2 pt-1 pb-2">
            <Select value={currentOrganizationId} onValueChange={(val) => val && handleSwitch(val)}>
              <SelectTrigger className="w-full bg-transparent border-muted-foreground/30 focus:ring-0">
                <span className="truncate">
                  {organizations.find((o) => o.id === currentOrganizationId)?.name || "Select Organization"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.filter(item => canView(item.section)).map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname?.startsWith(item.href)}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider">Messaging</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMessaging.filter(item => canView(item.section)).map((item) => {
                if (item.items) {
                  const visibleItems = item.items.filter(sub => canView(sub.section));
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton className="font-medium text-foreground/80">
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                      {visibleItems.length > 0 && (
                        <SidebarMenuSub>
                          {visibleItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.name}>
                              <SidebarMenuSubButton render={<Link href={subItem.href} />} isActive={pathname?.startsWith(subItem.href)}>
                                <span>{subItem.name}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname?.startsWith(item.href)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSettings.map((item) => {
                const visibleItems = item.items.filter(sub => canView(sub.section));
                if (visibleItems.length === 0) return null;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton className="font-medium text-foreground/80">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {visibleItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.name}>
                          <SidebarMenuSubButton render={<Link href={subItem.href} />} isActive={pathname?.startsWith(subItem.href)}>
                            <span>{subItem.name}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
