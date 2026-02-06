"use client";

import { useCallback } from "react";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { useCommentNavigation } from "@/hooks/useCommentNavigation";
import { Veo1080pVideoNodeData } from "@/types";

type Veo1080pNodeType = Node<Veo1080pVideoNodeData, "veo1080pVideo">;

export function Veo1080pVideoNode({ id, data, selected }: NodeProps<Veo1080pNodeType>) {
  const nodeData = data;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const regenerateNode = useWorkflowStore((state) => state.regenerateNode);
  const isRunning = useWorkflowStore((state) => state.isRunning);
  const commentNavigation = useCommentNavigation(id);

  const handleRun = useCallback(() => {
    regenerateNode(id);
  }, [id, regenerateNode]);

  const handleTaskIdChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { inputTaskId: event.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      title="Veo 1080p"
      customTitle={nodeData.customTitle}
      comment={nodeData.comment}
      onCustomTitleChange={(title) => updateNodeData(id, { customTitle: title || undefined })}
      onCommentChange={(comment) => updateNodeData(id, { comment: comment || undefined })}
      onRun={handleRun}
      selected={selected}
      isExecuting={isRunning}
      hasError={nodeData.status === "error"}
      commentNavigation={commentNavigation ?? undefined}
    >
      <Handle type="target" position={Position.Left} id="taskId" data-handletype="text" style={{ top: "50%" }} />
      <Handle type="source" position={Position.Right} id="video" data-handletype="video" />
      <Handle type="source" position={Position.Right} id="taskId" data-handletype="text" style={{ top: "70%" }} />

      <div className="absolute text-[10px] font-medium whitespace-nowrap pointer-events-none" style={{ right: `calc(100% + 8px)`, top: "calc(50% - 18px)", color: "var(--handle-color-text)" }}>
        TaskId
      </div>
      <div className="absolute text-[10px] font-medium whitespace-nowrap pointer-events-none" style={{ left: `calc(100% + 8px)`, top: "calc(50% - 18px)", color: "var(--handle-color-image)" }}>
        Video
      </div>
      <div className="absolute text-[10px] font-medium whitespace-nowrap pointer-events-none" style={{ left: `calc(100% + 8px)`, top: "calc(70% - 18px)", color: "var(--handle-color-text)" }}>
        TaskId
      </div>

      <div className="flex-1 flex flex-col min-h-0 gap-2">
        {nodeData.outputTaskId && (
          <div className="text-[10px] text-neutral-400 truncate" title={nodeData.outputTaskId}>
            TaskId: {nodeData.outputTaskId}
          </div>
        )}

        <input
          type="text"
          value={nodeData.inputTaskId || ""}
          onChange={handleTaskIdChange}
          placeholder="TaskId to upscale..."
          className="nodrag nopan w-full bg-neutral-900/50 border border-neutral-700 rounded text-[10px] text-neutral-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-600"
        />

        {nodeData.outputVideo ? (
          <div className="relative w-full flex-1 min-h-0">
            <video
              src={nodeData.outputVideo}
              controls
              autoPlay
              loop
              muted
              className="w-full h-full object-contain rounded"
              playsInline
            />
          </div>
        ) : (
          <div className="w-full flex-1 min-h-[96px] border border-dashed border-neutral-600 rounded flex items-center justify-center">
            {nodeData.status === "loading" ? (
              <span className="text-[10px] text-neutral-400">Fetching 1080p...</span>
            ) : nodeData.status === "error" ? (
              <span className="text-[10px] text-red-400 text-center px-2">{nodeData.error || "Failed"}</span>
            ) : (
              <span className="text-[10px] text-neutral-500">Run to fetch</span>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
