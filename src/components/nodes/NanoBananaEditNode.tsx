'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useCommentNavigation } from '@/hooks/useCommentNavigation';
import { useWorkflowStore, useProviderApiKeys } from '@/store/workflowStore';
import { NanoBananaEditNodeData } from '@/types';
import { AspectRatio } from '@/types/models';
import { useToast } from '@/components/Toast';

// All 10 aspect ratios supported by Nano Banana Edit
const ASPECT_RATIOS: AspectRatio[] = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

const OUTPUT_FORMATS = ['png', 'jpeg'];

type NanoBananaEditNodeType = Node<NanoBananaEditNodeData, 'nanoBananaEdit'>;

export function NanoBananaEditNode({ id, data, selected }: NodeProps<NanoBananaEditNodeType>) {
  const nodeData = data;
  const commentNavigation = useCommentNavigation(id);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const generationsPath = useWorkflowStore((state) => state.generationsPath);
  const { kieApiKey } = useProviderApiKeys();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  // Load defaults on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('node-banana-nanoBananaEdit-defaults') : null;
    if (stored) {
      try {
        const defaults = JSON.parse(stored);
        if (defaults && !nodeData.aspectRatio) {
          updateNodeData(id, {
            ...nodeData,
            aspectRatio: defaults.aspectRatio || '1:1',
            outputFormat: defaults.outputFormat || 'png',
          });
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Save defaults when they change
  useEffect(() => {
    if (nodeData.aspectRatio || nodeData.outputFormat) {
      localStorage.setItem(
        'node-banana-nanoBananaEdit-defaults',
        JSON.stringify({
          aspectRatio: nodeData.aspectRatio,
          outputFormat: nodeData.outputFormat,
        })
      );
    }
  }, [nodeData.aspectRatio, nodeData.outputFormat]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, {
      ...nodeData,
      inputPrompt: e.target.value,
    });
  }, [id, nodeData, updateNodeData]);

  const handleAspectRatioChange = useCallback((ratio: AspectRatio) => {
    updateNodeData(id, {
      ...nodeData,
      aspectRatio: ratio,
    });
  }, [id, nodeData, updateNodeData]);

  const handleOutputFormatChange = useCallback((format: string) => {
    updateNodeData(id, {
      ...nodeData,
      outputFormat: format,
    });
  }, [id, nodeData, updateNodeData]);

  const handleExecute = useCallback(async () => {
    if (!nodeData.inputPrompt?.trim()) {
      setError('Please enter editing instructions');
      return;
    }
    if (!nodeData.inputImages?.length) {
      setError('Please connect at least one input image');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(kieApiKey && { 'X-Kie-Key': kieApiKey }),
        },
        body: JSON.stringify({
          provider: 'kie',
          model: 'google/nano-banana-edit',
          prompt: nodeData.inputPrompt,
          imageUrls: nodeData.inputImages,
          aspectRatio: nodeData.aspectRatio || '1:1',
          outputFormat: nodeData.outputFormat || 'png',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.imageUrl) {
        // Add to history
        const newHistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          prompt: nodeData.inputPrompt,
          aspectRatio: nodeData.aspectRatio || '1:1',
          model: 'google/nano-banana-edit',
        };

        updateNodeData(id, {
          ...nodeData,
          outputImage: result.imageId || result.imageUrl,
          imageHistory: [...(nodeData.imageHistory || []), newHistoryItem],
          selectedHistoryIndex: (nodeData.imageHistory?.length || 0),
          status: 'complete',
          error: null,
        });
        
        setIsLoading(false);
      } else if (result.taskId) {
        // Poll for result
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/generate/status?taskId=${result.taskId}&provider=kie`, {
              headers: kieApiKey ? { 'X-Kie-Key': kieApiKey } : {},
            });
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              
              if (statusData.status === 'completed' && statusData.imageUrl) {
                clearInterval(pollInterval);
                
                const newHistoryItem = {
                  id: Date.now().toString(),
                  timestamp: Date.now(),
                  prompt: nodeData.inputPrompt,
                  aspectRatio: nodeData.aspectRatio || '1:1',
                  model: 'google/nano-banana-edit',
                };

                updateNodeData(id, {
                  ...nodeData,
                  outputImage: statusData.imageId || statusData.imageUrl,
                  imageHistory: [...(nodeData.imageHistory || []), newHistoryItem],
                  selectedHistoryIndex: (nodeData.imageHistory?.length || 0),
                  status: 'complete',
                  error: null,
                });
                
                setIsLoading(false);
              } else if (statusData.status === 'failed') {
                clearInterval(pollInterval);
                setError(statusData.error || 'Image editing failed');
                setIsLoading(false);
              }
            }
          } catch (err) {
            clearInterval(pollInterval);
            setError(err instanceof Error ? err.message : 'Failed to check status');
            setIsLoading(false);
          }
        }, 2000);

        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsLoading(false);
        }, 300000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image');
      setIsLoading(false);
    }
  }, [id, nodeData, kieApiKey, updateNodeData]);

  const handleHistorySelect = useCallback((index: number) => {
    if (!nodeData.imageHistory?.length) return;
    const item = nodeData.imageHistory[index];
    updateNodeData(id, {
      ...nodeData,
      selectedHistoryIndex: index,
      outputImage: item.id,
    });
  }, [id, nodeData, updateNodeData]);

  const handlePrevHistory = useCallback(() => {
    if (!nodeData.imageHistory?.length || nodeData.selectedHistoryIndex === undefined) return;
    const newIndex = nodeData.selectedHistoryIndex > 0 ? nodeData.selectedHistoryIndex - 1 : nodeData.imageHistory.length - 1;
    handleHistorySelect(newIndex);
  }, [nodeData, handleHistorySelect]);

  const handleNextHistory = useCallback(() => {
    if (!nodeData.imageHistory?.length || nodeData.selectedHistoryIndex === undefined) return;
    const newIndex = nodeData.selectedHistoryIndex < nodeData.imageHistory.length - 1 ? nodeData.selectedHistoryIndex + 1 : 0;
    handleHistorySelect(newIndex);
  }, [nodeData, handleHistorySelect]);

  const currentImageId = nodeData.outputImage;
  const hasHistory = (nodeData.imageHistory?.length || 0) > 0;
  const historyIndex = nodeData.selectedHistoryIndex ?? (hasHistory ? nodeData.imageHistory!.length - 1 : -1);

  return (
    <div ref={nodeRef}>
      <BaseNode
        id={id}
        title="Nano Banana Edit"
        customTitle={nodeData.customTitle}
        comment={nodeData.comment}
        onCustomTitleChange={(title) => updateNodeData(id, { ...nodeData, customTitle: title })}
        onCommentChange={(comment) => updateNodeData(id, { ...nodeData, comment })}
        onRun={handleExecute}
        selected={selected}
        isExecuting={isLoading}
        hasError={!!error || !!nodeData.error}
        commentNavigation={commentNavigation || undefined}
        headerButtons={
          <>
            {isLoading && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-neutral-500">Processing...</span>
              </div>
            )}
          </>
        }
      >
        <Handle
          type="target"
          position={Position.Left}
          id="image"
          className="!w-3 !h-3 !bg-pink-500"
          style={{ top: '50%' }}
        />

        <Handle
          type="source"
          position={Position.Right}
          id="image"
          className="!w-3 !h-3 !bg-pink-500"
          style={{ top: '50%' }}
        />

        <div className="space-y-3 p-2">
          {/* Input Images Preview */}
          {nodeData.inputImages && nodeData.inputImages.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Input Images ({nodeData.inputImages.length})</label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {nodeData.inputImages.map((img, idx) => (
                  <div key={idx} className="w-10 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0">
                    <img src={img} alt={`Input ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Edit Instructions</label>
            <textarea
              value={nodeData.inputPrompt || ''}
              onChange={handlePromptChange}
              placeholder="Describe what changes to make..."
              className="w-full h-16 p-2 text-xs bg-neutral-900 border border-neutral-700 rounded resize-none focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Aspect Ratio</label>
              <select
                value={nodeData.aspectRatio || '1:1'}
                onChange={(e) => handleAspectRatioChange(e.target.value as AspectRatio)}
                className="w-full p-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded focus:border-blue-500 focus:outline-none"
              >
                {ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Format</label>
              <select
                value={nodeData.outputFormat || 'png'}
                onChange={(e) => handleOutputFormatChange(e.target.value)}
                className="w-full p-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded focus:border-blue-500 focus:outline-none"
              >
                {OUTPUT_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Display */}
          {(error || nodeData.error) && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
              {error || nodeData.error}
            </div>
          )}

          {/* Output Preview */}
          {currentImageId && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-neutral-500">Result</label>
                {hasHistory && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevHistory}
                      className="p-1 text-neutral-400 hover:text-neutral-200"
                    >
                      ←
                    </button>
                    <span className="text-xs text-neutral-500">
                      {historyIndex + 1}/{nodeData.imageHistory!.length}
                    </span>
                    <button
                      onClick={handleNextHistory}
                      className="p-1 text-neutral-400 hover:text-neutral-200"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
              <div className="relative aspect-video bg-neutral-900 rounded overflow-hidden">
                <img
                  src={`${generationsPath}/${currentImageId}.png`}
                  alt="Edited"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </BaseNode>
    </div>
  );
}
