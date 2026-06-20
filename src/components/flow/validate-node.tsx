import { Handle, Position } from "@xyflow/react";
import { ShieldCheck } from "lucide-react";

export function ValidateNode({ data }: { data: { label: string; validationType?: string; variableName?: string } }) {
  return (
    <div className="bg-background border rounded-md shadow-sm w-48">
      <div className="flex items-center gap-2 bg-indigo-500/10 p-2 rounded-t-md border-b">
        <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-500" />
        <span className="text-xs font-semibold">Validate Input</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium">{data.label || "Validate Input"}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate">
          {data.validationType || "Any Text"} → {data.variableName || "No Variable"}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-indigo-600"
      />
      <Handle
        id="valid"
        type="source"
        position={Position.Bottom}
        style={{ left: "30%" }}
        className="w-2 h-2 !bg-green-500"
      />
      <Handle
        id="invalid"
        type="source"
        position={Position.Bottom}
        style={{ left: "70%" }}
        className="w-2 h-2 !bg-red-500"
      />
      <div className="absolute -bottom-5 left-[20%] text-[8px] text-green-600 font-bold">Valid</div>
      <div className="absolute -bottom-5 left-[60%] text-[8px] text-red-600 font-bold">Invalid</div>
    </div>
  );
}
