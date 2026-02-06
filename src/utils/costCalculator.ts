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

/**
 * Pricing info for external provider models
 */
export interface ModelPricing {
  unitCost: number;
  unit: string;  // "image", "video", "second", etc.
}

type KiePricingEntry = {
  credits: number;
  price: number;
};

function inferKieUnit(modelId: string): string {
  const id = modelId.toLowerCase();
  if (id.includes("token_base_score")) return "token";
  if (id.includes("audio") || id.includes("sound")) return "audio";
  if (id.includes("video") || id.includes("t2v") || id.includes("i2v") || id.includes("v2v")) {
    return "video";
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

/**
 * Get cost info from ProviderModel pricing field
 * Returns null if pricing is unavailable (e.g., Replicate has no pricing API)
 */
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
 * Legacy cost breakdown item for backward compatibility
 * @deprecated Use CostBreakdownItem instead
 */
export interface LegacyCostBreakdownItem {
  model: ModelType;
  resolution: Resolution;
  count: number;
  unitCost: number;
  subtotal: number;
}

/**
 * Calculate predicted cost for all generation nodes in the workflow.
 * Handles nanoBanana (image) and generateVideo (video) nodes.
 *
 * @param nodes - Workflow nodes to analyze
 * @param modelPricing - Optional map of modelId -> pricing for external providers.
 *                       If not provided, only Gemini models get pricing.
 * @returns PredictedCostResult with total cost, breakdown, and counts
 */
export function calculatePredictedCost(
  nodes: WorkflowNode[],
  modelPricing?: Map<string, ModelPricing>
): PredictedCostResult {
  // Group by provider + modelId for breakdown
  const breakdown: Map<string, CostBreakdownItem> = new Map();
  let nodeCount = 0;
  let unknownPricingCount = 0;

  /**
   * Helper to add an item to the breakdown map
   */
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

  /**
   * Get pricing for a model.
   * First checks modelPricing map, then falls back to hardcoded Gemini pricing.
   */
  function getPricing(
    provider: ProviderType,
    modelId: string,
    resolution?: Resolution
  ): { unitCost: number; unit: string } | null {
    // Check external pricing map first
    if (modelPricing?.has(modelId)) {
      return modelPricing.get(modelId)!;
    }

    // Fallback to hardcoded Gemini pricing for legacy models
    if (provider === "gemini") {
      if (modelId === "nano-banana" || modelId === "gemini-2.5-flash-preview-image-generation") {
        return { unitCost: PRICING["nano-banana"]["1K"], unit: "image" };
      }
      if (modelId === "nano-banana-pro" || modelId === "gemini-3-pro-image-preview") {
        const res = resolution || "1K";
        return { unitCost: PRICING["nano-banana-pro"][res], unit: "image" };
      }
    }

    // Kie.ai pricing (static map from pricing_data.md)
    if (provider === "kie") {
      const pricing = getKiePricing(modelId);
      if (pricing) {
        return pricing;
      }
    }

    // No pricing available (e.g., Replicate)
    return null;
  }

  nodes.forEach((node) => {
    // Handle nanoBanana (image generation) nodes
    if (node.type === "nanoBanana") {
      const data = node.data as NanoBananaNodeData;

      // Determine provider and model info
      let provider: ProviderType;
      let modelId: string;
      let modelName: string;

      if (data.selectedModel) {
        // New multi-provider model selection
        provider = data.selectedModel.provider;
        modelId = data.selectedModel.modelId;
        modelName = data.selectedModel.displayName;
      } else {
        // Legacy Gemini-only model
        provider = "gemini";
        modelId = data.model;
        modelName = data.model === "nano-banana" ? "Nano Banana" : "Nano Banana Pro";
      }

      const resolution = data.model === "nano-banana" ? "1K" : data.resolution;
      const pricing = getPricing(provider, modelId, resolution);
      const unitCost = pricing?.unitCost ?? null;
      const unit = pricing?.unit ?? "image";

      addToBreakdown(provider, modelId, modelName, unit, unitCost);
    }

    // Handle generateVideo nodes
    if (node.type === "generateVideo") {
      const data = node.data as GenerateVideoNodeData;

      // generateVideo requires selectedModel (no legacy fallback)
      if (data.selectedModel) {
        const provider = data.selectedModel.provider;
        const modelId = data.selectedModel.modelId;
        const modelName = data.selectedModel.displayName;

        const pricing = getPricing(provider, modelId);
        const unitCost = pricing?.unitCost ?? null;
        const unit = pricing?.unit ?? "video";

        addToBreakdown(provider, modelId, modelName, unit, unitCost);
      }
    }

    // SplitGrid nodes create child nanoBanana nodes - count those from settings
    // Note: child nodes are in the nodes array, but we count from splitGrid settings
    // to show what WILL be generated when the grid runs
    if (node.type === "splitGrid") {
      const data = node.data as SplitGridNodeData;
      if (data.isConfigured && data.targetCount > 0) {
        const model = data.generateSettings.model;
        const resolution = model === "nano-banana" ? "1K" : data.generateSettings.resolution;
        const modelName = model === "nano-banana" ? "Nano Banana" : "Nano Banana Pro";

        const pricing = getPricing("gemini", model, resolution);
        const unitCost = pricing?.unitCost ?? null;
        const unit = pricing?.unit ?? "image";

        addToBreakdown("gemini", model, modelName, unit, unitCost, data.targetCount);
      }
    }
  });

  const breakdownArray = Array.from(breakdown.values());
  const totalCost = breakdownArray.reduce(
    (sum, item) => sum + (item.subtotal ?? 0),
    0
  );

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
  localStorage.setItem(
    IDR_RATE_STORAGE_KEY,
    JSON.stringify({ rate, updatedAt: Date.now() })
  );
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
