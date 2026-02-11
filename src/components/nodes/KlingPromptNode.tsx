"use client";

import React, { useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Handle, Position } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { KlingPromptNodeData, KlingShot, KlingElement } from "@/types";
import { useWorkflowStore } from "@/store/workflowStore";

const Icons = {
  Film: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M7 6v12M17 6v12" />
      <path d="M2 10h5M17 10h5M2 14h5M17 14h5" />
    </svg>
  ),
  Plus: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Edit: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  AlertCircle: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const TOTAL_DURATION = 15;

export const KlingPromptNode: React.FC<{
  id: string;
  data: KlingPromptNodeData;
  selected?: boolean;
}> = ({ id, data, selected }) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const incrementModalCount = useWorkflowStore((state) => state.incrementModalCount);
  const decrementModalCount = useWorkflowStore((state) => state.decrementModalCount);

  const shots = data.shots || [];
  const totalDuration = useMemo(() => shots.reduce((sum, shot) => sum + (shot.duration || 0), 0), [shots]);
  const isDurationValid = !data.multiShots || Math.abs(totalDuration - TOTAL_DURATION) < 0.01;

  const [isElementModalOpen, setIsElementModalOpen] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [elementName, setElementName] = useState("");
  const [elementDescription, setElementDescription] = useState("");
  const [elementImages, setElementImages] = useState<string[]>([]);
  const [elementVideo, setElementVideo] = useState<string | null>(null);
  const [elementError, setElementError] = useState<string | null>(null);

  const resetElementModal = useCallback(() => {
    setElementName("");
    setElementDescription("");
    setElementImages([]);
    setElementVideo(null);
    setElementError(null);
    setEditingElementId(null);
  }, []);

  const openElementModal = useCallback((element?: KlingElement) => {
    if (element) {
      setEditingElementId(element.id);
      setElementName(element.name);
      setElementDescription(element.description);
      setElementImages(element.imageDataUrls || []);
      setElementVideo(element.videoDataUrl || null);
    } else {
      resetElementModal();
    }
    setIsElementModalOpen(true);
    incrementModalCount();
  }, [incrementModalCount, resetElementModal]);

  const closeElementModal = useCallback(() => {
    setIsElementModalOpen(false);
    decrementModalCount();
    resetElementModal();
  }, [decrementModalCount, resetElementModal]);

  const handleToggleMultiShots = useCallback((checked: boolean) => {
    const updates: Partial<KlingPromptNodeData> = { multiShots: checked };
    if (checked && !data.sound) {
      updates.sound = true;
    }
    updateNodeData(id, updates);
  }, [data.sound, id, updateNodeData]);

  const handleShotChange = useCallback((shotId: string, updates: Partial<KlingShot>) => {
    const updated = shots.map((shot) => (shot.id === shotId ? { ...shot, ...updates } : shot));
    updateNodeData(id, { shots: updated });
  }, [id, shots, updateNodeData]);

  const addShot = useCallback(() => {
    const newShot: KlingShot = { id: crypto.randomUUID(), prompt: "", duration: 1 };
    updateNodeData(id, { shots: [...shots, newShot] });
  }, [id, shots, updateNodeData]);

  const removeShot = useCallback((shotId: string) => {
    if (shots.length <= 2) return;
    updateNodeData(id, { shots: shots.filter((shot) => shot.id !== shotId) });
  }, [id, shots, updateNodeData]);

  const handleElementFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const hasVideo = fileArray.some((file) => file.type.startsWith("video/"));
    const hasImage = fileArray.some((file) => file.type.startsWith("image/"));

    if (hasVideo && hasImage) {
      setElementError("Please upload either images or a single video, not both.");
      return;
    }

    if (hasVideo && fileArray.length > 1) {
      setElementError("Only one video is allowed per element.");
      return;
    }

    setElementError(null);

    const readers = fileArray.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    }));

    Promise.all(readers)
      .then((results) => {
        if (hasVideo) {
          setElementVideo(results[0]);
          setElementImages([]);
        } else {
          setElementImages(results);
          setElementVideo(null);
        }
      })
      .catch(() => {
        setElementError("Failed to read files. Please try again.");
      });
  }, []);

  const saveElement = useCallback(() => {
    if (!elementName.trim()) {
      setElementError("Element name is required.");
      return;
    }
    if (!elementDescription.trim()) {
      setElementError("Element description is required.");
      return;
    }
    if (elementVideo && elementImages.length > 0) {
      setElementError("Please use either images or a video, not both.");
      return;
    }
    if (!elementVideo && elementImages.length < 2) {
      setElementError("Please upload 2-4 images or 1 video.");
      return;
    }
    if (elementImages.length > 4) {
      setElementError("You can upload up to 4 images.");
      return;
    }

    const newElement: KlingElement = {
      id: editingElementId || crypto.randomUUID(),
      name: elementName.trim(),
      description: elementDescription.trim(),
      imageDataUrls: elementVideo ? [] : elementImages,
      videoDataUrl: elementVideo || null,
    };

    const updatedElements = editingElementId
      ? data.elements.map((el) => (el.id === editingElementId ? newElement : el))
      : [...data.elements, newElement];

    updateNodeData(id, { elements: updatedElements });
    closeElementModal();
  }, [closeElementModal, data.elements, editingElementId, elementDescription, elementImages, elementName, elementVideo, id, updateNodeData]);

  const removeElement = useCallback((elementId: string) => {
    updateNodeData(id, { elements: data.elements.filter((el) => el.id !== elementId) });
  }, [data.elements, id, updateNodeData]);

  return (
    <>
      <BaseNode
        id={id}
        title="Kling 3 Prompt"
        customTitle={data.customTitle}
        comment={data.comment}
        onCustomTitleChange={(val) => updateNodeData(id, { customTitle: val })}
        onCommentChange={(val) => updateNodeData(id, { comment: val })}
        selected={selected}
        titlePrefix={
          <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-500/20 text-purple-300">
            <Icons.Film size={12} />
          </div>
        }
      >
        <Handle
          type="source"
          position={Position.Right}
          id="text"
          data-handletype="text"
        />

        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Multi Shots</label>
            <button
              onClick={() => handleToggleMultiShots(!data.multiShots)}
              className={`w-10 h-5 rounded-full transition-colors ${data.multiShots ? "bg-blue-500" : "bg-zinc-700"}`}
              type="button"
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${data.multiShots ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Sound</label>
            <button
              onClick={() => updateNodeData(id, { sound: !data.sound })}
              className={`w-10 h-5 rounded-full transition-colors ${data.sound ? "bg-blue-500" : "bg-zinc-700"}`}
              type="button"
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${data.sound ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Mode</label>
              <div className="flex gap-1">
                {(["std", "pro"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateNodeData(id, { mode })}
                    className={`flex-1 px-2 py-1 text-[10px] rounded border transition-colors ${data.mode === mode ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    type="button"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Aspect</label>
              <select
                value={data.aspectRatio}
                onChange={(e) => updateNodeData(id, { aspectRatio: e.target.value as KlingPromptNodeData["aspectRatio"] })}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
            </div>
          </div>

          {!data.multiShots && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Prompt</label>
              <textarea
                value={data.prompt}
                onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
                placeholder="Describe the scene..."
                className="bg-zinc-800 border border-zinc-700 rounded p-2 text-xs h-24 resize-none outline-none focus:border-blue-500/50 transition-colors"
              />
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Duration</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  step={1}
                  value={data.duration}
                  onChange={(e) => updateNodeData(id, { duration: Number(e.target.value) })}
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs w-16"
                />
                <span className="text-[10px] text-zinc-500">sec</span>
              </div>
            </div>
          )}

          {data.multiShots && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Shots</label>
                <button
                  onClick={addShot}
                  className="p-1 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
                  title="Add shot"
                  type="button"
                >
                  <Icons.Plus size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {shots.map((shot, index) => (
                  <div key={shot.id} className="bg-zinc-900/50 border border-zinc-800 rounded p-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-600">SHOT {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={12}
                          step={1}
                          value={shot.duration}
                          onChange={(e) => handleShotChange(shot.id, { duration: Number(e.target.value) })}
                          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-[10px] w-14"
                        />
                        <span className="text-[9px] text-zinc-600">s</span>
                        <button
                          onClick={() => removeShot(shot.id)}
                          className={`text-zinc-600 hover:text-red-400 transition-colors ${shots.length <= 2 ? "opacity-30 cursor-not-allowed" : ""}`}
                          disabled={shots.length <= 2}
                          type="button"
                        >
                          <Icons.Trash size={12} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={shot.prompt}
                      onChange={(e) => handleShotChange(shot.id, { prompt: e.target.value })}
                      placeholder="Describe this shot..."
                      className="bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs h-16 resize-none outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => openElementModal()}
                        className="px-2 py-1 text-[10px] rounded border border-dashed border-zinc-700 text-zinc-400 hover:text-blue-300 hover:border-blue-400/50 transition-colors"
                        type="button"
                      >
                        @Elements
                      </button>
                      <span className="text-[9px] text-zinc-500">Use @name in prompts</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`flex items-center gap-2 p-2 rounded text-[10px] border ${isDurationValid ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-orange-500/5 border-orange-500/20 text-orange-400"}`}>
                {isDurationValid ? <span>Total: {totalDuration.toFixed(1)}s / {TOTAL_DURATION}s</span> : (
                  <>
                    <Icons.AlertCircle size={12} />
                    <span>Total: {totalDuration.toFixed(1)}s / {TOTAL_DURATION}s</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Elements</label>
              <button
                onClick={() => openElementModal()}
                className="p-1 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
                title="Add element"
                type="button"
              >
                <Icons.Plus size={14} />
              </button>
            </div>
            {data.elements.length === 0 ? (
              <div className="text-[10px] text-zinc-500">No elements yet. Use @name in prompts.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.elements.map((el) => (
                  <div key={el.id} className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-zinc-200">@{el.name}</span>
                      <span className="text-[9px] text-zinc-500">
                        {el.videoDataUrl ? "Video" : `${el.imageDataUrls?.length || 0} images`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openElementModal(el)}
                        className="p-1 text-zinc-500 hover:text-blue-300"
                        title="Edit element"
                        type="button"
                      >
                        <Icons.Edit size={12} />
                      </button>
                      <button
                        onClick={() => removeElement(el.id)}
                        className="p-1 text-zinc-500 hover:text-red-400"
                        title="Remove element"
                        type="button"
                      >
                        <Icons.Trash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BaseNode>

      {isElementModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-[520px] max-w-[90vw] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-100">{editingElementId ? "Edit Element" : "Create Element"}</h3>
              <button onClick={closeElementModal} className="text-neutral-500 hover:text-neutral-200" type="button">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Name *</label>
                <input
                  value={elementName}
                  onChange={(e) => setElementName(e.target.value)}
                  placeholder="Enter element name"
                  className="w-full px-3 py-2 text-sm text-neutral-100 bg-neutral-800 border border-neutral-700 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Description *</label>
                <textarea
                  value={elementDescription}
                  onChange={(e) => setElementDescription(e.target.value)}
                  placeholder="Enter element description"
                  className="w-full px-3 py-2 text-sm text-neutral-100 bg-neutral-800 border border-neutral-700 rounded h-20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Media *</label>
                <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-600 rounded h-28 cursor-pointer text-neutral-500">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleElementFiles(e.target.files)}
                  />
                  <span className="text-xs">Click to upload images or video</span>
                  <span className="text-[10px]">Images: JPG/PNG, max 10MB each; Video: MP4/MOV, max 50MB</span>
                </label>
                <div className="mt-2 text-[10px] text-neutral-400">
                  {elementVideo ? "1 video selected" : `${elementImages.length} images selected`}
                </div>
              </div>
              {elementError && (
                <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                  {elementError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeElementModal}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 rounded"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={saveElement}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded"
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
