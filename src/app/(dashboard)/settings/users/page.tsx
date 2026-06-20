"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Trash2, UserCircle } from "lucide-react";
import { getOrgMembers, inviteUser, updateMemberRole, removeMember } from "./user-actions";
import { getRoles } from "@/app/(dashboard)/settings/roles/role-actions";

type Member = Awaited<ReturnType<typeof getOrgMembers>>[0];
type Role = Awaited<ReturnType<typeof getRoles>>[0];

function getInitials(name?: string | null, email?: string) {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (email?.[0] ?? "?").toUpperCase();
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "SUPER_ADMIN": return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "ORG_ADMIN": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "MANAGER": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    default: return "bg-muted text-muted-foreground border-muted";
  }
}

export default function UsersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Invite form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");

  const load = () => {
    setLoading(true);
    Promise.all([getOrgMembers(), getRoles()]).then(([m, r]) => {
      setMembers(m);
      setRoles(r);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) return;
    startTransition(async () => {
      try {
        await inviteUser(inviteName, inviteEmail, invitePassword, inviteRoleId || null);
        toast.success(`${inviteName} has been invited`);
        setInviteOpen(false);
        setInviteName(""); setInviteEmail(""); setInvitePassword(""); setInviteRoleId("");
        load();
      } catch (e: any) {
        toast.error(e.message || "Failed to invite user");
      }
    });
  };

  const handleRoleChange = (memberId: string, roleId: string) => {
    startTransition(async () => {
      try {
        await updateMemberRole(memberId, roleId === "none" ? null : roleId);
        toast.success("Role updated");
        load();
      } catch (e: any) {
        toast.error(e.message || "Failed to update role");
      }
    });
  };

  const handleRemove = (memberId: string, name?: string | null) => {
    if (!confirm(`Remove ${name || "this member"} from the organization?`)) return;
    startTransition(async () => {
      try {
        await removeMember(memberId);
        toast.success(`${name || "Member"} removed`);
        load();
      } catch (e: any) {
        toast.error(e.message || "Failed to remove member");
      }
    });
  };

  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage team members and their roles in this organization.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Invite User
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0 divide-y divide-border">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-3 py-16">
              <UserCircle className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="font-semibold text-lg">No members yet</h3>
              <p className="text-muted-foreground text-sm">Invite your first team member to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-4 px-6 py-4 group hover:bg-muted/30 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-500/10 text-green-500 text-sm font-semibold">
                      {getInitials(member.user.name, member.user.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.user.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  </div>

                  {/* System role badge */}
                  <Badge variant="outline" className={`text-xs hidden sm:flex ${getRoleBadgeColor(member.role)}`}>
                    {member.role.replace("_", " ")}
                  </Badge>

                  {/* Custom role selector */}
                  <Select
                    value={member.customRoleId || "none"}
                    onValueChange={(val) => handleRoleChange(member.id, val)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
                      <span className="truncate">
                        {member.customRoleId && member.customRoleId !== "none" 
                          ? roles.find(r => r.id === member.customRoleId)?.name || "Loading..."
                          : "No custom role"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs text-muted-foreground">No custom role</SelectItem>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemove(member.id, member.user.name)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Add a new member to this organization. They can log in with the credentials you set.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input
                id="invite-name"
                placeholder="John Doe"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="john@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-password">Temporary Password</Label>
              <Input
                id="invite-password"
                type="password"
                placeholder="Set a temporary password"
                autoComplete="new-password"
                value={invitePassword}
                onChange={e => setInvitePassword(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">The user should change this after logging in.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Assign Custom Role (optional)</Label>
              <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                <SelectTrigger id="invite-role" className="bg-background">
                  <span className="truncate">
                    {inviteRoleId && inviteRoleId !== "__empty__"
                      ? roles.find(r => r.id === inviteRoleId)?.name || "Select a role..."
                      : "Select a role..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {roles.length === 0 && (
                    <SelectItem value="__empty__" disabled className="text-xs text-muted-foreground">
                      No roles created yet
                    </SelectItem>
                  )}
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={handleInvite}
              disabled={isPending || !inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending ? "Inviting..." : "Invite User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
