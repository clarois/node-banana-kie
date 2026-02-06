import { ModelType, Resolution, NanoBananaNodeData, GenerateVideoNodeData, SplitGridNodeData, WorkflowNode, ProviderType } from "@/types";
import kiePricing from "@/data/kiePricing.json";

// Pricing in USD per image (Gemini API)
export const PRICING = {
  "nano-banana": {
    "1K": 0.039,
    "2K": 0.039, // nano-banana only supports 1K
    "4K": 0.039,
  },
  "nano-banana-pro": {
    "1K": 0.134,
    "2K": 0.134,
    "4K": 0.24,
  },
} as const;

export const IDR_PER_USD = 16000;
export const IDR_RATE_TTL_MS = 12 * 60 * 60 * 1000;
export const IDR_RATE_STORAGE_KEY = "node-banana-idr-rate";
export const IDR_RATE_API = "https://open.er-api.com/v6/latest/USD";

export function calculateGenerationCost(model: ModelType, resolution: Resolution): number {
  // nano-banana only supports 1K resolution
  if (model === "nano-banana") {
    return PRICING["nano-banana"]["1K"];
  }
  return PRICING["nano-banana-pro"][resolution];
}

export interface ModelPricing {
  unitCost: number;
  unit: string;
}

interface KiePricingEntry {
  price: number;
}

function inferKieUnit(modelId: string): string {
  const mid = modelId.toLowerCase();
  if (mid.includes("video") || mid.includes("sora") || mid.includes("luma") || mid.includes("runway") || mid.includes("kling") || mid.includes("veo")) {
    return "video";
  }
  if (mid.includes("chat") || mid.includes("reasoner") || mid.includes("token") || mid.includes("llm") || mid.includes("deepseek")) {
    return "token";
  }
  return "image";
}

const KIE_MODEL_PRICING = new Map<string, ModelPricing>(
  Object.entries(kiePricing as Record<string, KiePricingEntry>).map(
    ([modelId, entry]) => [
      modelId,
      {
        unitCost: entry.price,
        unit: inferKieUnit(modelId),
      },
    ]
  )
);

const KIE_MODEL_ALIASES: Record<string, string[]> = {
  "z-image": ["Market_z-image_1"],
  "seedream/4.5-text-to-image": [
    "Market_seedream_4.5-text-to-image_1",
    "Market_seedream_4.5-text-to-image_2",
    "Market_seedream_4.5-text-to-image_3",
    "Market_seedream_4.5-text-to-image_4",
  ],
  "seedream/4.5-edit": [
    "Market_seedream_4.5-edit_1",
    "Market_seedream_4.5-edit_2",
    "Market_seedream_4.5-edit_3",
    "Market_seedream_4.5-edit_4",
  ],
  "gpt-image/1.5-text-to-image": [
    "Market_gpt-image_1.5-text-to-image_medium",
    "Market_gpt-image_1.5-text-to-image_high",
  ],
  "gpt-image/1.5-image-to-image": [
    "Market_gpt-image_1.5-image-to-image_medium",
    "Market_gpt-image_1.5-image-to-image_high",
  ],
  "flux-2/pro-text-to-image": [
    "Market_flux-2_pro-text-to-image_1k",
    "Market_flux-2_pro-text-to-image_2k",
  ],
  "flux-2/pro-image-to-image": [
    "Market_flux-2_pro-image-to-image_1k",
    "Market_flux-2_pro-image-to-image_2k",
  ],
  "flux-2/flex-text-to-image": [
    "Market_flux-2_flex-text-to-image_1k",
    "Market_flux-2_flex-text-to-image_2k",
  ],
  "flux-2/flex-image-to-image": [
    "Market_flux-2_flex-image-to-image_1k",
    "Market_flux-2_flex-image-to-image_2k",
  ],
  "nano-banana-pro": ["Market_nano-banana-pro_1k_2k", "Market_nano-banana-pro_4k"],
  "grok-imagine/text-to-image": ["Market_grok-imagine_text-to-image"],
  "grok-imagine/image-to-image": ["Market_grok-imagine_image-to-image"],
  "grok-imagine/text-to-video": [
    "Market_grok-imagine_text-to-video_10",
    "Market_grok-imagine_text-to-video_6",
  ],
  "grok-imagine/image-to-video": [
    "Market_grok-imagine_image-to-video_10",
    "Market_grok-imagine_image-to-video_6",
  ],
  "kling-2.6/text-to-video": [
    "Market_kling-2.6_text-to-video_false_10",
    "Market_kling-2.6_text-to-video_true_10",
    "Market_kling-2.6_text-to-video_false_5",
    "Market_kling-2.6_text-to-video_true_5",
  ],
  "kling-2.6/image-to-video": [
    "Market_kling-2.6_image-to-video_false_10",
    "Market_kling-2.6_image-to-video_true_10",
    "Market_kling-2.6_image-to-video_false_5",
    "Market_kling-2.6_image-to-video_true_5",
  ],
  "kling-2.6/motion-control": [
    "Market_kling-2.6_motion-control_1080p",
    "Market_kling-2.6_motion-control_720p",
  ],
  "kling/v2-5-turbo-text-to-video-pro": [
    "Market_kling_v2-5-turbo-text-to-video-pro_10",
    "Market_kling_v2-5-turbo-text-to-video-pro_5",
  ],
  "kling/v2-5-turbo-image-to-video-pro": [
    "Market_kling_v2-5-turbo-image-to-video-pro_10",
    "Market_kling_v2-5-turbo-image-to-video-pro_5",
  ],
  "wan/2-6-text-to-video": [
    "Market_wan_2-6-text-to-video_1080p_10",
    "Market_wan_2-6-text-to-video_720p_10",
    "Market_wan_2-6-text-to-video_1080p_5",
  ],
  "wan/2-6-image-to-video": [
    "Market_wan_2-6-image-to-video_1080p_10",
    "Market_wan_2-6-image-to-video_720p_10",
    "Market_wan_2-6-image-to-video_1080p_5",
  ],
  "wan/2-6-video-to-video": [
    "Market_wan_2-6-video-to-video_1080p_10",
    "Market_wan_2-6-video-to-video_720p_10",
    "Market_wan_2-6-video-to-video_1080p_5",
  ],
  "topaz/video-upscale": [
    "Market_topaz_video-upscale_2",
    "Market_topaz_video-upscale_4",
  ],
  "veo3/text-to-video": ["veo-video-generate", "veo-video-generate_9:16"],
  "veo3/image-to-video": ["veo-video-generate", "veo-video-generate_9:16"],
  "veo3-fast/text-to-video": ["veo-video-fast-generate", "veo-video-fast-generate_9:16"],
  "veo3-fast/image-to-video": ["veo-video-fast-generate", "veo-video-fast-generate_9:16"],
  "veo3-fast/reference-to-video": ["veo-video-fast-generate", "veo-video-fast-generate_9:16"],
  "veo3/extend-video": ["veo-video-extend"],
  "veo3/get-1080p-video": ["veo-get-1080p-video"],
  "veo3/get-4k-video": ["veo-get-4k-video"],
  "sora-2-pro-storyboard": [
    "Market_SORA2-PRO-STORYBOARD_standard_15",
    "Market_SORA2-PRO-STORYBOARD_standard_10",
    "Market_SORA2-PRO-STORYBOARD_standard_25",
  ],
};

function getKiePricing(modelId: string): ModelPricing | null {
  const direct = KIE_MODEL_PRICING.get(modelId);
  if (direct) return direct;

  const aliases = KIE_MODEL_ALIASES[modelId];
  if (!aliases) return null;

  for (const alias of aliases) {
    const pricing = KIE_MODEL_PRICING.get(alias);
    if (pricing) return pricing;
  }

  return null;
}

export function getModelCost(pricing: { type: 'per-run' | 'per-second'; amount: number } | null | undefined): ModelPricing | null {
  if (!pricing) return null;
  return {
    unitCost: pricing.amount,
    unit: pricing.type === 'per-run' ? 'image' : 'second',
  };
}

/**
 * Cost breakdown item supporting multiple providers
 */
export interface CostBreakdownItem {
  provider: ProviderType;
  modelId: string;
  modelName: string;
  count: number;
  unitCost: number | null;  // null means pricing unavailable
  unit: string;  // "image", "video", "second", etc.
  subtotal: number | null;  // null if unitCost is null
}

/**
 * Result of predicted cost calculation
 */
export interface PredictedCostResult {
  totalCost: number;  // Only includes known pricing
  breakdown: CostBreakdownItem[];
  nodeCount: number;
  unknownPricingCount: number;  // Count of items without pricing
}

/**
 * Calculate predicted cost for all generation nodes in the workflow.
 */
export function calculatePredictedCost(
  nodes: WorkflowNode[],
  modelPricing?: Map<string, ModelPricing>
): PredictedCostResult {
  const breakdown: Map<string, CostBreakdownItem> = new Map();
  let nodeCount = 0;
  let unknownPricingCount = 0;

  function addToBreakdown(
    provider: ProviderType,
    modelId: string,
    modelName: string,
    unit: string,
    unitCost: number | null,
    count: number = 1
  ) {
    const key = `${provider}:${modelId}`;
    const existing = breakdown.get(key);
    if (existing) {
      existing.count += count;
      if (existing.subtotal !== null && unitCost !== null) {
        existing.subtotal += count * unitCost;
      }
    } else {
      breakdown.set(key, {
        provider,
        modelId,
        modelName,
        count,
        unitCost,
        unit,
        subtotal: unitCost !== null ? count * unitCost : null,
      });
    }
    nodeCount += count;
    if (unitCost === null) {
      unknownPricingCount += count;
    }
  }

  function getPricing(
    provider: ProviderType,
    modelId: string,
    resolution?: Resolution
  ): { unitCost: number; unit: string } | null {
    if (modelPricing?.has(modelId)) {
      return modelPricing.get(modelId)!;
    }

    if (provider === "gemini") {
      if (modelId === "nano-banana" || modelId === "gemini-2.5-flash-preview-image-generation") {
        return { unitCost: PRICING["nano-banana"]["1K"], unit: "image" };
      }
      if (modelId === "nano-banana-pro" || modelId === "gemini-3-pro-image-preview") {
        const res = resolution || "1K";
        return { unitCost: PRICING["nano-banana-pro"][res], unit: "image" };
      }
    }

    if (provider === "kie") {
      const pricing = getKiePricing(modelId);
      if (pricing) return pricing;
    }

    return null;
  }

  nodes.forEach((node) => {
    try {
      const data = (node.data || {}) as any;

      if (node.type === "nanoBanana") {
        let provider: ProviderType;
        let modelId: string;
        let modelName: string;

        if (data.selectedModel) {
          provider = data.selectedModel.provider;
          modelId = data.selectedModel.modelId;
          modelName = data.selectedModel.displayName;
        } else {
          provider = "gemini";
          modelId = data.model || "nano-banana";
          modelName = modelId === "nano-banana" ? "Nano Banana" : "Nano Banana Pro";
        }

        const resolution = (modelId === "nano-banana" ? "1K" : data.resolution) || "1K";
        const pricing = getPricing(provider, modelId, resolution as Resolution);
        addToBreakdown(provider, modelId, modelName, pricing?.unit ?? "image", pricing?.unitCost ?? null);
      }

      if (node.type === "generateVideo") {
        let provider: ProviderType = "kie";
        let modelId = "";
        let modelName = "";

        if (data.selectedModel) {
          provider = data.selectedModel.provider;
          modelId = data.selectedModel.modelId;
          modelName = data.selectedModel.displayName;
        } else {
          modelId = data.model || "";
          modelName = modelId || "Video Generation";
        }

        const pricing = getPricing(provider, modelId);
        addToBreakdown(provider, modelId, modelName, pricing?.unit ?? "video", pricing?.unitCost ?? null);
      }

      if (node.type === "llmGenerate") {
        let provider: ProviderType = "kie";
        let modelId = "";
        let modelName = "";

        if (data.selectedModel) {
          provider = data.selectedModel.provider;
          modelId = data.selectedModel.modelId;
          modelName = data.selectedModel.displayName;
        } else {
          modelId = data.model || "deepseek-chat";
          modelName = modelId;
        }

        const pricing = getPricing(provider, modelId);
        addToBreakdown(provider, modelId, modelName, pricing?.unit ?? "token", pricing?.unitCost ?? null);
      }

      if (node.type === "soraStoryboard") {
        const provider = "kie";
        const modelId = "sora-2-pro-storyboard";
        const modelName = "Sora 2 Pro Storyboard";

        const durationSuffix = data.nFrames ? `_${data.nFrames}` : "_15";
        const specificId = `Market_SORA2-PRO-STORYBOARD_standard${durationSuffix}`;
        let pricing: ModelPricing | null = KIE_MODEL_PRICING.get(specificId) || null;

        if (!pricing) {
          pricing = getPricing(provider, modelId);
        }

        addToBreakdown(provider, modelId, modelName, pricing?.unit ?? "video", pricing?.unitCost ?? null);
      }

      if (node.type === "veoReferenceVideo") {
        const pricing = getPricing("kie", "veo3-fast/reference-to-video");
        addToBreakdown("kie", "veo3-fast/reference-to-video", "Veo 3 Reference", pricing?.unit ?? "video", pricing?.unitCost ?? null);
      }
      if (node.type === "veoExtendVideo") {
        const pricing = getPricing("kie", "veo3/extend-video");
        addToBreakdown("kie", "veo3/extend-video", "Veo 3 Extend", pricing?.unit ?? "video", pricing?.unitCost ?? null);
      }
      if (node.type === "veo1080pVideo") {
        const pricing = getPricing("kie", "veo3/get-1080p-video");
        addToBreakdown("kie", "veo3/get-1080p-video", "Veo 3 1080p", pricing?.unit ?? "video", pricing?.unitCost ?? null);
      }
      if (node.type === "veo4kVideo") {
        const pricing = getPricing("kie", "veo3/get-4k-video");
        addToBreakdown("kie", "veo3/get-4k-video", "Veo 3 4K", pricing?.unit ?? "video", pricing?.unitCost ?? null);
      }

      if (node.type === "splitGrid") {
        if (data.isConfigured && data.targetCount > 0 && data.generateSettings) {
          const model = data.generateSettings.model;
          const resolution = (model === "nano-banana" ? "1K" : data.generateSettings.resolution) || "1K";
          const modelName = model === "nano-banana" ? "Nano Banana" : "Nano Banana Pro";

          const pricing = getPricing("gemini", model, resolution as Resolution);
          addToBreakdown("gemini", model, modelName, pricing?.unit ?? "image", pricing?.unitCost ?? null, data.targetCount);
        }
      }
    } catch (err) {
      console.error("Error calculating cost for node:", node.id, err);
    }
  });

  const breakdownArray = Array.from(breakdown.values());
  const totalCost = breakdownArray.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);

  return {
    totalCost,
    breakdown: breakdownArray,
    nodeCount,
    unknownPricingCount,
  };
}

export function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
}

export function formatCostIdr(cost: number, rate: number = IDR_PER_USD): string {
  const value = cost * rate;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCachedIdrRate(): { rate: number; updatedAt: number } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(IDR_RATE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { rate?: number; updatedAt?: number };
    if (!parsed.rate || !parsed.updatedAt) return null;
    return { rate: parsed.rate, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export function setCachedIdrRate(rate: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IDR_RATE_STORAGE_KEY, JSON.stringify({ rate, updatedAt: Date.now() }));
}

export async function fetchIdrRate(): Promise<number | null> {
  try {
    const response = await fetch(IDR_RATE_API);
    if (!response.ok) return null;
    const data = await response.json();
    const rate = data?.rates?.IDR;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}
