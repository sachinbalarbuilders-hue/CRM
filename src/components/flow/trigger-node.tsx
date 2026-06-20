import { Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";

export function TriggerNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-64">
      <div className="flex items-center gap-2 bg-yellow-500/10 p-2 rounded-t-md border-b">
        <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <span className="text-xs font-semibold">Trigger</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-yellow-600"
      />
    </div>
  );
}
