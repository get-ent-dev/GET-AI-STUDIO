import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Brackets,
  MessageSquare,
  TableProperties,
  ArrowRight,
  Cpu,
  Layers,
  Plus,
  Play,
  Bookmark,
  Check,
} from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { PROMPT_GALLERY_TEMPLATES } from './PromptGalleryModal';

export const PromptsGalleryView: React.FC = () => {
  const {
    setConfig,
    setPromptTitle,
    addMessage,
    clearMessages,
    setFreeformPrompt,
    setFreeformVariable,
    setActiveTab,
  } = useStudioStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(PROMPT_GALLERY_TEMPLATES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Reasoning', 'Coding', 'Extraction', 'Grounding', 'Creative'];

  const filteredTemplates = PROMPT_GALLERY_TEMPLATES.filter((tmpl) => {
    const matchesCategory = selectedCategory === 'All' || tmpl.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const activeTemplate =
    PROMPT_GALLERY_TEMPLATES.find((t) => t.id === activeTemplateId) || PROMPT_GALLERY_TEMPLATES[0];

  const handleApplyTemplate = (tmpl: typeof activeTemplate, targetMode?: 'chat' | 'freeform') => {
    const mode = targetMode || tmpl.mode;
    setPromptTitle(tmpl.title);
    setConfig(tmpl.config);

    if (mode === 'chat') {
      clearMessages();
      if (tmpl.messages && tmpl.messages.length > 0) {
        tmpl.messages.forEach((m) => addMessage(m));
      } else if (tmpl.freeformPrompt) {
        let initialText = tmpl.freeformPrompt;
        if (tmpl.freeformVariables) {
          Object.entries(tmpl.freeformVariables).forEach(([k, v]) => {
            initialText = initialText.replaceAll(`{{${k}}}`, v);
          });
        }
        addMessage({
          id: crypto.randomUUID(),
          role: 'user',
          parts: [{ text: initialText }],
        });
      }
      setActiveTab('chat');
    } else {
      // Freeform mode
      if (tmpl.freeformPrompt) {
        setFreeformPrompt(tmpl.freeformPrompt);
        if (tmpl.freeformVariables) {
          Object.entries(tmpl.freeformVariables).forEach(([k, v]) => {
            setFreeformVariable(k, v);
          });
        }
      }
      setActiveTab('freeform');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 border border-blue-500/30 rounded-xl text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                  Prompt Section & Templates Hub
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 font-bold">
                  25+ Production Prompts
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Curated prompt engineering patterns for Gemini models: Chain-of-Thought, strict OpenAPI schemas, live search grounding, and security auditors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPromptTitle('New Freeform Prompt');
                setActiveTab('freeform');
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition shadow-sm"
            >
              <Brackets className="w-3.5 h-3.5" />
              <span>Create Freeform Prompt</span>
            </button>
            <button
              onClick={() => {
                setPromptTitle('New Chat Prompt');
                clearMessages();
                setActiveTab('chat');
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Create Chat Prompt</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts by keyword, tags..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Split Body: Templates List & Detailed Inspection Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
        {/* Left Column: Template Cards List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto p-3 sm:p-4 space-y-2 bg-zinc-950/40">
          <div className="flex items-center justify-between text-[11px] uppercase font-bold tracking-wider text-zinc-500 px-1 mb-1">
            <span>Available Templates ({filteredTemplates.length})</span>
            <span>Click to preview</span>
          </div>

          {filteredTemplates.map((tmpl) => {
            const isSelected = tmpl.id === activeTemplateId;
            return (
              <div
                key={tmpl.id}
                onClick={() => setActiveTemplateId(tmpl.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/20 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>{tmpl.title}</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        tmpl.mode === 'freeform'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}
                    >
                      {tmpl.mode === 'freeform' ? 'Freeform' : 'Chat'}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {tmpl.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Template Inspector & Workspace Launcher (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-y-auto p-4 sm:p-6 bg-zinc-900/30">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                  {activeTemplate.title}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                  {activeTemplate.category}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {activeTemplate.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleApplyTemplate(activeTemplate, 'freeform')}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition shadow-sm"
                title="Load into Freeform Prompt Canvas"
              >
                <Brackets className="w-3.5 h-3.5" />
                <span>Open in Freeform</span>
              </button>
              <button
                onClick={() => handleApplyTemplate(activeTemplate, 'chat')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition shadow-sm"
                title="Load into Chat Prompt Canvas"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open in Chat</span>
              </button>
            </div>
          </div>

          {/* Model & Config Badges */}
          <div className="py-3 flex flex-wrap items-center gap-2 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Model: {activeTemplate.config.model}</span>
            </span>
            <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
              Temp: {activeTemplate.config.temperature}
            </span>
            <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
              Max Tokens: {activeTemplate.config.maxOutputTokens}
            </span>
            {activeTemplate.config.groundingSearch && (
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded">
                ✓ Google Search Grounding
              </span>
            )}
            {activeTemplate.config.codeExecution && (
              <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-1 rounded">
                ✓ Python Code Execution
              </span>
            )}
            {activeTemplate.config.responseMimeType === 'application/json' && (
              <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-1 rounded">
                ✓ OpenAPI JSON Schema
              </span>
            )}
          </div>

          {/* System Instructions Preview */}
          {activeTemplate.config.systemInstruction && (
            <div className="mt-4 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                System Instructions
              </span>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 leading-relaxed">
                {activeTemplate.config.systemInstruction}
              </div>
            </div>
          )}

          {/* Prompt Body / Variables */}
          <div className="mt-4 space-y-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                Prompt Template Body
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    activeTemplate.freeformPrompt ||
                      activeTemplate.messages?.map((m) => m.parts.map((p) => p.text).join('\n')).join('\n') ||
                      '',
                    activeTemplate.id
                  )
                }
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                {copiedId === activeTemplate.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <span>Copy Prompt</span>
                )}
              </button>
            </div>

            <div className="flex-1 p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed overflow-y-auto select-text">
              {activeTemplate.freeformPrompt ||
                activeTemplate.messages?.map((m) => m.parts.map((p) => p.text).join('\n')).join('\n')}
            </div>

            {/* Default Variables Preview */}
            {activeTemplate.freeformVariables &&
              Object.keys(activeTemplate.freeformVariables).length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Brackets className="w-3 h-3" />
                    <span>Configured Template Variables</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(activeTemplate.freeformVariables).map(([k, v]) => (
                      <div
                        key={k}
                        className="bg-zinc-950 p-2 rounded border border-zinc-800 text-[11px] font-mono"
                      >
                        <span className="text-emerald-400 font-bold">{'{{' + k + '}}'}:</span>{' '}
                        <span className="text-zinc-300 truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
