import { Handle, Position } from "@xyflow/react";
import { Tag } from "lucide-react";

export function TagNode({ data }: { data: { label: string; tagName?: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-48">
      <div className="flex items-center gap-2 bg-pink-500/10 p-2 rounded-t-md border-b">
        <Tag className="h-4 w-4 text-pink-600 dark:text-pink-500" />
        <span className="text-xs font-semibold">Tag Contact</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label || "Add Tag"}</div>
        {data.tagName && (
          <div className="text-xs font-mono bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 rounded px-1 mt-1 inline-block">
            {data.tagName}
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-pink-600"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-pink-600"
      />
    </div>
  );
}
