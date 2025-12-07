"use client";

import { useCallback, useRef, useState, useEffect, DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  Connection,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  OnConnectEnd,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore, WorkflowFile } from "@/store/workflowStore";
import {
  ImageInputNode,
  AnnotationNode,
  PromptNode,
  NanoBananaNode,
  LLMGenerateNode,
  OutputNode,
} from "./nodes";
import { EditableEdge } from "./edges";
import { ConnectionDropMenu } from "./ConnectionDropMenu";
import { MultiSelectToolbar } from "./MultiSelectToolbar";
import { EdgeToolbar } from "./EdgeToolbar";
import { NodeType } from "@/types";

const nodeTypes: NodeTypes = {
  imageInput: ImageInputNode,
  annotation: AnnotationNode,
  prompt: PromptNode,
  nanoBanana: NanoBananaNode,
  llmGenerate: LLMGenerateNode,
  output: OutputNode,
};

const edgeTypes: EdgeTypes = {
  editable: EditableEdge,
};

// Connection validation rules
// - Image handles (green) can only connect to image handles
// - Text handles (blue) can only connect to text handles
// - NanoBanana image input accepts multiple connections
// - All other inputs accept only one connection
const isValidConnection = (connection: Edge | Connection): boolean => {
  const sourceHandle = connection.sourceHandle;
  const targetHandle = connection.targetHandle;

  // Strict type matching: image <-> image, text <-> text
  if (sourceHandle === "image" && targetHandle !== "image") {
    return false;
  }
  if (sourceHandle === "text" && targetHandle !== "text") {
    return false;
  }

  return true;
};

interface ConnectionDropState {
  position: { x: number; y: number };
  flowPosition: { x: number; y: number };
  handleType: "image" | "text" | null;
  connectionType: "source" | "target";
  sourceNodeId: string | null;
  sourceHandleId: string | null;
}

function WorkflowCanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, updateNodeData, loadWorkflow } =
    useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropType, setDropType] = useState<"image" | "workflow" | "node" | null>(null);
  const [connectionDrop, setConnectionDrop] = useState<ConnectionDropState | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) return;

      // Get all selected nodes
      const selectedNodes = nodes.filter((node) => node.selected);
      const sourceNode = nodes.find((node) => node.id === connection.source);

      // If the source node is selected and there are multiple selected nodes,
      // connect all selected nodes that have the same source handle type
      if (sourceNode?.selected && selectedNodes.length > 1 && connection.sourceHandle) {
        selectedNodes.forEach((node) => {
          // Skip if this is already the connection source
          if (node.id === connection.source) {
            onConnect(connection);
            return;
          }

          // Create connection from this selected node to the same target
          const multiConnection: Connection = {
            source: node.id,
            sourceHandle: connection.sourceHandle,
            target: connection.target,
            targetHandle: connection.targetHandle,
          };

          if (isValidConnection(multiConnection)) {
            onConnect(multiConnection);
          }
        });
      } else {
        // Single connection
        onConnect(connection);
      }
    },
    [onConnect, nodes]
  );

  // Define which handles each node type has
  const getNodeHandles = useCallback((nodeType: string): { inputs: string[]; outputs: string[] } => {
    switch (nodeType) {
      case "imageInput":
        return { inputs: [], outputs: ["image"] };
      case "annotation":
        return { inputs: ["image"], outputs: ["image"] };
      case "prompt":
        return { inputs: [], outputs: ["text"] };
      case "nanoBanana":
        return { inputs: ["image", "text"], outputs: ["image"] };
      case "llmGenerate":
        return { inputs: ["text", "image"], outputs: ["text"] };
      case "output":
        return { inputs: ["image"], outputs: [] };
      default:
        return { inputs: [], outputs: [] };
    }
  }, []);

  // Handle connection dropped on empty space or on a node
  const handleConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      // If connection was completed normally, nothing to do
      if (connectionState.isValid || !connectionState.fromNode) {
        return;
      }

      const { clientX, clientY } = event as MouseEvent;
      const fromHandleId = connectionState.fromHandle?.id || null;
      const fromHandleType = (fromHandleId === "image" || fromHandleId === "text") ? fromHandleId : null;
      const isFromSource = connectionState.fromHandle?.type === "source";

      // Check if we dropped on a node by looking for node elements under the cursor
      const elementsUnderCursor = document.elementsFromPoint(clientX, clientY);
      const nodeElement = elementsUnderCursor.find((el) => {
        // React Flow nodes have data-id attribute
        return el.closest(".react-flow__node");
      });

      if (nodeElement) {
        const nodeWrapper = nodeElement.closest(".react-flow__node") as HTMLElement;
        const targetNodeId = nodeWrapper?.dataset.id;

        if (targetNodeId && targetNodeId !== connectionState.fromNode.id && fromHandleType) {
          const targetNode = nodes.find((n) => n.id === targetNodeId);

          if (targetNode) {
            const targetHandles = getNodeHandles(targetNode.type || "");

            // Find a compatible handle on the target node
            let compatibleHandle: string | null = null;

            if (isFromSource) {
              // Dragging from output, need an input on target that matches type
              if (targetHandles.inputs.includes(fromHandleType)) {
                compatibleHandle = fromHandleType;
              }
            } else {
              // Dragging from input, need an output on target that matches type
              if (targetHandles.outputs.includes(fromHandleType)) {
                compatibleHandle = fromHandleType;
              }
            }

            if (compatibleHandle) {
              // Create the connection
              const connection: Connection = isFromSource
                ? {
                    source: connectionState.fromNode.id,
                    sourceHandle: fromHandleId,
                    target: targetNodeId,
                    targetHandle: compatibleHandle,
                  }
                : {
                    source: targetNodeId,
                    sourceHandle: compatibleHandle,
                    target: connectionState.fromNode.id,
                    targetHandle: fromHandleId,
                  };

              if (isValidConnection(connection)) {
                handleConnect(connection);
                return; // Connection made, don't show menu
              }
            }
          }
        }
      }

      // No node under cursor or no compatible handle - show the drop menu
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });

      setConnectionDrop({
        position: { x: clientX, y: clientY },
        flowPosition: flowPos,
        handleType: fromHandleType,
        connectionType: isFromSource ? "source" : "target",
        sourceNodeId: connectionState.fromNode.id,
        sourceHandleId: fromHandleId,
      });
    },
    [screenToFlowPosition, nodes, getNodeHandles, handleConnect]
  );

  // Handle node selection from drop menu
  const handleNodeSelect = useCallback(
    (nodeType: NodeType) => {
      if (!connectionDrop) return;

      const { flowPosition, sourceNodeId, sourceHandleId, connectionType, handleType } = connectionDrop;

      // Create the new node at the drop position
      const newNodeId = addNode(nodeType, flowPosition);

      // Determine the correct handle IDs for the new node based on its type
      let targetHandleId: string | null = null;
      let sourceHandleIdForNewNode: string | null = null;

      // Map handle type to the correct handle ID based on node type
      if (handleType === "image") {
        if (nodeType === "annotation" || nodeType === "output") {
          targetHandleId = "image";
        } else if (nodeType === "nanoBanana") {
          targetHandleId = "image";
        } else if (nodeType === "imageInput") {
          sourceHandleIdForNewNode = "image";
        }
      } else if (handleType === "text") {
        if (nodeType === "nanoBanana" || nodeType === "llmGenerate") {
          targetHandleId = "text";
          // llmGenerate also has a text output
          if (nodeType === "llmGenerate") {
            sourceHandleIdForNewNode = "text";
          }
        } else if (nodeType === "prompt") {
          sourceHandleIdForNewNode = "text";
        }
      }

      // Get all selected nodes to connect them all to the new node
      const selectedNodes = nodes.filter((node) => node.selected);
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);

      // If the source node is selected and there are multiple selected nodes,
      // connect all selected nodes to the new node
      if (sourceNode?.selected && selectedNodes.length > 1 && sourceHandleId) {
        selectedNodes.forEach((node) => {
          if (connectionType === "source" && targetHandleId) {
            // Dragging from source (output), connect selected nodes to new node's input
            const connection: Connection = {
              source: node.id,
              sourceHandle: sourceHandleId,
              target: newNodeId,
              targetHandle: targetHandleId,
            };
            if (isValidConnection(connection)) {
              onConnect(connection);
            }
          } else if (connectionType === "target" && sourceHandleIdForNewNode) {
            // Dragging from target (input), connect from new node's output to selected nodes
            const connection: Connection = {
              source: newNodeId,
              sourceHandle: sourceHandleIdForNewNode,
              target: node.id,
              targetHandle: sourceHandleId,
            };
            if (isValidConnection(connection)) {
              onConnect(connection);
            }
          }
        });
      } else {
        // Single node connection (original behavior)
        if (connectionType === "source" && sourceNodeId && sourceHandleId && targetHandleId) {
          // Dragging from source (output), connect to new node's input
          const connection: Connection = {
            source: sourceNodeId,
            sourceHandle: sourceHandleId,
            target: newNodeId,
            targetHandle: targetHandleId,
          };
          onConnect(connection);
        } else if (connectionType === "target" && sourceNodeId && sourceHandleId && sourceHandleIdForNewNode) {
          // Dragging from target (input), connect from new node's output
          const connection: Connection = {
            source: newNodeId,
            sourceHandle: sourceHandleIdForNewNode,
            target: sourceNodeId,
            targetHandle: sourceHandleId,
          };
          onConnect(connection);
        }
      }

      setConnectionDrop(null);
    },
    [connectionDrop, addNode, onConnect, nodes]
  );

  const handleCloseDropMenu = useCallback(() => {
    setConnectionDrop(null);
  }, []);

  // Get copy/paste functions from store
  const { copySelectedNodes, pasteNodes } = useWorkflowStore();

  // Keyboard shortcuts for copy/paste and stacking selected nodes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle copy (Ctrl/Cmd + C)
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault();
        copySelectedNodes();
        return;
      }

      // Handle paste (Ctrl/Cmd + V)
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        pasteNodes();
        return;
      }

      const selectedNodes = nodes.filter((node) => node.selected);
      if (selectedNodes.length < 2) return;

      const STACK_GAP = 20;

      if (event.key === "v" || event.key === "V") {
        // Stack vertically - sort by current y position to maintain relative order
        const sortedNodes = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);

        // Use the leftmost x position as the alignment point
        const alignX = Math.min(...sortedNodes.map((n) => n.position.x));

        let currentY = sortedNodes[0].position.y;

        sortedNodes.forEach((node) => {
          const nodeHeight = (node.style?.height as number) || (node.measured?.height) || 200;

          onNodesChange([
            {
              type: "position",
              id: node.id,
              position: { x: alignX, y: currentY },
            },
          ]);

          currentY += nodeHeight + STACK_GAP;
        });
      } else if (event.key === "h" || event.key === "H") {
        // Stack horizontally - sort by current x position to maintain relative order
        const sortedNodes = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);

        // Use the topmost y position as the alignment point
        const alignY = Math.min(...sortedNodes.map((n) => n.position.y));

        let currentX = sortedNodes[0].position.x;

        sortedNodes.forEach((node) => {
          const nodeWidth = (node.style?.width as number) || (node.measured?.width) || 220;

          onNodesChange([
            {
              type: "position",
              id: node.id,
              position: { x: currentX, y: alignY },
            },
          ]);

          currentX += nodeWidth + STACK_GAP;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, onNodesChange, copySelectedNodes, pasteNodes]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    // Check if dragging a node type from the action bar
    const hasNodeType = Array.from(event.dataTransfer.types).includes("application/node-type");
    if (hasNodeType) {
      setIsDragOver(true);
      setDropType("node");
      return;
    }

    // Check if dragging files that are images or JSON
    const items = Array.from(event.dataTransfer.items);
    const hasImageFile = items.some(
      (item) => item.kind === "file" && item.type.startsWith("image/")
    );
    const hasJsonFile = items.some(
      (item) => item.kind === "file" && item.type === "application/json"
    );

    if (hasJsonFile) {
      setIsDragOver(true);
      setDropType("workflow");
    } else if (hasImageFile) {
      setIsDragOver(true);
      setDropType("image");
    }
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    setDropType(null);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      setDropType(null);

      // Check for node type drop from action bar
      const nodeType = event.dataTransfer.getData("application/node-type") as NodeType;
      if (nodeType) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        addNode(nodeType, position);
        return;
      }

      const allFiles = Array.from(event.dataTransfer.files);

      // Check for JSON workflow files first
      const jsonFiles = allFiles.filter((file) => file.type === "application/json" || file.name.endsWith(".json"));
      if (jsonFiles.length > 0) {
        const file = jsonFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workflow = JSON.parse(e.target?.result as string) as WorkflowFile;
            if (workflow.version && workflow.nodes && workflow.edges) {
              loadWorkflow(workflow);
            } else {
              alert("Invalid workflow file format");
            }
          } catch {
            alert("Failed to parse workflow file");
          }
        };
        reader.readAsText(file);
        return;
      }

      // Handle image files
      const imageFiles = allFiles.filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      // Get the drop position in flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create a node for each dropped image
      imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;

          // Create image to get dimensions
          const img = new Image();
          img.onload = () => {
            // Add the node at the drop position (offset for multiple files)
            const nodeId = addNode("imageInput", {
              x: position.x + index * 240,
              y: position.y,
            });

            // Update the node with the image data
            updateNodeData(nodeId, {
              image: dataUrl,
              filename: file.name,
              dimensions: { width: img.width, height: img.height },
            });
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    },
    [screenToFlowPosition, addNode, updateNodeData, loadWorkflow]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className={`flex-1 bg-canvas-bg relative ${isDragOver ? "ring-2 ring-inset ring-blue-500" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/10 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-6 py-4 shadow-xl">
            <p className="text-neutral-200 text-sm font-medium">
              {dropType === "workflow"
                ? "Drop to load workflow"
                : dropType === "node"
                ? "Drop to create node"
                : "Drop image to create node"}
            </p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectEnd={handleConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
        selectionOnDrag={false}
        panOnDrag
        selectNodesOnDrag={false}
        nodeDragThreshold={5}
        className="bg-neutral-900"
        defaultEdgeOptions={{
          type: "editable",
          animated: false,
        }}
      >
        <Background color="#404040" gap={20} size={1} />
        <Controls className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg [&>button]:bg-neutral-800 [&>button]:border-neutral-700 [&>button]:fill-neutral-300 [&>button:hover]:bg-neutral-700 [&>button:hover]:fill-neutral-100" />
        <MiniMap
          className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg"
          maskColor="rgba(0, 0, 0, 0.6)"
          nodeColor={(node) => {
            switch (node.type) {
              case "imageInput":
                return "#3b82f6";
              case "annotation":
                return "#8b5cf6";
              case "prompt":
                return "#f97316";
              case "nanoBanana":
                return "#22c55e";
              case "llmGenerate":
                return "#06b6d4";
              case "output":
                return "#ef4444";
              default:
                return "#94a3b8";
            }
          }}
        />
      </ReactFlow>

      {/* Connection drop menu */}
      {connectionDrop && connectionDrop.handleType && (
        <ConnectionDropMenu
          position={connectionDrop.position}
          handleType={connectionDrop.handleType}
          connectionType={connectionDrop.connectionType}
          onSelect={handleNodeSelect}
          onClose={handleCloseDropMenu}
        />
      )}

      {/* Multi-select toolbar */}
      <MultiSelectToolbar />

      {/* Edge toolbar */}
      <EdgeToolbar />
    </div>
  );
}

// Wrap with ReactFlowProvider to enable useReactFlow hook
export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
