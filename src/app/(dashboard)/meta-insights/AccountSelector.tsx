"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AccountSelector({ accounts, selectedId }: { accounts: any[], selectedId?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <Select 
        value={selectedId || (accounts.length > 0 ? accounts[0].id : "")} 
        onValueChange={(val) => router.push(`${pathname}?accountId=${val}`)}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select WhatsApp Account" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((acc: any) => (
            <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.phoneNumberId})</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
