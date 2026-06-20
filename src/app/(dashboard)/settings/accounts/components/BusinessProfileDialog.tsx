"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessProfile, updateBusinessProfile, uploadProfilePicture } from "../meta-actions";
import { Loader2, AlertTriangle, Building2, Image as ImageIcon, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const profileSchema = z.object({
  about: z.string().max(139, "Max 139 characters").optional().or(z.literal("")),
  description: z.string().max(512, "Max 512 characters").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(256, "Max 256 characters").optional().or(z.literal("")),
  vertical: z.string().optional().or(z.literal("")),
  website1: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website2: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface BusinessProfileDialogProps {
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VERTICALS = [
  "UNDEFINED", "OTHER", "AUTO", "BEAUTY", "APPAREL", "EDU", "ENTERTAIN", "EVENT_PLAN", 
  "FINANCE", "GROCERY", "GOVT", "HOTEL", "HEALTH", "NONPROFIT", "PROF_SERVICES", 
  "RETAIL", "TRAVEL", "RESTAURANT"
];

export function BusinessProfileDialog({ accountId, open, onOpenChange }: BusinessProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const aboutLength = watch("about")?.length || 0;
  const descLength = watch("description")?.length || 0;

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setFetchError(null);
      setSelectedImage(null);
      setPreviewUrl(null);
      getBusinessProfile(accountId)
        .then((profile) => {
          if (profile) {
            setProfilePictureUrl(profile.profile_picture_url || null);
            reset({
              about: profile.about || "",
              description: profile.description || "",
              email: profile.email || "",
              address: profile.address || "",
              vertical: profile.vertical || "",
              website1: profile.websites?.[0] || "",
              website2: profile.websites?.[1] || "",
            });
          }
        })
        .catch((err) => {
          setFetchError(err.message || "Failed to load profile");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, accountId, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const websites = [data.website1, data.website2].filter(Boolean) as string[];
      
      const updateData: any = {
        about: data.about,
        description: data.description,
        email: data.email,
        address: data.address,
        vertical: data.vertical,
        websites: websites.length > 0 ? websites : undefined,
      };

      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);
        const uploadRes = await uploadProfilePicture(accountId, formData);
        updateData.profile_picture_handle = uploadRes.handle;
      }

      await updateBusinessProfile(accountId, updateData);
      onOpenChange(false);
    } catch (err: any) {
      setFetchError(err.message || "Failed to update profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" /> Business Profile
          </DialogTitle>
          <DialogDescription>
            Update your WhatsApp Business profile details. These are visible to your customers.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 my-4 flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Profile Updates</p>
            <p>Changes to your address, description, email, and websites usually update immediately. Note: Updating the Business Display Name requires a separate Meta review process.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading profile from Meta...</p>
          </div>
        ) : fetchError && !isSubmitting ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm mb-4">
            {fetchError}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30 relative overflow-hidden group">
              {previewUrl || profilePictureUrl ? (
                <img src={previewUrl || profilePictureUrl!} alt="Profile" className="h-16 w-16 rounded-full object-cover bg-background" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-background border flex items-center justify-center text-muted-foreground">
                  <Building2 className="h-8 w-8" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <p className="font-medium">Profile Picture</p>
                <div className="flex items-center gap-2">
                  <Label htmlFor="picture-upload" className="cursor-pointer text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md transition-colors flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    {selectedImage ? "Change Selection" : "Upload New Picture"}
                  </Label>
                  <input 
                    id="picture-upload" 
                    type="file" 
                    accept="image/jpeg,image/png" 
                    className="hidden" 
                    onChange={handleImageChange} 
                    disabled={isSubmitting}
                  />
                  {selectedImage && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {selectedImage.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">About (Status)</Label>
              <Input id="about" placeholder="e.g., Available, Busy, At work" {...register("about")} />
              <div className="flex justify-between">
                {errors.about ? (
                  <span className="text-xs text-destructive">{errors.about.message}</span>
                ) : <span />}
                <span className="text-xs text-muted-foreground">{aboutLength}/139</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description of your business..." 
                className="resize-none h-24"
                {...register("description")} 
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <span className="text-xs text-destructive">{errors.description.message}</span>
                ) : <span />}
                <span className="text-xs text-muted-foreground">{descLength}/512</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vertical">Industry (Vertical)</Label>
                <select 
                  id="vertical" 
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("vertical")}
                >
                  <option value="">Select industry...</option>
                  {VERTICALS.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {errors.vertical && <span className="text-xs text-destructive">{errors.vertical.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" type="email" placeholder="info@example.com" {...register("email")} />
                {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Input id="address" placeholder="123 Business St, City, Country" {...register("address")} />
              {errors.address && <span className="text-xs text-destructive">{errors.address.message}</span>}
            </div>

            <div className="space-y-4">
              <Label>Websites (Max 2)</Label>
              <div className="space-y-2">
                <Input placeholder="https://www.example.com" {...register("website1")} />
                {errors.website1 && <span className="text-xs text-destructive">{errors.website1.message}</span>}
              </div>
              <div className="space-y-2">
                <Input placeholder="https://www.anotherexample.com" {...register("website2")} />
                {errors.website2 && <span className="text-xs text-destructive">{errors.website2.message}</span>}
              </div>
            </div>

            {fetchError && isSubmitting && (
              <div className="bg-destructive/10 text-destructive p-3 rounded text-sm mt-4">
                {fetchError}
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white min-w-24">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
