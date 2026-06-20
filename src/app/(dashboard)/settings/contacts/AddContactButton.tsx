"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewChatDialog } from "@/app/(dashboard)/inbox/components/NewChatDialog";

interface AddContactButtonProps {
  organizations: { id: string; name: string }[];
  activeOrganizationId: string;
}

export function AddContactButton({ organizations, activeOrganizationId }: AddContactButtonProps) {
  const router = useRouter();

  const handleSuccess = (conversationId: string) => {
    // When a contact is added from settings, we can either refresh the list
    // or take them to the inbox to chat. Taking them to the inbox makes the most sense.
    router.push(`/inbox?conversationId=${conversationId}`);
  };

  return (
    <NewChatDialog
      organizations={organizations}
      activeOrganizationId={activeOrganizationId}
      onSuccess={handleSuccess}
      trigger={
        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
      }
    />
  );
}
