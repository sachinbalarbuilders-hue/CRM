import { Handle, Position } from "@xyflow/react";
import { UserCheck } from "lucide-react";

export function TransferNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-48">
      <div className="flex items-center gap-2 bg-indigo-500/10 p-2 rounded-t-md border-b">
        <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-500" />
        <span className="text-xs font-semibold">Transfer</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label || "Transfer to Agent"}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate">
          Stops the bot
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-indigo-600"
      />
    </div>
  );
}
