"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWhatsAppAccount, updateWhatsAppAccount } from "./actions";

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

interface AccountFormProps {
  initialData?: AccountFormData & { id: string };
}

export function AccountForm({ initialData }: AccountFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: initialData || {
      apiVersion: "v21.0",
      isDefaultIncoming: false,
      isDefaultOutgoing: false,
      autoReadReceipts: true,
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    try {
      setError(null);
      if (initialData?.id) {
        await updateWhatsAppAccount(initialData.id, data);
      } else {
        await createWhatsAppAccount(data);
      }
      router.push("/settings/accounts");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <Card className="border-border">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Account Details</CardTitle>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Account Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" {...register("name")} className="bg-background" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="appId">Meta App ID</Label>
              <Input id="appId" {...register("appId")} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">
                Phone Number ID <span className="text-destructive">*</span>
              </Label>
              <Input id="phoneNumberId" {...register("phoneNumberId")} className="bg-background" />
              {errors.phoneNumberId && <p className="text-xs text-destructive">{errors.phoneNumberId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wabaId">
                WhatsApp Business Account ID <span className="text-destructive">*</span>
              </Label>
              <Input id="wabaId" {...register("wabaId")} className="bg-background" />
              {errors.wabaId && <p className="text-xs text-destructive">{errors.wabaId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiVersion">API Version</Label>
              <Input id="apiVersion" {...register("apiVersion")} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">
                Access Token <span className="text-destructive">*</span>
              </Label>
              <Input id="accessToken" type="password" autoComplete="new-password" {...register("accessToken")} className="bg-background" />
              {errors.accessToken && <p className="text-xs text-destructive">{errors.accessToken.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="appSecret">App Secret</Label>
              <Input id="appSecret" type="password" autoComplete="new-password" {...register("appSecret")} className="bg-background" />
            </div>
          </div>

          <div className="pt-6 space-y-4 border-t border-border mt-6">
            <Controller
              control={control}
              name="isDefaultIncoming"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Default for incoming messages</Label>
                  <Switch checked={value} onCheckedChange={onChange} className="data-checked:bg-green-600" />
                </div>
              )}
            />
            <Controller
              control={control}
              name="isDefaultOutgoing"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Default for outgoing messages</Label>
                  <Switch checked={value} onCheckedChange={onChange} className="data-checked:bg-green-600" />
                </div>
              )}
            />
            <Controller
              control={control}
              name="autoReadReceipts"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Automatically send read receipts</Label>
                  <Switch checked={value} onCheckedChange={onChange} className="data-checked:bg-green-600" />
                </div>
              )}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-border pt-6">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white min-w-32">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? "Save Changes" : "Save Account")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
