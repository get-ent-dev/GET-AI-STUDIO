import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Paperclip,
  Sparkles,
  Clock,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Music,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Globe,
  Terminal,
  Brackets,
  BookOpen,
} from 'lucide-react';
import { useStudioStore, StudioMessage } from '../store/studioStore';
import { estimateTokens, calculatePricing, calculateSpeedAndLatency } from '../utils/telemetry';

export const ChatCanvas: React.FC = () => {
  const {
    config,
    setConfig,
    messages,
    addMessage,
    updateLastModelMessage,
    isGenerating,
    setIsGenerating,
    deleteMessage,
    setActiveTab,
    setIsPromptGalleryOpen,
  } = useStudioStore();

  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<{
    mimeType: string;
    data: string;
    name: string;
    sizeKb: number;
    previewUrl?: string;
  } | null>(null);

  const [isSystemOpen, setIsSystemOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;

      setAttachment({
        mimeType: file.type || 'application/octet-stream',
        data: base64Data,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
        previewUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sample multimodal image loader for quick instant testing
  const loadSampleImage = () => {
    // 1x1 transparent png with blue dot as clean SVG data URI or simple chart demo
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
      <rect width="400" height="240" fill="#18181b"/>
      <text x="20" y="40" fill="#60a5fa" font-family="sans-serif" font-size="16" font-weight="bold">Q4 Performance Metrics</text>
      <rect x="50" y="80" width="40" height="110" fill="#3b82f6" rx="4"/>
      <rect x="120" y="60" width="40" height="130" fill="#60a5fa" rx="4"/>
      <rect x="190" y="110" width="40" height="80" fill="#10b981" rx="4"/>
      <rect x="260" y="40" width="40" height="150" fill="#8b5cf6" rx="4"/>
      <text x="50" y="210" fill="#a1a1aa" font-family="sans-serif" font-size="12">EMEA</text>
      <text x="120" y="210" fill="#a1a1aa" font-family="sans-serif" font-size="12">APAC</text>
      <text x="190" y="210" fill="#a1a1aa" font-family="sans-serif" font-size="12">LATAM</text>
      <text x="260" y="210" fill="#a1a1aa" font-family="sans-serif" font-size="12">NA</text>
    </svg>`;
    const base64 = btoa(svg);
    setAttachment({
      mimeType: 'image/svg+xml',
      data: base64,
      name: 'q4_performance_metrics.svg',
      sizeKb: 2,
      previewUrl: `data:image/svg+xml;base64,${base64}`,
    });
    setInput('Analyze this quarterly performance chart. Which region had the highest growth, and what are key takeaways?');
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const handleRun = async () => {
    if ((!input.trim() && !attachment) || isGenerating) return;

    const userParts: any[] = [];
    if (attachment) {
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data,
          name: attachment.name,
          sizeKb: attachment.sizeKb,
        },
      });
    }
    if (input.trim()) {
      userParts.push({ text: input.trim() });
    }

    const userMessage: StudioMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: userParts,
    };

    const initialModelMessage: StudioMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      parts: [{ text: '' }],
    };

    const updatedHistory = [...messages, userMessage];
    addMessage(userMessage);
    addMessage(initialModelMessage);

    const promptTokens = estimateTokens(input, {
      images: attachment?.mimeType.startsWith('image/') ? 1 : 0,
      pdfs: attachment?.mimeType.includes('pdf') ? 1 : 0,
    });

    setInput('');
    setAttachment(null);
    setIsGenerating(true);

    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let accumulatedText = '';
    let latestGrounding: any = undefined;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages: updatedHistory,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error('ReadableStream not supported.');

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
                accumulatedText += `\n[Error: ${parsed.error}]`;
                updateLastModelMessage(accumulatedText);
                break;
              }

              if (!firstTokenTime && parsed.text) {
                firstTokenTime = performance.now();
              }

              if (parsed.text) {
                accumulatedText += parsed.text;
              }

              if (parsed.groundingMetadata) {
                latestGrounding = parsed.groundingMetadata;
              }

              updateLastModelMessage(accumulatedText, undefined, latestGrounding);
            } catch {
              // Ignore partial chunk parsing
            }
          }
        }
      }

      // Compute final telemetry
      const endTime = performance.now();
      const tokenCount = Math.ceil(accumulatedText.length / 3.8);
      const metrics = calculateSpeedAndLatency(firstTokenTime, startTime, endTime, tokenCount);
      const pricing = calculatePricing(config.model, promptTokens, tokenCount);

      updateLastModelMessage(
        accumulatedText,
        {
          ttftMs: metrics.ttftMs,
          totalMs: metrics.totalMs,
          tokensPerSecond: metrics.tokensPerSecond,
          tokenCount,
          inputTokens: promptTokens,
          cost: pricing.totalCost,
        },
        latestGrounding
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        updateLastModelMessage(
          accumulatedText ? `${accumulatedText}\n\n[Error: ${err.message}]` : `Error: ${err.message}`
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const estimatedInputTokens = estimateTokens(input, {
    images: attachment?.mimeType.startsWith('image/') ? 1 : 0,
    pdfs: attachment?.mimeType.includes('pdf') ? 1 : 0,
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden min-w-0">
      {/* System Instruction (Collapsible) */}
      <div className="bg-zinc-950 border-b border-zinc-800 transition-all select-none">
        <div
          onClick={() => setIsSystemOpen(!isSystemOpen)}
          className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-zinc-900/60"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
              System Instructions
            </span>
            {config.systemInstruction ? (
              <span className="w-2 h-2 rounded-full bg-blue-500" title="Active" />
            ) : (
              <span className="text-[10px] text-zinc-600">(None set)</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            {config.systemInstruction && (
              <span className="text-[10px] font-mono text-zinc-400">
                {estimateTokens(config.systemInstruction)} tokens
              </span>
            )}
            {isSystemOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isSystemOpen && (
          <div className="px-4 pb-3 pt-1">
            <textarea
              value={config.systemInstruction}
              onChange={(e) => setConfig({ systemInstruction: e.target.value })}
              placeholder="Optional system instructions: Define role, constraints, tone, or formatting guidelines..."
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
        )}
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Google AI Studio Prototyping Canvas
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Prompt Gemini models, inspect real-time TTFT and TPS speed telemetry, test multimodal media, or try a quick starter below:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
              <button
                onClick={() => {
                  setInput('Extract name, title, and email from: Dr. Elena Rostova, VP of Robotics, elena.rostova@nexus.tech');
                  setConfig({
                    responseMimeType: 'application/json',
                    responseSchemaText: JSON.stringify(
                      {
                        type: 'OBJECT',
                        properties: {
                          name: { type: 'STRING' },
                          title: { type: 'STRING' },
                          email: { type: 'STRING' },
                        },
                      },
                      null,
                      2
                    ),
                  });
                }}
                className="p-3 text-left bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition group"
              >
                <div className="font-medium text-xs text-zinc-200 group-hover:text-blue-300">
                  Structured JSON Extract
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Enforce strict OpenAPI schema
                </div>
              </button>

              <button
                onClick={() => {
                  setInput('What were the major breakthroughs announced at Google I/O this year? Cite your sources.');
                  setConfig({ groundingSearch: true });
                }}
                className="p-3 text-left bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition group"
              >
                <div className="font-medium text-xs text-zinc-200 group-hover:text-emerald-300">
                  Live Search Grounding
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Fetch current web sources & links
                </div>
              </button>

              <button
                onClick={() => {
                  setInput('Write a Python function to compute the eigenvalues of a 3x3 matrix and test it.');
                  setConfig({ codeExecution: true });
                }}
                className="p-3 text-left bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition group"
              >
                <div className="font-medium text-xs text-zinc-200 group-hover:text-purple-300">
                  Python Code Execution
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Run in sandboxed environment
                </div>
              </button>

              <button
                onClick={loadSampleImage}
                className="p-3 text-left bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition group"
              >
                <div className="font-medium text-xs text-zinc-200 group-hover:text-amber-300">
                  Multimodal Chart Inspector
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Load sample chart asset & analyze
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`w-full max-w-3xl rounded-xl p-4 text-xs transition border ${
                  m.role === 'user'
                    ? 'bg-blue-950/30 border-blue-800/40 text-blue-50'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-200 shadow-sm'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-800/60">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
                    {m.role === 'user' ? (
                      <span className="text-blue-400">User Turn</span>
                    ) : (
                      <span className="text-zinc-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        {config.model}
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-1 text-zinc-500">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          m.parts.map((p) => p.text || '').join('\n'),
                          m.id
                        )
                      }
                      className="p-1 hover:text-zinc-200 transition"
                      title="Copy text"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteMessage(m.id)}
                      className="p-1 hover:text-red-400 transition"
                      title="Delete turn"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Attachments */}
                {m.parts.map((p, idx) => (
                  <div key={idx} className="space-y-2">
                    {p.inlineData && (
                      <div className="mb-2">
                        {p.inlineData.mimeType.startsWith('image/') ? (
                          <div className="rounded-lg overflow-hidden border border-zinc-800 inline-block bg-black/40">
                            <img
                              src={
                                p.inlineData.mimeType === 'image/svg+xml'
                                  ? `data:image/svg+xml;base64,${p.inlineData.data}`
                                  : `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
                              }
                              alt="Multimodal attachment"
                              className="max-h-56 object-contain"
                            />
                            <div className="px-2 py-1 text-[10px] text-zinc-400 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
                              <span>{p.inlineData.name || 'image'}</span>
                              <span className="font-mono">{p.inlineData.mimeType}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-md max-w-sm">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="truncate min-w-0">
                              <div className="text-xs font-medium text-zinc-200 truncate">
                                {p.inlineData.name || 'Document'}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {p.inlineData.mimeType} ({p.inlineData.sizeKb || 0} KB)
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {p.text && (
                      <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs select-text">
                        {p.text}
                      </div>
                    )}
                  </div>
                ))}

                {/* Grounding Attribution Sources */}
                {m.groundingMetadata?.groundingChunks &&
                  m.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1.5 mb-1.5">
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>Google Search Grounding Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.groundingMetadata.groundingChunks.map((chunk, cIdx) => {
                          const uri = chunk.web?.uri;
                          const title = chunk.web?.title || uri;
                          if (!uri) return null;
                          return (
                            <a
                              key={cIdx}
                              href={uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-2 py-1 rounded text-[10px] text-blue-300 transition"
                            >
                              <span className="truncate max-w-[180px]">{title}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Real-time Telemetry Metrics Pill */}
                {m.telemetry && (
                  <div className="mt-3 pt-2 border-t border-zinc-800/70 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400 font-mono">
                    <span
                      className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
                      title="Time To First Token"
                    >
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>TTFT: {m.telemetry.ttftMs}ms</span>
                    </span>

                    <span
                      className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
                      title="Throughput speed in tokens per second"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{m.telemetry.tokensPerSecond} tps</span>
                    </span>

                    <span
                      className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
                      title="Total output tokens generated"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>{m.telemetry.tokenCount} tokens</span>
                    </span>

                    <span
                      className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-purple-300"
                      title="Real-time estimated generation cost"
                    >
                      <DollarSign className="w-3 h-3 text-purple-400" />
                      <span>${m.telemetry.cost.toFixed(6)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Designated Prompt Section */}
      <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 shrink-0 select-none">
        {/* Prompt Section Header Bar */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              Prompt Section
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('freeform')}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 px-2 py-0.5 rounded transition cursor-pointer"
              title="Switch to Freeform Prompt Canvas"
            >
              <Brackets className="w-3 h-3" />
              <span>Freeform</span>
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/40 px-2 py-0.5 rounded transition cursor-pointer"
              title="Browse Curated Production Prompt Templates"
            >
              <BookOpen className="w-3 h-3" />
              <span>Templates</span>
            </button>
          </div>
        </div>

        {/* Quick Prompts Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none text-[10px]">
          <span className="text-zinc-500 font-medium uppercase tracking-wider shrink-0 mr-0.5">Quick Prompts:</span>
          <button
            onClick={() => setInput('Explain the difference between synchronous and asynchronous architectures in high-scale distributed systems with clear examples.')}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded whitespace-nowrap transition cursor-pointer"
          >
            Explain Concept
          </button>
          <button
            onClick={() => {
              setInput('Review this code for security vulnerabilities, race conditions, and performance bottlenecks:');
              setConfig({ thinkingLevel: 'HIGH' });
            }}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded whitespace-nowrap transition cursor-pointer"
          >
            Code Review
          </button>
          <button
            onClick={() => {
              setInput('Extract person name, company, email, and primary skills from: "Alice Vance, CTO of Aurora Quantum (alice@aurora.io), specialist in fault-tolerant quantum algorithms and Qiskit."');
              setConfig({ responseMimeType: 'application/json' });
            }}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded whitespace-nowrap transition cursor-pointer"
          >
            Extract JSON
          </button>
          <button
            onClick={() => {
              setInput('What are the latest updates on Gemini models and Context Caching pricing? Cite sources.');
              setConfig({ groundingSearch: true });
            }}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded whitespace-nowrap transition cursor-pointer"
          >
            Search Web
          </button>
          <button
            onClick={loadSampleImage}
            className="bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded whitespace-nowrap transition cursor-pointer"
          >
            Chart Inspector
          </button>
        </div>

        {/* Attachment preview chip */}
        {attachment && (
          <div className="flex items-center gap-2 mb-2 bg-zinc-900 border border-zinc-800 w-fit px-2.5 py-1 rounded-md text-xs text-zinc-300">
            {attachment.mimeType.startsWith('image/') ? (
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            ) : attachment.mimeType.startsWith('audio/') ? (
              <Music className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="truncate max-w-[200px]">{attachment.name}</span>
            <span className="text-[10px] text-zinc-500 font-mono">({attachment.sizeKb} KB)</span>
            <button
              onClick={() => setAttachment(null)}
              className="text-zinc-500 hover:text-red-400 ml-1 font-bold"
              title="Remove attachment"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/pdf,audio/*"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
            title="Attach multimodal image, PDF, or audio file"
            aria-label="Upload file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Prompt Textarea */}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRun();
                }
              }}
              placeholder="Type your prompt here... (Shift+Enter for newline, Enter to run)"
              rows={Math.min(5, Math.max(1, input.split('\n').length))}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none font-sans"
            />
            {input.trim() && (
              <span className="absolute right-2 bottom-2 text-[9px] font-mono text-zinc-500 select-none">
                ~{estimatedInputTokens} tok
              </span>
            )}
          </div>

          {/* Run / Stop Button */}
          {isGenerating ? (
            <button
              onClick={handleStop}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!input.trim() && !attachment}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
