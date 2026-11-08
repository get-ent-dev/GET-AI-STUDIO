import React, { useState } from 'react';
import {
  Settings2,
  Wand2,
  Cpu,
  Database,
  Sliders,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Globe,
  Terminal,
} from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { inferSchemaFromJsonString, validateSchemaText } from '../utils/schemaInferrer';
import { checkContextCachingThreshold } from '../utils/telemetry';

export const InspectorPanel: React.FC = () => {
  const {
    isInspectorOpen,
    config,
    setConfig,
    messages,
    setIsCachingModalOpen,
  } = useStudioStore();

  const [sampleJsonInput, setSampleJsonInput] = useState('');
  const [inferStatus, setInferStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');

  if (!isInspectorOpen) return null;

  const totalTokens = messages.reduce(
    (acc, m) => acc + (m.telemetry?.tokenCount || 0) + (m.telemetry?.inputTokens || 0),
    0
  );
  const cacheStatus = checkContextCachingThreshold(totalTokens);
  const schemaValidation = validateSchemaText(config.responseSchemaText);

  const handleInferSchema = () => {
    if (!sampleJsonInput.trim()) {
      setInferStatus({ message: 'Paste a JSON example first.', isError: true });
      return;
    }
    const result = inferSchemaFromJsonString(sampleJsonInput);
    if (result.success && result.schemaText) {
      setConfig({
        responseMimeType: 'application/json',
        responseSchemaText: result.schemaText,
      });
      setInferStatus({ message: 'Schema inferred successfully!', isError: false });
      setTimeout(() => setInferStatus(null), 3500);
    } else {
      setInferStatus({ message: result.error || 'Failed to parse JSON.', isError: true });
    }
  };

  const handleModelChange = (modelValue: string) => {
    if (modelValue === 'custom') {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
      setConfig({ model: modelValue });
    }
  };

  const handleCustomModelSubmit = () => {
    if (customModelName.trim()) {
      setConfig({ model: customModelName.trim() });
    }
  };

  return (
    <aside className="w-80 h-full border-l border-zinc-800 bg-zinc-950 p-4 overflow-y-auto text-zinc-200 text-xs space-y-6 shrink-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
          <Settings2 className="w-4 h-4 text-blue-400" />
          <span>Run Settings</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          {config.model}
        </span>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] uppercase font-bold tracking-wider text-zinc-400">
            Model
          </label>
          <span className="text-[10px] text-blue-400 font-medium">Active</span>
        </div>

        {!isCustomModel ? (
          <select
            value={config.model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-md p-2 text-zinc-100 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fastest TTFT)</option>
            <option value="gemini-4-argon">Gemini 4 Argon (Deep Reasoning & STEM)</option>
            <option value="gemini-flash-latest">Gemini Flash Latest</option>
            <option value="custom">+ Enter Custom Model Name...</option>
          </select>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="e.g. gemini-3.8-flash"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomModelSubmit()}
                className="flex-1 bg-zinc-900 border border-blue-500 rounded p-1.5 text-zinc-100 text-xs focus:outline-none"
              />
              <button
                onClick={handleCustomModelSubmit}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
              >
                Set
              </button>
            </div>
            <button
              onClick={() => setIsCustomModel(false)}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
            >
              Cancel custom model
            </button>
          </div>
        )}
      </div>

      {/* Thinking Level (for Gemini 3/4) */}
      <div className="space-y-2 pt-2 border-t border-zinc-850">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            <span>Thinking Level</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {config.thinkingLevel || 'MEDIUM'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800">
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setConfig({ thinkingLevel: lvl })}
              className={`py-1 rounded text-[10px] font-medium transition ${
                config.thinkingLevel === lvl
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Sampling Controls */}
      <div className="space-y-4 pt-2 border-t border-zinc-850">
        <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Sampling Parameters</span>
        </span>

        {/* Temperature */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-400">Temperature</span>
            <span className="font-mono text-zinc-200">{config.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={config.temperature}
            onChange={(e) => setConfig({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>Deterministic (0.0)</span>
            <span>Creative (2.0)</span>
          </div>
        </div>

        {/* Top-P */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-400">Top P</span>
            <span className="font-mono text-zinc-200">{config.topP.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.topP}
            onChange={(e) => setConfig({ topP: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Top-K */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-400">Top K</span>
            <span className="font-mono text-zinc-200">{config.topK}</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={config.topK}
            onChange={(e) => setConfig({ topK: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Max Output Tokens */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-400">Max Tokens</span>
            <span className="font-mono text-zinc-200">{config.maxOutputTokens.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="128"
            max="16384"
            step="128"
            value={config.maxOutputTokens}
            onChange={(e) => setConfig({ maxOutputTokens: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Native Tools */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Capabilities & Tools</span>
        </span>

        {/* Google Search Grounding */}
        <label className="flex items-center justify-between p-2 rounded-md bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-medium text-zinc-200">Google Search</div>
              <div className="text-[10px] text-zinc-500">Live web grounding & citations</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.groundingSearch}
            onChange={(e) => setConfig({ groundingSearch: e.target.checked })}
            className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
          />
        </label>

        {/* Python Code Execution */}
        <label className="flex items-center justify-between p-2 rounded-md bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <div>
              <div className="font-medium text-zinc-200">Python Sandbox</div>
              <div className="text-[10px] text-zinc-500">Run code for math & reasoning</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.codeExecution}
            onChange={(e) => setConfig({ codeExecution: e.target.checked })}
            className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Structured Output & Auto-Schema Inferrer */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400">
            Structured Output
          </span>
          <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 rounded">
            Enhanced
          </span>
        </div>

        <select
          value={config.responseMimeType}
          onChange={(e) => setConfig({ responseMimeType: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="text/plain">Plain Text (text/plain)</option>
          <option value="application/json">JSON (application/json)</option>
        </select>

        {config.responseMimeType === 'application/json' && (
          <div className="space-y-2 mt-2 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-md">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="font-medium flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Infer Schema</span>
              </span>
            </div>

            <textarea
              placeholder="Paste sample JSON here (e.g. { 'user': 'Alex', 'score': 95 })..."
              rows={3}
              value={sampleJsonInput}
              onChange={(e) => setSampleJsonInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 font-mono text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
            />

            <button
              onClick={handleInferSchema}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded font-medium transition"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Infer OpenAPI Schema</span>
            </button>

            {inferStatus && (
              <div
                className={`flex items-center gap-1 text-[11px] p-1.5 rounded ${
                  inferStatus.isError
                    ? 'bg-red-950/60 border border-red-800 text-red-300'
                    : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                }`}
              >
                {inferStatus.isError ? (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{inferStatus.message}</span>
              </div>
            )}

            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400 text-[10px]">Active responseSchema:</span>
                {schemaValidation.isValid ? (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                ) : (
                  <span className="text-amber-400 text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Malformed
                  </span>
                )}
              </div>
              <textarea
                value={config.responseSchemaText}
                onChange={(e) => setConfig({ responseSchemaText: e.target.value })}
                placeholder="OpenAPI Schema (JSON)..."
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 font-mono text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Context Caching Inspector Card */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Context Caching</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              cacheStatus.eligible
                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {cacheStatus.eligible ? 'Eligible' : 'Inactive'}
          </span>
        </div>

        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              cacheStatus.eligible ? 'bg-emerald-400' : 'bg-blue-500'
            }`}
            style={{ width: `${cacheStatus.progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>{totalTokens.toLocaleString()} tokens</span>
          <span>Target: {cacheStatus.threshold.toLocaleString()}</span>
        </div>

        <p className="text-[10px] text-zinc-500 leading-tight">
          Gemini automatically applies 75% input discounts when prompts exceed 32,768 tokens.
        </p>

        <button
          onClick={() => setIsCachingModalOpen(true)}
          className="w-full text-center text-blue-400 hover:text-blue-300 text-[11px] pt-1"
        >
          View Telemetry & Cost Breakdown →
        </button>
      </div>
    </aside>
  );
};
