import { Handle, Position } from "@xyflow/react";
import { ListMinus } from "lucide-react";

export function InteractiveMenuNode({ data }: { data: { label?: string; message?: string; options?: { id: string; title: string }[] } }) {
  const options = data.options || [];

  return (
    <div className="bg-background border rounded-md shadow-sm w-64">
      <div className="bg-indigo-500/10 border-b p-2 rounded-t-md flex items-center gap-2">
        <ListMinus className="h-4 w-4 text-indigo-600" />
        <span className="font-semibold text-sm text-indigo-700">
          {data.label || "Smart Menu"}
        </span>
      </div>
      <div className="p-3 text-xs text-foreground whitespace-pre-wrap break-words border-b pb-4">
        {data.message || "Please select an option:"}
      </div>
      
      {/* Dynamic Option Outputs */}
      <div className="flex flex-col">
        {options.map((opt, index) => (
          <div key={opt.id} className="relative flex items-center justify-between p-2 border-b last:border-0 hover:bg-muted/50 transition-colors">
            <span className="text-xs font-medium pl-1 text-indigo-600 truncate">{opt.title}</span>
            <div className="relative h-4 w-4">
              <Handle
                type="source"
                position={Position.Right}
                id={opt.id}
                className="w-3 h-3 bg-indigo-500 !right-[-12px]"
                style={{ top: '50%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <Handle type="target" position={Position.Top} className="w-2 h-2" />
    </div>
  );
}
