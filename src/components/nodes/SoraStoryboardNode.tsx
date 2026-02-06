import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { 
  SoraStoryboardNodeData, 
  StoryboardScene 
} from "@/types";
import { useWorkflowStore } from "@/store/workflowStore";
import { BaseNode } from "./BaseNode";

// Inline SVG Icons to avoid lucide-react dependency
const Icons = {
  Layout: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  RefreshCcw: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  ),
  Trash2: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Plus: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  AlertCircle: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Clock: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

export const SoraStoryboardNode: React.FC<{
  id: string;
  data: SoraStoryboardNodeData;
  selected?: boolean;
}> = ({ id, data, selected }) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const regenerateNode = useWorkflowStore((state) => state.regenerateNode);

  const scenes = data.scenes || [];
  const totalDuration = useMemo(() => 
    scenes.reduce((sum, scene) => sum + (scene.duration || 0), 0), 
  [scenes]);

  const targetDuration = parseInt(data.nFrames || "15", 10);
  const isDurationValid = Math.abs(totalDuration - targetDuration) < 0.01;

  const handleSceneChange = (sceneId: string, updates: Partial<StoryboardScene>) => {
    const newScenes = scenes.map((s) => 
      s.id === sceneId ? { ...s, ...updates } : s
    );
    updateNodeData(id, { scenes: newScenes });
  };

  const addScene = () => {
    const newScene: StoryboardScene = {
      id: crypto.randomUUID(),
      prompt: "",
      duration: 5,
    };
    updateNodeData(id, { scenes: [...scenes, newScene] });
  };

  const removeScene = (sceneId: string) => {
    if (scenes.length <= 1) return;
    updateNodeData(id, { 
      scenes: scenes.filter((s) => s.id !== sceneId) 
    });
  };

  const handleRun = () => {
    if (!isDurationValid) {
      alert(`Total duration (${totalDuration.toFixed(1)}s) must match the target duration (${targetDuration}s)`);
      return;
    }
    regenerateNode(id);
  };

  const handleClear = () => {
    updateNodeData(id, {
      outputVideo: null,
      outputTaskId: null,
      status: "idle",
      error: null,
    });
  };

  return (
    <BaseNode
      id={id}
      title="Sora Storyboard"
      customTitle={data.customTitle}
      comment={data.comment}
      onCustomTitleChange={(val) => updateNodeData(id, { customTitle: val })}
      onCommentChange={(val) => updateNodeData(id, { comment: val })}
      selected={selected}
      isExecuting={data.status === "loading"}
      hasError={!!data.error}
      onRun={handleRun}
      titlePrefix={
        <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/20 text-blue-400">
          <Icons.Layout size={12} />
        </div>
      }
      headerAction={
        data.outputVideo ? (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Clear output"
          >
            <Icons.RefreshCcw size={14} className="text-zinc-400" />
          </button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 p-3">
        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          id="image"
          className="w-3 h-3 bg-zinc-600 border-2 border-zinc-900"
          style={{ top: "25%" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="video"
          className="w-3 h-3 bg-blue-500 border-2 border-zinc-900"
          style={{ top: "50%" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="taskId"
          className="w-3 h-3 bg-zinc-600 border-2 border-zinc-900"
          style={{ top: "75%" }}
        />

        {/* Configuration */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Icons.Clock size={10} /> DURATION (TOTAL)
            </label>
            <select
              value={data.nFrames}
              onChange={(e) => updateNodeData(id, { nFrames: e.target.value as any })}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
            >
              <option value="10">10 Seconds</option>
              <option value="15">15 Seconds</option>
              <option value="25">25 Seconds</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Icons.Layout size={10} /> ASPECT RATIO
            </label>
            <select
              value={data.aspectRatio}
              onChange={(e) => updateNodeData(id, { aspectRatio: e.target.value as any })}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
            >
              <option value="landscape">Landscape (16:9)</option>
              <option value="portrait">Portrait (9:16)</option>
            </select>
          </div>
        </div>

        {/* Scene Editor */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
              Scenes
            </label>
            <button
              onClick={addScene}
              className="p-1 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
              title="Add scene"
            >
              <Icons.Plus size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {scenes.map((scene, index) => (
              <div 
                key={scene.id} 
                className="bg-zinc-900/50 border border-zinc-800 rounded p-2 flex flex-col gap-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-600">
                    SCENE {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-800 rounded px-1.5 py-0.5">
                      <Icons.Clock size={10} className="text-zinc-500" />
                      <input
                        type="number"
                        min="0.1"
                        max="15"
                        step="0.1"
                        value={scene.duration}
                        onChange={(e) => handleSceneChange(scene.id, { duration: parseFloat(e.target.value) })}
                        className="bg-transparent text-[10px] w-8 outline-none text-blue-400 font-bold"
                      />
                      <span className="text-[9px] text-zinc-600">s</span>
                    </div>
                    <button
                      onClick={() => removeScene(scene.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Icons.Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={scene.prompt}
                  onChange={(e) => handleSceneChange(scene.id, { prompt: e.target.value })}
                  placeholder="Describe this scene..."
                  className="bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs h-16 resize-none outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Duration Guardrail */}
        <div className={`flex items-center gap-2 p-2 rounded text-[10px] border ${
          isDurationValid 
            ? "bg-green-500/5 border-green-500/20 text-green-400" 
            : "bg-orange-500/5 border-orange-500/20 text-orange-400"
        }`}>
          {isDurationValid ? (
            <Icons.Clock size={12} />
          ) : (
            <Icons.AlertCircle size={12} />
          )}
          <div className="flex-1 flex justify-between items-center">
            <span>Total: {totalDuration.toFixed(1)}s / {targetDuration}s</span>
            {!isDurationValid && (
              <span className="font-bold">
                {totalDuration < targetDuration ? "Short" : "Over"} by {(Math.abs(totalDuration - targetDuration)).toFixed(1)}s
              </span>
            )}
          </div>
        </div>

        {/* Error State */}
        {data.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-[10px] text-red-400 flex items-start gap-2">
            <Icons.AlertCircle size={12} className="shrink-0 mt-0.5" />
            <p className="break-words">{data.error}</p>
          </div>
        )}

        {/* Task ID Info */}
        {data.outputTaskId && (
          <div className="text-[9px] font-mono text-zinc-600 truncate border-t border-zinc-800 pt-2">
            TASK: {data.outputTaskId}
          </div>
        )}

        {/* Output Preview */}
        {data.outputVideo && (
          <div className="mt-2 relative group aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black">
            <video
              src={data.outputVideo}
              className="w-full h-full object-cover"
              controls
              autoPlay
              loop
              muted
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
};

