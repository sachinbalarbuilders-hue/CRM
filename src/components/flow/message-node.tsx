import { Handle, Position } from "@xyflow/react";
import { MessageCircle } from "lucide-react";

export function MessageNode({ data }: { data: { label: string; message: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-64">
      <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-t-md border-b">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Send Message</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate">
          {data.message || "No message defined"}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-primary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-primary"
      />
    </div>
  );
}
