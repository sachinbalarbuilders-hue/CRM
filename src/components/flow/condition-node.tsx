import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export function ConditionNode({ data }: { data: { label: string; variable?: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-48">
      <div className="flex items-center gap-2 bg-blue-500/10 p-2 rounded-t-md border-b">
        <GitBranch className="h-4 w-4 text-blue-600 dark:text-blue-500" />
        <span className="text-xs font-semibold">Condition</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label}</div>
        {data.variable && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {data.variable}
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-blue-600"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-blue-600"
      />
    </div>
  );
}
