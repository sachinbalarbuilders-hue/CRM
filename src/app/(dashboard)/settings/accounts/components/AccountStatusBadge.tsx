import { testMetaConnection } from "../meta-actions";
import { Loader2 } from "lucide-react";

export async function AccountStatusBadge({ accountId }: { accountId: string }) {
  try {
    await testMetaConnection(accountId);
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <p className="font-medium text-green-600">Connected</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
        </span>
        <p className="font-medium text-destructive">Disconnected</p>
      </div>
    );
  }
}

export function AccountStatusFallback() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      <p className="text-sm">Checking...</p>
    </div>
  );
}
