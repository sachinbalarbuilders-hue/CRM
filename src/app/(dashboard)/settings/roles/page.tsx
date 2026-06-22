"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Shield, Users } from "lucide-react";
import { getRoles, createRole, updateRole, deleteRole } from "./role-actions";
import {
  defaultPermissions, SECTION_LABELS, SECTIONS_LIST,
  type PermissionsMap
} from "./role-constants";

type RoleWithCount = Awaited<ReturnType<typeof getRoles>>[0];

const PERMISSION_KEYS = ["view", "create", "edit", "delete"] as const;

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithCount | null>(null);
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<PermissionsMap>(defaultPermissions());
  const [isPending, startTransition] = useTransition();

  const loadRoles = () => {
    setLoading(true);
    getRoles()
      .then(r => { setRoles(r); })
      .catch((e) => {
        console.error("Failed to load roles:", e);
        toast.error(e.message || "Failed to load roles");
      })
      .finally(() => { setLoading(false); });
  };

  useEffect(() => { loadRoles(); }, []);

  const openCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setPermissions(defaultPermissions());
    setDialogOpen(true);
  };

  const openEdit = (role: RoleWithCount) => {
    setEditingRole(role);
    setRoleName(role.name);
    const existing = role.permissions as PermissionsMap;
    const merged = defaultPermissions();
    for (const section of SECTIONS_LIST) {
      if (existing[section]) merged[section] = { ...merged[section], ...existing[section] };
    }
    setPermissions(merged);
    setDialogOpen(true);
  };

  const handleToggle = (section: string, perm: typeof PERMISSION_KEYS[number]) => {
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [perm]: !prev[section]?.[perm]
      }
    }));
  };

  const handleSave = () => {
    if (!roleName.trim()) return;
    startTransition(async () => {
      try {
        if (editingRole) {
          await updateRole(editingRole.id, roleName, permissions);
          toast.success("Role updated successfully");
        } else {
          await createRole(roleName, permissions);
          toast.success(`Role "${roleName}" created`);
        }
        setDialogOpen(false);
        loadRoles();
      } catch (e: any) {
        toast.error(e.message || "Failed to save role");
      }
    });
  };

  const handleDelete = (roleId: string, roleName: string) => {
    if (!confirm(`Delete "${roleName}"? Members assigned to it will lose their custom role.`)) return;
    startTransition(async () => {
      try {
        await deleteRole(roleId);
        toast.success("Role deleted");
        loadRoles();
      } catch (e: any) {
        toast.error(e.message || "Failed to delete role");
      }
    });
  };

  const countPermissions = (perms: PermissionsMap) => {
    let count = 0;
    for (const s of SECTIONS_LIST) {
      for (const p of PERMISSION_KEYS) {
        if (perms[s]?.[p]) count++;
      }
    }
    return count;
  };

  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground">Create and manage custom roles with granular permissions.</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Create Role
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <Card key={i} className="border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-1/2 mb-4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Card className="border-border border-dashed">
          <CardContent className="p-12 flex flex-col items-center text-center gap-3">
            <Shield className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-lg">No roles yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Create your first custom role to assign granular permissions to team members.
            </p>
            <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white gap-2 mt-2">
              <Plus className="h-4 w-4" /> Create Role
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map(role => {
            const perms = role.permissions as PermissionsMap;
            const count = countPermissions(perms);
            const sections = SECTIONS_LIST.filter(s =>
              PERMISSION_KEYS.some(p => perms[s]?.[p])
            );
            return (
              <Card key={role.id} className="border-border group hover:border-green-500/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-green-500" />
                      </div>
                      <CardTitle className="text-base">{role.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(role)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(role.id, role.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 pt-1">
                    <Users className="h-3.5 w-3.5" />
                    {role._count.members} member{role._count.members !== 1 ? "s" : ""}
                    <span className="text-muted-foreground/50">·</span>
                    {count} permission{count !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {sections.slice(0, 5).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs capitalize">
                        {SECTION_LABELS[s]}
                      </Badge>
                    ))}
                    {sections.length > 5 && (
                      <Badge variant="secondary" className="text-xs">+{sections.length - 5} more</Badge>
                    )}
                    {sections.length === 0 && (
                      <span className="text-xs text-muted-foreground">No permissions assigned</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              Define a role name and configure its section-by-section permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g. Sales Manager, Support Agent"
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Permissions</Label>
              <div className="rounded-lg border border-border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section</span>
                  {PERMISSION_KEYS.map(p => (
                    <span key={p} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center capitalize">{p}</span>
                  ))}
                </div>
                {/* Rows */}
                {SECTIONS_LIST.map((section, idx) => (
                  <div
                    key={section}
                    className={`grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-4 py-3 items-center ${idx !== SECTIONS_LIST.length - 1 ? "border-b border-border/60" : ""}`}
                  >
                    <span className="text-sm font-medium">{SECTION_LABELS[section]}</span>
                    {PERMISSION_KEYS.map(perm => {
                      const isViewRequired = perm !== "view" && permissions[section]?.[perm];
                      return (
                        <div key={perm} className="flex justify-center">
                          <Switch
                            checked={!!permissions[section]?.[perm]}
                            onCheckedChange={() => handleToggle(section, perm)}
                            className="data-checked:bg-green-600 scale-90"
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Toggle on the permissions this role should have for each section.</p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={handleSave}
              disabled={isPending || !roleName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
