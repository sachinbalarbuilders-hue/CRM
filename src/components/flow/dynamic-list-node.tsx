import { Handle, Position } from "@xyflow/react";
import { Database } from "lucide-react";

export function DynamicListNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-48">
      <div className="bg-emerald-500/10 border-b p-2 rounded-t-md flex items-center gap-2">
        <Database className="h-4 w-4 text-emerald-600" />
        <span className="font-semibold text-sm text-emerald-700">
          {data.label || "Dynamic List"}
        </span>
      </div>
      <div className="p-3 text-xs text-muted-foreground break-words">
        Queries database and sends interactive list.
      </div>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}
