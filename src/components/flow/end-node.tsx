import { Handle, Position } from "@xyflow/react";
import { Flag } from "lucide-react";

export function EndNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-background border-2 border-red-500/50 rounded-full shadow-sm w-32 flex flex-col items-center justify-center p-3 relative group">
      <div className="flex flex-col items-center gap-1">
        <Flag className="h-5 w-5 text-red-500" />
        <span className="text-xs font-semibold text-red-700 dark:text-red-400">{data.label || "End Flow"}</span>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-500"
      />
    </div>
  );
}
