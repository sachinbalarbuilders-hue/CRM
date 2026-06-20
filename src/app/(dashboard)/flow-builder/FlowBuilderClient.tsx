"use client";

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MessageNode } from "@/components/flow/message-node";
import { TriggerNode } from "@/components/flow/trigger-node";
import { ConditionNode } from "@/components/flow/condition-node";
import { WaitNode } from "@/components/flow/wait-node";
import { TransferNode } from "@/components/flow/transfer-node";
import { DynamicListNode } from "@/components/flow/dynamic-list-node";
import { InteractiveMenuNode } from "@/components/flow/interactive-menu-node";
import { ValidateNode } from "@/components/flow/validate-node";
import { TagNode } from "@/components/flow/tag-node";
import { ApiNode } from "@/components/flow/api-node";
import { BusinessHoursNode } from "@/components/flow/business-hours-node";
import { EndNode } from "@/components/flow/end-node";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Play, Loader2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { useTheme } from "next-themes";

const nodeTypes = {
  message: MessageNode,
  trigger: TriggerNode,
  condition: ConditionNode,
  wait: WaitNode,
  transfer: TransferNode,
  dynamic_list: DynamicListNode,
  interactive_menu: InteractiveMenuNode,
  validate: ValidateNode,
  tag: TagNode,
  api: ApiNode,
  business_hours: BusinessHoursNode,
  end: EndNode,
};

const initialNodes = [
  { id: "trigger_1", type: "trigger", data: { label: "Incoming Message" }, position: { x: 200, y: 50 } },
  { id: "menu_main", type: "interactive_menu", data: { 
      label: "Main Menu", 
      message: "👋 Welcome to our business!\n\nHow can we help you today?", 
      options: [
        { id: "opt_sales", title: "Sales Inquiry" },
        { id: "opt_support", title: "Customer Support" },
        { id: "opt_agent", title: "Talk to Agent" }
      ] 
    }, position: { x: 200, y: 200 } },

  // Sales Route
  { id: "lead_name", type: "message", data: { label: "Ask for Name", message: "😊 We'd love to help with your inquiry. Please share your full name." }, position: { x: -50, y: 400 } },
  { id: "wait_name", type: "wait", data: { label: "Wait for Reply", duration: "10" }, position: { x: -50, y: 550 } },
  { id: "lead_phone", type: "message", data: { label: "Ask for Number", message: "Thank you! 🙏 Please share your WhatsApp number so our team can reach you." }, position: { x: -50, y: 650 } },
  { id: "wait_phone", type: "wait", data: { label: "Wait for Reply", duration: "10" }, position: { x: -50, y: 800 } },
  { id: "lead_confirm", type: "message", data: { label: "Confirm Details", message: "✅ Thank you! Our sales team will contact you shortly." }, position: { x: -50, y: 900 } },

  // Support Route
  { id: "msg_support", type: "message", data: { label: "Support Intro", message: "🛠️ Please describe your issue in a single message below, and an agent will assist you." }, position: { x: 300, y: 400 } },
  { id: "wait_support", type: "wait", data: { label: "Wait for Reply", duration: "10" }, position: { x: 300, y: 550 } },

  // Agent Route
  { id: "transfer_1", type: "transfer", data: { label: "Transfer to Agent" }, position: { x: 500, y: 650 } },
];

const initialEdges = [
  { id: "e1", source: "trigger_1", target: "menu_main", animated: true },
  
  // Menu Routes
  { id: "e-m-sales", source: "menu_main", sourceHandle: "opt_sales", target: "lead_name", animated: true },
  { id: "e-m-support", source: "menu_main", sourceHandle: "opt_support", target: "msg_support", animated: true },
  { id: "e-m-agent", source: "menu_main", sourceHandle: "opt_agent", target: "transfer_1", animated: true },

  // Sales
  { id: "e-ln-wn", source: "lead_name", target: "wait_name" },
  { id: "e-wn-lp", source: "wait_name", target: "lead_phone", animated: true },
  { id: "e-lp-wp", source: "lead_phone", target: "wait_phone" },
  { id: "e-wp-lc", source: "wait_phone", target: "lead_confirm", animated: true },

  // Support -> Transfer
  { id: "e-ms-ws", source: "msg_support", target: "wait_support" },
  { id: "e-ws-tr", source: "wait_support", target: "transfer_1", animated: true }
];

function FlowBuilder({ 
  organizationId, 
  initialSavedNodes, 
  initialSavedEdges 
}: { 
  organizationId: string;
  initialSavedNodes?: Node[] | null;
  initialSavedEdges?: Edge[] | null;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialSavedNodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialSavedEdges || initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? systemTheme : theme;

  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((key: string, value: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode?.id) {
          const updatedNode = { ...n, data: { ...n.data, [key]: value } };
          setSelectedNode(updatedNode);
          return updatedNode;
        }
        return n;
      })
    );
  }, [selectedNode, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.success("Node deleted");
  }, [selectedNode, setNodes, setEdges]);

  const saveFlow = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "balar_main_flow", // For now, hardcode a single flow ID for testing
          name: "Main Chatbot Flow",
          nodes,
          edges,
          organizationId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save flow");
      toast.success("Flow saved successfully");
      setLastSaved(new Date());
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving the flow.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] w-full flex-col overflow-hidden rounded-xl border bg-background shadow">
      {/* Flow Builder Header */}
      <div className="flex items-center justify-between border-b p-4 bg-background">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lead Nurturing Flow</h1>
          <p className="text-xs text-muted-foreground">
            {mounted && lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Unsaved changes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveFlow} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} 
            Save Draft
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" /> Publish
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        {mounted && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            colorMode={currentTheme === "dark" ? "dark" : "light"}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            <Panel position="top-left" className="bg-background/80 backdrop-blur-sm p-2 rounded-md border shadow-sm flex flex-col gap-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nodes</div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'message')} 
                draggable
              >
                💬 Send Message
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'wait')} 
                draggable
              >
                ⏱️ Wait
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'condition')} 
                draggable
              >
                🔀 Condition
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'transfer')} 
                draggable
              >
                👤 Transfer to Agent
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'interactive_menu')} 
                draggable
              >
                🔀 Smart Menu
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'dynamic_list')} 
                draggable
              >
                📋 Dynamic List
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'validate')} 
                draggable
              >
                🛡️ Validate Input
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'tag')} 
                draggable
              >
                🏷️ Tag Contact
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'api')} 
                draggable
              >
                🌐 API Call
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'business_hours')} 
                draggable
              >
                🕒 Business Hours
              </div>
              <div 
                className="text-sm cursor-grab border rounded px-3 py-1.5 bg-card hover:bg-muted transition-colors"
                onDragStart={(event) => onDragStart(event, 'end')} 
                draggable
              >
                🏁 End Flow
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>

      {/* Properties Editor Sheet */}
      <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col gap-6" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Edit {selectedNode?.type === 'message' ? 'Message' : selectedNode?.type === 'wait' ? 'Wait' : selectedNode?.type === 'condition' ? 'Condition' : selectedNode?.type === 'transfer' ? 'Transfer' : selectedNode?.type === 'interactive_menu' ? 'Smart Menu' : selectedNode?.type === 'dynamic_list' ? 'Dynamic List' : selectedNode?.type === 'validate' ? 'Validate Input' : selectedNode?.type === 'tag' ? 'Tag Contact' : selectedNode?.type === 'api' ? 'API Call' : selectedNode?.type === 'business_hours' ? 'Business Hours' : selectedNode?.type === 'end' ? 'End Flow' : 'Node'}</SheetTitle>
            <SheetDescription>Configure the properties for this step in the flow.</SheetDescription>
          </SheetHeader>
          
          {selectedNode && (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input 
                  value={selectedNode.data.label as string || ''} 
                  onChange={(e) => updateNodeData('label', e.target.value)}
                  placeholder="e.g. Welcome Message"
                />
              </div>

              {selectedNode.type === 'message' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Message Content</Label>
                    <Textarea 
                      value={selectedNode.data.message as string || ''} 
                      onChange={(e) => updateNodeData('message', e.target.value)}
                      placeholder="Hi! How can I help you today?"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">This exact text will be sent to the user on WhatsApp.</p>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <Label>Attachment (Optional)</Label>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Media URL (e.g. https://.../brochure.pdf)" 
                        value={selectedNode.data.mediaUrl as string || ''} 
                        onChange={(e) => updateNodeData('mediaUrl', e.target.value)}
                      />
                    </div>
                    {selectedNode.data.mediaUrl && (
                      <div className="flex gap-2">
                        <Select 
                          value={selectedNode.data.mediaType as string || 'document'} 
                          onValueChange={(v) => updateNodeData('mediaType', v)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="document">Document (PDF)</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="audio">Audio</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="Filename (e.g. Brochure.pdf)" 
                          className="flex-1"
                          value={selectedNode.data.mediaName as string || ''} 
                          onChange={(e) => updateNodeData('mediaName', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Interactive Buttons (Optional)</Label>
                      <Button variant="outline" size="sm" onClick={() => {
                        const btns = (selectedNode.data.buttons as any[]) || [];
                        const maxId = btns.length > 0 
                          ? Math.max(...btns.map(b => parseInt(b.id) || 0)) 
                          : 0;
                        const newId = String(maxId + 1);
                        updateNodeData('buttons', [...btns, { id: newId, title: "New Button" }]);
                      }}>
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">1-3 buttons = Quick Reply. 4-10 = List Menu.</p>
                    
                    <div className="space-y-2">
                      {((selectedNode.data.buttons as any[]) || []).map((btn, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input 
                            placeholder="ID (e.g. 1)" 
                            className="w-16 h-8 text-sm"
                            value={btn.id}
                            onChange={(e) => {
                            const btns = (selectedNode.data.buttons as any[]).map((b, bIdx) => 
                              bIdx === idx ? { ...b, id: e.target.value } : b
                            );
                            updateNodeData('buttons', btns);
                            }}
                          />
                          <Input 
                            placeholder="Button Title" 
                            className="flex-1 h-8 text-sm"
                            value={btn.title}
                            onChange={(e) => {
                            const btns = (selectedNode.data.buttons as any[]).map((b, bIdx) => 
                              bIdx === idx ? { ...b, title: e.target.value } : b
                            );
                            updateNodeData('buttons', btns);
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => {
                              const btns = [...(selectedNode.data.buttons as any[])];
                              btns.splice(idx, 1);
                              updateNodeData('buttons', btns);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === 'wait' && (
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input 
                    type="number"
                    value={selectedNode.data.duration as string || '60'} 
                    onChange={(e) => updateNodeData('duration', e.target.value)}
                  />
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div className="space-y-2">
                  <Label>Variable to check</Label>
                  <Input 
                    value={selectedNode.data.variable as string || ''} 
                    onChange={(e) => updateNodeData('variable', e.target.value)}
                    placeholder="e.g. reply == 1 or reply != 0"
                  />
                </div>
              )}

              {selectedNode.type === 'interactive_menu' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Prompt Message</Label>
                    <Textarea 
                      value={selectedNode.data.message as string || ''} 
                      onChange={(e) => updateNodeData('message', e.target.value)}
                      placeholder="Please select an option:"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Menu Options (Max 10)</Label>
                    {(selectedNode.data.options as any[] || []).map((opt, i, arr) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <Input 
                          value={opt.title} 
                          onChange={(e) => {
                            const newOpts = (selectedNode.data.options as any[]).map((o, oIdx) => 
                              oIdx === i ? { ...o, title: e.target.value } : o
                            );
                            updateNodeData('options', newOpts);
                          }}
                        />
                        <div className="flex flex-col gap-0.5">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-4 w-6 px-0 py-0" 
                            disabled={i === 0}
                            onClick={() => {
                              const newOpts = [...arr];
                              const temp = newOpts[i];
                              newOpts[i] = newOpts[i - 1];
                              newOpts[i - 1] = temp;
                              updateNodeData('options', newOpts);
                            }}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-4 w-6 px-0 py-0" 
                            disabled={i === arr.length - 1}
                            onClick={() => {
                              const newOpts = [...arr];
                              const temp = newOpts[i];
                              newOpts[i] = newOpts[i + 1];
                              newOpts[i + 1] = temp;
                              updateNodeData('options', newOpts);
                            }}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="destructive" size="icon" onClick={() => {
                            const newOpts = [...arr];
                            newOpts.splice(i, 1);
                            updateNodeData('options', newOpts);
                        }}>X</Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const opts = selectedNode.data.options as any[] || [];
                        if (opts.length < 10) {
                          updateNodeData('options', [...opts, { id: `opt_${Date.now()}`, title: "New Option" }]);
                        }
                      }}
                    >
                      + Add Option
                    </Button>
                  </div>
                </div>
              )}

              {selectedNode.type === 'dynamic_list' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message Content</Label>
                    <Textarea 
                      value={selectedNode.data.message as string || ''} 
                      onChange={(e) => updateNodeData('message', e.target.value)}
                      placeholder="Please select a project:"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <Label>Database Filter Field</Label>
                    <Input 
                      value={selectedNode.data.filterField as string || ''} 
                      onChange={(e) => updateNodeData('filterField', e.target.value)}
                      placeholder="e.g. type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Database Filter Value</Label>
                    <Input 
                      value={selectedNode.data.filterValue as string || ''} 
                      onChange={(e) => updateNodeData('filterValue', e.target.value)}
                      placeholder="e.g. Residential"
                    />
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <Label>Save Selection As Variable</Label>
                    <Input 
                      value={selectedNode.data.variableName as string || 'selected_project'} 
                      onChange={(e) => updateNodeData('variableName', e.target.value)}
                      placeholder="e.g. selected_project"
                    />
                    <p className="text-xs text-muted-foreground mt-1">This saves their choice in memory so you can use {"{{"}{selectedNode.data.variableName as string || 'selected_project'}{"}}"} in later messages.</p>
                  </div>
                </div>
              )}

              {selectedNode.type === 'validate' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Validation Type</Label>
                    <Select 
                      value={selectedNode.data.validationType as string || 'text'} 
                      onValueChange={(v) => updateNodeData('validationType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Any Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone Number</SelectItem>
                        <SelectItem value="number">Numeric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <Label>Variable Name (Optional)</Label>
                    <Input 
                      value={selectedNode.data.variableName as string || ''} 
                      onChange={(e) => updateNodeData('variableName', e.target.value)}
                      placeholder="e.g. user_email"
                    />
                    <p className="text-xs text-muted-foreground">Save the valid input to this variable.</p>
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <Label>Error Message (If Invalid)</Label>
                    <Textarea 
                      value={selectedNode.data.errorMessage as string || 'Invalid input. Please try again.'} 
                      onChange={(e) => updateNodeData('errorMessage', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'tag' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tag Name</Label>
                    <Input 
                      value={selectedNode.data.tagName as string || ''} 
                      onChange={(e) => updateNodeData('tagName', e.target.value)}
                      placeholder="e.g. VIP, Needs Support"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'api' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Endpoint URL</Label>
                    <Input 
                      value={selectedNode.data.url as string || ''} 
                      onChange={(e) => updateNodeData('url', e.target.value)}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select 
                      value={selectedNode.data.method as string || 'POST'} 
                      onValueChange={(v) => updateNodeData('method', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <Label>JSON Body Template</Label>
                    <Textarea 
                      value={selectedNode.data.bodyTemplate as string || '{\n  "contact": "{{contactName}}"\n}'} 
                      onChange={(e) => updateNodeData('bodyTemplate', e.target.value)}
                      className="font-mono text-xs"
                      rows={5}
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'business_hours' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select 
                      value={selectedNode.data.timezone as string || 'UTC'} 
                      onValueChange={(v) => updateNodeData('timezone', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input 
                        type="time"
                        value={selectedNode.data.startTime as string || '09:00'} 
                        onChange={(e) => updateNodeData('startTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input 
                        type="time"
                        value={selectedNode.data.endTime as string || '17:00'} 
                        onChange={(e) => updateNodeData('endTime', e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Days are hardcoded to Monday-Friday for now.</p>
                </div>
              )}

              {selectedNode.type === 'end' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">The flow will cleanly terminate when it reaches this node. The conversation status remains open unless otherwise specified.</p>
                </div>
              )}

              <div className="pt-6 mt-4 border-t border-border">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={deleteSelectedNode}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function FlowBuilderClient({ 
  organizationId,
  initialSavedNodes,
  initialSavedEdges
}: { 
  organizationId: string;
  initialSavedNodes?: Node[] | null;
  initialSavedEdges?: Edge[] | null;
}) {
  return (
    <ReactFlowProvider>
      <FlowBuilder 
        organizationId={organizationId} 
        initialSavedNodes={initialSavedNodes}
        initialSavedEdges={initialSavedEdges}
      />
    </ReactFlowProvider>
  );
}
