import React from 'react';
import { Database, X, CheckCircle2, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { checkContextCachingThreshold, MODEL_PRICING } from '../utils/telemetry';

export const CachingModal: React.FC = () => {
  const { isCachingModalOpen, setIsCachingModalOpen, messages, config } = useStudioStore();

  if (!isCachingModalOpen) return null;

  const totalTokens = messages.reduce(
    (acc, m) => acc + (m.telemetry?.tokenCount || 0) + (m.telemetry?.inputTokens || 0),
    0
  );

  const status = checkContextCachingThreshold(totalTokens);
  const pricing = MODEL_PRICING[config.model] || MODEL_PRICING['gemini-3.8-flash'];

  const standardCost1M = pricing.inputPerMillion;
  const cachedCost1M = pricing.cachedInputPerMillion;
  const savingsPct = Math.round((1 - cachedCost1M / standardCost1M) * 100);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">
              Context Caching Inspector & Telemetry
            </h3>
          </div>
          <button
            onClick={() => setIsCachingModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-zinc-300">
          {/* Progress Card */}
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-100">Threshold Progress</span>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                  status.eligible
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {status.eligible ? 'Cache Active' : 'Below Threshold'}
              </span>
            </div>

            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  status.eligible ? 'bg-emerald-400' : 'bg-blue-500'
                }`}
                style={{ width: `${status.progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between font-mono text-zinc-400 text-[11px]">
              <span>Current: <strong className="text-zinc-100">{totalTokens.toLocaleString()}</strong> tokens</span>
              <span>Minimum: <strong>32,768</strong> tokens</span>
            </div>

            {!status.eligible && (
              <p className="text-[11px] text-zinc-500">
                You need <strong>{status.remainingTokens.toLocaleString()}</strong> more tokens in your prompt or chat history to activate Gemini Context Caching.
              </p>
            )}
          </div>

          {/* Pricing Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase font-bold">Standard Input Rate</div>
              <div className="text-lg font-mono font-bold text-zinc-200">
                ${standardCost1M.toFixed(3)}
              </div>
              <div className="text-[10px] text-zinc-500">per 1M input tokens</div>
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg space-y-1">
              <div className="text-emerald-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Cached Input Rate ({savingsPct}% Off)
              </div>
              <div className="text-lg font-mono font-bold text-emerald-300">
                ${cachedCost1M.toFixed(4)}
              </div>
              <div className="text-[10px] text-emerald-500">per 1M cached tokens</div>
            </div>
          </div>

          {/* How Caching Works */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Why Use Context Caching?
            </span>
            <ul className="space-y-1.5 text-zinc-400 text-[11px]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Drastically reduces latency on repetitive multi-turn dialogues, system prompts, or massive PDFs/codebases.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Saves up to 75% on recurring input token bills.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>Automatic cache expiration (TTL) ensures you only pay for storage when actively prototyping.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => setIsCachingModalOpen(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
