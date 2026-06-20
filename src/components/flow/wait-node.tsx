import { Handle, Position } from "@xyflow/react";
import { Clock } from "lucide-react";

export function WaitNode({ data }: { data: { label: string; duration?: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-48">
      <div className="flex items-center gap-2 bg-orange-500/10 p-2 rounded-t-md border-b">
        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
        <span className="text-xs font-semibold">Wait</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label}</div>
        {data.duration && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {data.duration} mins
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-orange-600"
      />
      <Handle
        id="replied"
        type="source"
        position={Position.Bottom}
        style={{ left: "30%" }}
        className="w-2 h-2 !bg-green-500"
      />
      <Handle
        id="timeout"
        type="source"
        position={Position.Bottom}
        style={{ left: "70%" }}
        className="w-2 h-2 !bg-yellow-500"
      />
      <div className="absolute -bottom-5 left-[20%] text-[8px] text-green-600 font-bold">Replied</div>
      <div className="absolute -bottom-5 left-[60%] text-[8px] text-yellow-600 font-bold">Timeout</div>
    </div>
  );
}
