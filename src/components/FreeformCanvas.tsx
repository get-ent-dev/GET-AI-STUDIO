import React, { useRef, useMemo } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Clock,
  Zap,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  Brackets,
  BookOpen,
} from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { extractPromptVariables, interpolatePrompt } from '../utils/promptTemplate';
import { estimateTokens, calculatePricing, calculateSpeedAndLatency } from '../utils/telemetry';

export const FreeformCanvas: React.FC = () => {
  const {
    config,
    freeformPrompt,
    setFreeformPrompt,
    freeformVariables,
    setFreeformVariable,
    freeformOutput,
    setFreeformOutput,
    isGeneratingFreeform,
    setIsGeneratingFreeform,
    freeformTelemetry,
    setFreeformTelemetry,
    setIsPromptGalleryOpen,
  } = useStudioStore();

  const [copied, setCopied] = React.useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract variables automatically from prompt
  const detectedVariables = useMemo(() => {
    return extractPromptVariables(freeformPrompt);
  }, [freeformPrompt]);

  // Interpolated prompt that will be sent to the model
  const interpolatedPrompt = useMemo(() => {
    return interpolatePrompt(freeformPrompt, freeformVariables);
  }, [freeformPrompt, freeformVariables]);

  const estimatedInputTokens = estimateTokens(interpolatedPrompt);

  const handleInsertVariable = (varName: string) => {
    const toInsert = `{{${varName}}}`;
    setFreeformPrompt(freeformPrompt + ' ' + toInsert);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGeneratingFreeform(false);
  };

  const handleRun = async () => {
    if (!interpolatedPrompt.trim() || isGeneratingFreeform) return;

    setIsGeneratingFreeform(true);
    setFreeformOutput('');
    setFreeformTelemetry(undefined);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let accumulated = '';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages: [
            {
              role: 'user',
              parts: [{ text: interpolatedPrompt }],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value);
        const lines = raw.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                accumulated += `\n[Error: ${parsed.error}]`;
                setFreeformOutput(accumulated);
                break;
              }
              if (!firstTokenTime && parsed.text) {
                firstTokenTime = performance.now();
              }
              if (parsed.text) {
                accumulated += parsed.text;
                setFreeformOutput(accumulated);
              }
            } catch {
              // ignore partial chunk
            }
          }
        }
      }

      const endTime = performance.now();
      const tokenCount = Math.ceil(accumulated.length / 3.8);
      const metrics = calculateSpeedAndLatency(firstTokenTime, startTime, endTime, tokenCount);
      const pricing = calculatePricing(config.model, estimatedInputTokens, tokenCount);

      setFreeformTelemetry({
        ttftMs: metrics.ttftMs,
        totalMs: metrics.totalMs,
        tokensPerSecond: metrics.tokensPerSecond,
        tokenCount,
        inputTokens: estimatedInputTokens,
        cost: pricing.totalCost,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setFreeformOutput(accumulated ? `${accumulated}\n\n[Error: ${err.message}]` : `Error: ${err.message}`);
      }
    } finally {
      setIsGeneratingFreeform(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(freeformOutput || interpolatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden select-none">
      {/* Header Bar */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Brackets className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                Prompt Section — Freeform Canvas
              </h2>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                Templating Engine
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Draft prompts with dynamic parameters using <code className="text-emerald-400 font-mono font-bold">{'{{variable_name}}'}</code> syntax.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPromptGalleryOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Browse Prompt Gallery</span>
          </button>

          <button
            onClick={() => {
              setFreeformOutput('');
              setFreeformTelemetry(undefined);
            }}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md transition"
            title="Reset Output"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {isGeneratingFreeform ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition shadow-sm animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!interpolatedPrompt.trim()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Prompt (⌘+Enter)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Grid: Prompt Editor & Output Canvas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 overflow-hidden min-h-0">
        {/* Left Side: Prompt Editor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-zinc-950/40">
          <div className="p-2.5 border-b border-zinc-800 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Prompt Template
              </span>
              <div className="hidden sm:flex items-center gap-1">
                {(['topic', 'audience', 'language', 'constraints', 'format'] as const).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleInsertVariable(tag)}
                    className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-zinc-800 transition cursor-pointer"
                    title={`Insert {{${tag}}} variable`}
                  >
                    +{'{{' + tag + '}}'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-500">
                ~{estimatedInputTokens} input tokens
              </span>
              <button
                onClick={() => handleInsertVariable('variable')}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded hover:bg-zinc-800 transition cursor-pointer"
              >
                + Custom {'{{var}}'}
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            <textarea
              value={freeformPrompt}
              onChange={(e) => setFreeformPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleRun();
                }
              }}
              placeholder="Write your freeform prompt here. Use {{variable_name}} to declare dynamic inputs..."
              className="w-full h-full bg-transparent border-0 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed select-text"
            />
          </div>

          {/* Variables Panel */}
          {detectedVariables.length > 0 && (
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Brackets className="w-3 h-3" />
                  <span>Prompt Variables ({detectedVariables.length})</span>
                </span>
                <span className="text-[9px] text-zinc-500">Substituted live into prompt</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {detectedVariables.map((v) => (
                  <div key={v} className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 block truncate">
                      {'{{'}{v}{'}}'}
                    </label>
                    <input
                      type="text"
                      value={freeformVariables[v] || ''}
                      onChange={(e) => setFreeformVariable(v, e.target.value)}
                      placeholder={`Value for ${v}...`}
                      className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Output Completion (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-zinc-900/60">
          <div className="p-2.5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Completion Output</span>
            </span>

            {freeformOutput && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto text-xs font-sans text-zinc-200 whitespace-pre-wrap leading-relaxed select-text">
            {freeformOutput ? (
              freeformOutput
            ) : isGeneratingFreeform ? (
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono animate-pulse">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Streaming Gemini response...</span>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2 p-4">
                <Brackets className="w-8 h-8 text-zinc-700" />
                <p className="text-xs">
                  Fill variables on the left and click <strong>Run Prompt</strong> to view live model completion.
                </p>
              </div>
            )}
          </div>

          {/* Telemetry Footer */}
          {freeformTelemetry && (
            <div className="p-2.5 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-400 shrink-0">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> TTFT: {freeformTelemetry.ttftMs}ms
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Speed: {freeformTelemetry.tokensPerSecond} tps
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> {freeformTelemetry.tokenCount} tokens
              </span>
              <span className="flex items-center gap-1 text-purple-300">
                <DollarSign className="w-3 h-3 text-purple-400" /> ${freeformTelemetry.cost.toFixed(6)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
