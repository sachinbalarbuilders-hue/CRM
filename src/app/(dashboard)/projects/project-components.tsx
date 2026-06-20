"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, MapPin, Building2, FileText } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createProject, updateProject, deleteProject, uploadBrochure } from "./actions";

export function ProjectModal({ 
  organizationId, 
  project 
}: { 
  organizationId: string;
  project?: any; // If provided, we are in Edit mode
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    type: project?.type || "Residential",
    location: project?.location || "",
    brochureUrl: project?.brochureUrl || "",
    virtualTourUrl: project?.virtualTourUrl || "",
    order: project?.order || 0,
    status: project?.status || "ACTIVE"
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Basic validation (size limit, file type)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    setLoading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      toast.info("Uploading brochure...");
      const res = await uploadBrochure(uploadData);
      if (res.success && res.url) {
        setFormData({ ...formData, brochureUrl: res.url });
        toast.success("Brochure uploaded successfully!");
      } else {
        toast.error(res.error || "Failed to upload brochure");
      }
    } catch (err) {
      toast.error("Upload error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (project) {
        // Edit mode
        const res = await updateProject(project.id, formData);
        if (res.success) {
          toast.success("Project updated successfully");
          setOpen(false);
        } else {
          toast.error(res.error || "Failed to update project");
        }
      } else {
        // Create mode
        const res = await createProject({ ...formData, organizationId });
        if (res.success) {
          toast.success("Project created successfully");
          setOpen(false);
          // Reset form on success
          setFormData({
            name: "", description: "", type: "Residential", location: "", brochureUrl: "", virtualTourUrl: "", order: 0, status: "ACTIVE"
          });
        } else {
          toast.error(res.error || "Failed to create project");
        }
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {project ? (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Edit className="h-4 w-4 mr-1" /> Edit
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. Sunrise Valley" 
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})} 
                placeholder="e.g. Residential, Commercial" 
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input 
                type="number"
                value={formData.order} 
                onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                placeholder="e.g. 1" 
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData({...formData, status: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})} 
              placeholder="e.g. Downtown, NY" 
            />
          </div>
          <div className="space-y-2">
            <Label>Brochure URL (PDF Link)</Label>
            <Input 
              value={formData.brochureUrl} 
              onChange={e => setFormData({...formData, brochureUrl: e.target.value})} 
              placeholder="https://example.com/brochure.pdf" 
            />
            <p className="text-xs text-muted-foreground">The chatbot will automatically send this file when requested.</p>
          </div>
          <div className="space-y-2">
            <Label>Virtual Tour URL (Link)</Label>
            <Input 
              value={formData.virtualTourUrl} 
              onChange={e => setFormData({...formData, virtualTourUrl: e.target.value})} 
              placeholder="https://example.com/360-tour" 
            />
            <p className="text-xs text-muted-foreground">Customers can access this via {"{{selected_project_virtual_tour}}"}.</p>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              rows={3} 
            />
          </div>
          <DialogFooter className="pt-4">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : project ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectCard({ project, organizationId }: { project: any, organizationId: string }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? It will be removed from your chatbot dynamic lists!")) return;
    
    setDeleting(true);
    const res = await deleteProject(project.id);
    if (res.success) {
      toast.success("Project deleted");
    } else {
      toast.error("Failed to delete project");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden flex flex-col">
      <div className="p-6 flex flex-col gap-2 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg leading-none tracking-tight">{project.name}</h3>
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors ${
            project.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            project.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
            project.status === 'INACTIVE' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' :
            'bg-secondary text-secondary-foreground'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>
        
        {project.type && (
          <p className="text-sm font-medium text-primary mt-1">{project.type}</p>
        )}
        
        {project.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
        )}
        
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          {project.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> <span>{project.location}</span>
            </div>
          )}
          {project.brochureUrl && (
            <div className="flex items-center gap-2 text-blue-500">
              <FileText className="h-4 w-4" /> 
              <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
                Brochure Link
              </a>
            </div>
          )}
          {project.virtualTourUrl && (
            <div className="flex items-center gap-2 text-indigo-500">
              <FileText className="h-4 w-4" /> 
              <a href={project.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
                Virtual Tour
              </a>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-muted/50 px-6 py-3 border-t flex justify-between items-center mt-auto">
        <div className="text-xs text-muted-foreground">
          Order: {project.order} • ID: {project.id.substring(project.id.length - 6)}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <ProjectModal organizationId={organizationId} project={project} />
        </div>
      </div>
    </div>
  );
}
