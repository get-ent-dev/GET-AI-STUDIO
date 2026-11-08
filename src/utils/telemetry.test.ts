import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateTokens,
  calculatePricing,
  calculateSpeedAndLatency,
  checkContextCachingThreshold,
  CONTEXT_CACHE_MIN_TOKENS,
} from './telemetry';

test('estimateTokens calculates text tokens correctly', () => {
  assert.equal(estimateTokens(''), 0);
  const text = 'Hello world! This is a test prompt.';
  const tokens = estimateTokens(text);
  assert.ok(tokens > 0 && tokens < 20);
});

test('estimateTokens incorporates multimodal images and PDFs', () => {
  const tokens = estimateTokens('Analysis prompt', { images: 2, pdfs: 1 });
  // 2 images * 258 = 516, 1 pdf * 258 = 258, plus text tokens
  assert.ok(tokens >= 774);
});

test('calculatePricing computes correct input, output, and cache pricing', () => {
  // 1,000,000 input tokens on gemini-3.8-flash ($0.10)
  // 1,000,000 output tokens on gemini-3.8-flash ($0.40)
  const result = calculatePricing('gemini-3.8-flash', 1_000_000, 1_000_000, 0);
  assert.equal(result.inputCost, 0.10);
  assert.equal(result.outputCost, 0.40);
  assert.equal(result.totalCost, 0.50);

  // Cached input test: 500,000 cached + 500,000 uncached
  const cachedResult = calculatePricing('gemini-3.8-flash', 1_000_000, 0, 500_000);
  assert.equal(cachedResult.cachedCost, 0.0125);
  assert.equal(cachedResult.inputCost, 0.05);
  assert.equal(cachedResult.totalCost, 0.0625);
});

test('calculateSpeedAndLatency outputs TTFT and TPS', () => {
  const result = calculateSpeedAndLatency(1200, 1000, 3000, 100);
  assert.equal(result.ttftMs, 200);
  assert.equal(result.totalMs, 2000);
  assert.equal(result.tokensPerSecond, 50); // 100 tokens / 2s = 50 TPS
});

test('checkContextCachingThreshold identifies eligibility', () => {
  const below = checkContextCachingThreshold(10_000);
  assert.equal(below.eligible, false);
  assert.equal(below.remainingTokens, CONTEXT_CACHE_MIN_TOKENS - 10_000);

  const above = checkContextCachingThreshold(35_000);
  assert.equal(above.eligible, true);
  assert.equal(above.remainingTokens, 0);
  assert.equal(above.progressPercent, 100);
});
