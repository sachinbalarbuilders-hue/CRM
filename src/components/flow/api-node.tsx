import { Handle, Position } from "@xyflow/react";
import { Webhook } from "lucide-react";

export function ApiNode({ data }: { data: { label: string; url?: string; method?: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-48">
      <div className="flex items-center gap-2 bg-teal-500/10 p-2 rounded-t-md border-b">
        <Webhook className="h-4 w-4 text-teal-600 dark:text-teal-500" />
        <span className="text-xs font-semibold">API Call</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label || "Webhook / API"}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate font-mono">
          {data.method || "POST"} {data.url || "No URL"}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-teal-600"
      />
      <Handle
        id="success"
        type="source"
        position={Position.Bottom}
        style={{ left: "30%" }}
        className="w-2 h-2 !bg-green-500"
      />
      <Handle
        id="error"
        type="source"
        position={Position.Bottom}
        style={{ left: "70%" }}
        className="w-2 h-2 !bg-red-500"
      />
      <div className="absolute -bottom-5 left-[20%] text-[8px] text-green-600 font-bold">Success</div>
      <div className="absolute -bottom-5 left-[60%] text-[8px] text-red-600 font-bold">Error</div>
    </div>
  );
}
