import React, { useState, useRef } from 'react';
import {
  Swords,
  Play,
  Square,
  Clock,
  Zap,
  DollarSign,
  Trophy,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useStudioStore, StudioMessage } from '../store/studioStore';
import { estimateTokens, calculatePricing, calculateSpeedAndLatency } from '../utils/telemetry';

export const ArenaCanvas: React.FC = () => {
  const {
    config,
    arenaModelA,
    arenaModelB,
    setArenaModelA,
    setArenaModelB,
    arenaMessagesA,
    arenaMessagesB,
    addArenaUserMessage,
    updateArenaModelMessage,
    isGeneratingArenaA,
    isGeneratingArenaB,
    setArenaGenerating,
    arenaVotes,
    voteArena,
    clearArenaMessages,
  } = useStudioStore();

  const [input, setInput] = useState('');
  const [hasVotedCurrent, setHasVotedCurrent] = useState(false);
  const abortA = useRef<AbortController | null>(null);
  const abortB = useRef<AbortController | null>(null);

  const isGenerating = isGeneratingArenaA || isGeneratingArenaB;

  const runModelStream = async (
    target: 'a' | 'b',
    modelName: string,
    history: StudioMessage[],
    userMessage: StudioMessage
  ) => {
    setArenaGenerating(target, true);
    const controller = new AbortController();
    if (target === 'a') abortA.current = controller;
    else abortB.current = controller;

    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let accumulated = '';
    const promptTokens = estimateTokens(input);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...config,
            model: modelName,
          },
          messages: [...history, userMessage],
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Generation failed for ${modelName}`);
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
              if (!firstTokenTime && parsed.text) {
                firstTokenTime = performance.now();
              }
              if (parsed.text) {
                accumulated += parsed.text;
                updateArenaModelMessage(target, accumulated);
              }
            } catch {
              // Ignore partial
            }
          }
        }
      }

      const endTime = performance.now();
      const tokenCount = Math.ceil(accumulated.length / 3.8);
      const metrics = calculateSpeedAndLatency(firstTokenTime, startTime, endTime, tokenCount);
      const pricing = calculatePricing(modelName, promptTokens, tokenCount);

      updateArenaModelMessage(target, accumulated, {
        ttftMs: metrics.ttftMs,
        totalMs: metrics.totalMs,
        tokensPerSecond: metrics.tokensPerSecond,
        tokenCount,
        inputTokens: promptTokens,
        cost: pricing.totalCost,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        updateArenaModelMessage(target, `[Error: ${err.message}]`);
      }
    } finally {
      setArenaGenerating(target, false);
    }
  };

  const handleRun = () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: StudioMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ text: input.trim() }],
    };

    setHasVotedCurrent(false);
    addArenaUserMessage(userMessage);

    const historyA = [...arenaMessagesA];
    const historyB = [...arenaMessagesB];

    runModelStream('a', arenaModelA, historyA, userMessage);
    runModelStream('b', arenaModelB, historyB, userMessage);

    setInput('');
  };

  const handleStop = () => {
    abortA.current?.abort();
    abortB.current?.abort();
    setArenaGenerating('a', false);
    setArenaGenerating('b', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden select-none">
      {/* Arena Header Bar */}
      <div className="h-12 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-xs tracking-wide text-zinc-200">
            Dual-Model Arena (Side-by-Side Playground)
          </span>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center gap-3 text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
          <span className="text-zinc-400 font-medium">Votes:</span>
          <span className="text-blue-400 font-mono font-bold">A: {arenaVotes.a}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-300 font-mono font-bold">Ties: {arenaVotes.tie}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-purple-400 font-mono font-bold">B: {arenaVotes.b}</span>
        </div>

        <button
          onClick={clearArenaMessages}
          className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 hover:bg-zinc-800 px-2 py-1 rounded transition"
          title="Reset Arena Turns"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Model Selection Header */}
      <div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-950/70 text-xs shrink-0 divide-x divide-zinc-800">
        <div className="p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center font-mono text-[10px]">
              A
            </span>
            <span className="font-medium text-zinc-300">Model A:</span>
            <select
              value={arenaModelA}
              onChange={(e) => setArenaModelA(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option>
              <option value="gemini-4-argon">Gemini 4 Argon</option>
            </select>
          </div>
          {isGeneratingArenaA && (
            <span className="text-[10px] text-blue-400 animate-pulse font-mono">Streaming...</span>
          )}
        </div>

        <div className="p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center font-mono text-[10px]">
              B
            </span>
            <span className="font-medium text-zinc-300">Model B:</span>
            <select
              value={arenaModelB}
              onChange={(e) => setArenaModelB(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
            >
              <option value="gemini-4-argon">Gemini 4 Argon</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option>
            </select>
          </div>
          {isGeneratingArenaB && (
            <span className="text-[10px] text-purple-400 animate-pulse font-mono">Streaming...</span>
          )}
        </div>
      </div>

      {/* Side-by-Side Dual Canvas */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-800 overflow-hidden min-h-0">
        {/* Model A Column */}
        <div className="p-4 overflow-y-auto space-y-4">
          {arenaMessagesA.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
              <Sparkles className="w-8 h-8 text-blue-500/30 mb-2" />
              <span>Prompt will run concurrently on {arenaModelA}</span>
            </div>
          ) : (
            arenaMessagesA.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-lg text-xs ${
                  m.role === 'user'
                    ? 'bg-blue-950/20 border border-blue-900/40 text-blue-100 ml-6'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 mr-6 shadow-sm'
                }`}
              >
                <div className="text-[10px] font-bold text-zinc-500 mb-1 uppercase">
                  {m.role === 'user' ? 'Prompt' : arenaModelA}
                </div>
                <div className="whitespace-pre-wrap select-text leading-relaxed">
                  {m.parts.map((p) => p.text).join('')}
                </div>

                {m.telemetry && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap gap-2 text-[9px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-emerald-400" /> TTFT: {m.telemetry.ttftMs}ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-amber-400" /> {m.telemetry.tokensPerSecond} tps
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5 text-blue-400" /> ${m.telemetry.cost.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Model B Column */}
        <div className="p-4 overflow-y-auto space-y-4">
          {arenaMessagesB.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
              <Sparkles className="w-8 h-8 text-purple-500/30 mb-2" />
              <span>Prompt will run concurrently on {arenaModelB}</span>
            </div>
          ) : (
            arenaMessagesB.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-lg text-xs ${
                  m.role === 'user'
                    ? 'bg-blue-950/20 border border-blue-900/40 text-blue-100 ml-6'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 mr-6 shadow-sm'
                }`}
              >
                <div className="text-[10px] font-bold text-zinc-500 mb-1 uppercase">
                  {m.role === 'user' ? 'Prompt' : arenaModelB}
                </div>
                <div className="whitespace-pre-wrap select-text leading-relaxed">
                  {m.parts.map((p) => p.text).join('')}
                </div>

                {m.telemetry && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap gap-2 text-[9px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-emerald-400" /> TTFT: {m.telemetry.ttftMs}ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-amber-400" /> {m.telemetry.tokensPerSecond} tps
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5 text-purple-400" /> ${m.telemetry.cost.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Voting Bar (appears when response is ready) */}
      {arenaMessagesA.length > 0 && !isGenerating && !hasVotedCurrent && (
        <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-3 shrink-0">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Which model produced the better output?</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                voteArena('a');
                setHasVotedCurrent(true);
              }}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1 rounded text-xs font-medium transition"
            >
              👈 Model A Won ({arenaModelA})
            </button>
            <button
              onClick={() => {
                voteArena('tie');
                setHasVotedCurrent(true);
              }}
              className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 px-3 py-1 rounded text-xs font-medium transition"
            >
              🤝 Tie / Equal
            </button>
            <button
              onClick={() => {
                voteArena('b');
                setHasVotedCurrent(true);
              }}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 px-3 py-1 rounded text-xs font-medium transition"
            >
              👉 Model B Won ({arenaModelB})
            </button>
          </div>
        </div>
      )}

      {/* Unified Input Bar */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRun();
              }
            }}
            placeholder="Type prompt to run side-by-side on both models..."
            rows={2}
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none"
          />

          {isGenerating ? (
            <button
              onClick={handleStop}
              className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!input.trim()}
              className="px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Both</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
