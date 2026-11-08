/**
 * Telemetry and cost calculation utilities for Gemini models
 */

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-3.8-flash': {
    inputPerMillion: 0.10,
    outputPerMillion: 0.40,
    cachedInputPerMillion: 0.025,
  },
  'gemini-3.1-flash-lite': {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    cachedInputPerMillion: 0.01875,
  },
  'gemini-4-argon': {
    inputPerMillion: 1.25,
    outputPerMillion: 5.00,
    cachedInputPerMillion: 0.3125,
  },
  'gemini-flash-latest': {
    inputPerMillion: 0.10,
    outputPerMillion: 0.40,
    cachedInputPerMillion: 0.025,
  },
};

export const DEFAULT_PRICING: ModelPricing = {
  inputPerMillion: 0.10,
  outputPerMillion: 0.40,
  cachedInputPerMillion: 0.025,
};

export const CONTEXT_CACHE_MIN_TOKENS = 32768;

/**
 * Approximates token count for text and multimodal content
 */
export function estimateTokens(
  text: string,
  media?: { images?: number; pdfs?: number; audioSeconds?: number }
): number {
  let count = 0;
  if (text) {
    // English words ~ 1.3 tokens/word or 1 token / ~3.8 chars
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      count += Math.ceil(trimmed.length / 3.8);
    }
  }

  if (media?.images) {
    count += media.images * 258; // Gemini standard vision tile
  }
  if (media?.pdfs) {
    count += media.pdfs * 258;
  }
  if (media?.audioSeconds) {
    count += Math.ceil(media.audioSeconds * 32);
  }

  return count;
}

/**
 * Calculates pricing for a request
 */
export function calculatePricing(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): {
  inputCost: number;
  outputCost: number;
  cachedCost: number;
  totalCost: number;
} {
  const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;
  const nonCachedInputs = Math.max(0, inputTokens - cachedTokens);

  const inputCost = (nonCachedInputs / 1_000_000) * pricing.inputPerMillion;
  const cachedCost = (cachedTokens / 1_000_000) * pricing.cachedInputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;

  const totalCost = inputCost + cachedCost + outputCost;

  return {
    inputCost,
    outputCost,
    cachedCost,
    totalCost,
  };
}

/**
 * Calculates latency, TTFT, and throughput metrics
 */
export function calculateSpeedAndLatency(
  firstTokenTimeMs: number | null,
  startTimeMs: number,
  endTimeMs: number,
  tokenCount: number
): {
  ttftMs: number;
  totalMs: number;
  tokensPerSecond: number;
} {
  const totalMs = Math.max(1, Math.round(endTimeMs - startTimeMs));
  const ttftMs = firstTokenTimeMs
    ? Math.max(1, Math.round(firstTokenTimeMs - startTimeMs))
    : totalMs;

  const seconds = totalMs / 1000;
  const tokensPerSecond =
    seconds > 0 ? Math.round((tokenCount / seconds) * 10) / 10 : 0;

  return {
    ttftMs,
    totalMs,
    tokensPerSecond,
  };
}

/**
 * Determines whether the prompt meets the Gemini Context Caching minimum threshold
 */
export function checkContextCachingThreshold(totalTokens: number): {
  eligible: boolean;
  threshold: number;
  remainingTokens: number;
  progressPercent: number;
  savingsPotentialPercent: number;
} {
  const eligible = totalTokens >= CONTEXT_CACHE_MIN_TOKENS;
  const remainingTokens = Math.max(0, CONTEXT_CACHE_MIN_TOKENS - totalTokens);
  const progressPercent = Math.min(
    100,
    Math.round((totalTokens / CONTEXT_CACHE_MIN_TOKENS) * 100)
  );

  return {
    eligible,
    threshold: CONTEXT_CACHE_MIN_TOKENS,
    remainingTokens,
    progressPercent,
    savingsPotentialPercent: 75,
  };
}
