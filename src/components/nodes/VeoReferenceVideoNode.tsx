"use client";

import { useCallback } from "react";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { useCommentNavigation } from "@/hooks/useCommentNavigation";
import { VeoReferenceVideoNodeData } from "@/types";

type VeoReferenceNodeType = Node<VeoReferenceVideoNodeData, "veoReferenceVideo">;

export function VeoReferenceVideoNode({ id, data, selected }: NodeProps<VeoReferenceNodeType>) {
  const nodeData = data;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const regenerateNode = useWorkflowStore((state) => state.regenerateNode);
  const isRunning = useWorkflowStore((state) => state.isRunning);
  const commentNavigation = useCommentNavigation(id);

  const handleRun = useCallback(() => {
    regenerateNode(id);
  }, [id, regenerateNode]);

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { inputPrompt: event.target.value });
    },
    [id, updateNodeData]
  );

  const handleAspectRatioChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { aspectRatio: event.target.value as "16:9" | "9:16" });
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      title="Veo Reference"
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
      <Handle type="target" position={Position.Left} id="image" data-handletype="image" style={{ top: "30%" }} />
      <Handle type="target" position={Position.Left} id="text" data-handletype="text" style={{ top: "70%" }} />
      <Handle type="source" position={Position.Right} id="video" data-handletype="video" />
      <Handle type="source" position={Position.Right} id="taskId" data-handletype="text" style={{ top: "70%" }} />

      <div className="absolute text-[10px] font-medium whitespace-nowrap pointer-events-none" style={{ right: `calc(100% + 8px)`, top: "calc(30% - 18px)", color: "var(--handle-color-image)" }}>
        Image
      </div>
      <div className="absolute text-[10px] font-medium whitespace-nowrap pointer-events-none" style={{ right: `calc(100% + 8px)`, top: "calc(70% - 18px)", color: "var(--handle-color-text)" }}>
        Prompt
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

        <textarea
          value={nodeData.inputPrompt || ""}
          onChange={handlePromptChange}
          placeholder="Reference prompt..."
          className="nodrag nopan nowheel w-full min-h-[54px] resize-none bg-neutral-900/50 border border-neutral-700 rounded text-[10px] text-neutral-200 p-2 focus:outline-none focus:ring-1 focus:ring-neutral-600"
        />

        <div className="flex items-center gap-2">
          <label className="text-[10px] text-neutral-400 whitespace-nowrap">Aspect Ratio:</label>
          <select
            value={nodeData.aspectRatio}
            onChange={handleAspectRatioChange}
            className="nodrag nopan flex-1 min-w-0 bg-neutral-900/50 border border-neutral-700 rounded text-[10px] text-neutral-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
          </select>
        </div>

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
              <span className="text-[10px] text-neutral-400">Generating...</span>
            ) : nodeData.status === "error" ? (
              <span className="text-[10px] text-red-400 text-center px-2">{nodeData.error || "Failed"}</span>
            ) : (
              <span className="text-[10px] text-neutral-500">Run to generate</span>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
