import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Brackets,
  Swords,
  FlaskConical,
  TableProperties,
  Bookmark,
  Trash2,
  Layers,
  ChevronDown,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useStudioStore } from '../store/studioStore';

export const LeftDrawer: React.FC = () => {
  const {
    isLeftNavOpen,
    activeTab,
    setActiveTab,
    savedPrompts,
    activePromptId,
    loadSavedPrompt,
    deleteSavedPrompt,
    setPromptTitle,
    clearMessages,
    config,
    setIsPromptGalleryOpen,
  } = useStudioStore();

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'presets' | 'saved'>('all');

  if (!isLeftNavOpen) return null;

  const handleCreateNew = (mode: 'chat' | 'freeform' | 'arena' | 'evals' | 'structured') => {
    setActiveTab(mode);
    setPromptTitle(
      `New ${
        mode === 'chat'
          ? 'Chat'
          : mode === 'freeform'
          ? 'Freeform'
          : mode === 'arena'
          ? 'Arena'
          : mode === 'evals'
          ? 'Evaluation'
          : 'Structured'
      } Prompt`
    );
    if (mode === 'chat') clearMessages();
    setIsNewMenuOpen(false);
  };

  const filteredPrompts = savedPrompts.filter((p) => {
    if (filter === 'presets') return p.id.startsWith('preset-');
    if (filter === 'saved') return !p.id.startsWith('preset-');
    return true;
  });

  return (
    <aside className="w-64 h-full border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none text-xs text-zinc-300">
      {/* New Prompt Button */}
      <div className="p-3 border-b border-zinc-800 relative">
        <button
          onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
          className="w-full flex items-center justify-between bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded-md shadow-sm transition"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Prompt</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>

        {/* Dropdown for New Prompt Modes */}
        {isNewMenuOpen && (
          <div className="absolute top-14 left-3 right-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-30">
            <button
              onClick={() => handleCreateNew('chat')}
              className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2.5 text-zinc-200"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <div className="font-medium">Chat Prompt</div>
                <div className="text-[10px] text-zinc-400">Multi-turn with multimodal input</div>
              </div>
            </button>
            <button
              onClick={() => handleCreateNew('freeform')}
              className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2.5 text-zinc-200"
            >
              <Brackets className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <div className="font-medium">Freeform Prompt</div>
                <div className="text-[10px] text-zinc-400">Open canvas with variable templating</div>
              </div>
            </button>
            <button
              onClick={() => handleCreateNew('arena')}
              className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2.5 text-zinc-200"
            >
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <div className="font-medium">Dual-Model Arena</div>
                <div className="text-[10px] text-zinc-400">Side-by-side model comparison</div>
              </div>
            </button>
            <button
              onClick={() => handleCreateNew('evals')}
              className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2.5 text-zinc-200"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <div className="font-medium">Eval Testbed</div>
                <div className="text-[10px] text-zinc-400">Batch query evaluation & scores</div>
              </div>
            </button>
            <button
              onClick={() => handleCreateNew('structured')}
              className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2.5 text-zinc-200"
            >
              <TableProperties className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <div className="font-medium">Structured Prompt</div>
                <div className="text-[10px] text-zinc-400">Few-shot tabular examples</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Section 1: Prompt Workspaces & Modes */}
      <div className="p-2 border-b border-zinc-800 space-y-1">
        <div className="px-2 pt-1 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center justify-between">
          <span>Prompt Modes</span>
          <span className="text-[9px] text-zinc-600 font-mono">Workspace</span>
        </div>

        <button
          onClick={() => setActiveTab('chat')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition ${
            activeTab === 'chat'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Chat Prompt</span>
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">Turns</span>
        </button>

        <button
          onClick={() => setActiveTab('freeform')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition ${
            activeTab === 'freeform'
              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <Brackets className="w-3.5 h-3.5 text-emerald-400" />
            <span>Freeform Prompt</span>
          </span>
          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1 rounded font-mono">
            {'{{var}}'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition ${
            activeTab === 'prompts'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-blue-400/90 hover:text-blue-300 hover:bg-blue-950/30 border border-transparent hover:border-blue-800/30'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">Prompts & Templates Hub</span>
          </span>
          <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1 rounded font-mono">
            25+
          </span>
        </button>

        <button
          onClick={() => setActiveTab('arena')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition ${
            activeTab === 'arena'
              ? 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>Dual-Model Arena</span>
          </span>
          <span className="text-[9px] bg-amber-950 border border-amber-800 text-amber-300 px-1 rounded font-mono">
            Side-by-Side
          </span>
        </button>

        <button
          onClick={() => setActiveTab('evals')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition ${
            activeTab === 'evals'
              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prompt Eval Testbed</span>
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">Scores</span>
        </button>

        <button
          onClick={() => setActiveTab('structured')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition ${
            activeTab === 'structured'
              ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <TableProperties className="w-3.5 h-3.5 text-purple-400" />
            <span>Structured Few-Shot</span>
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">Tabular</span>
        </button>
      </div>

      {/* Prompt Library List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 pt-3 pb-1.5 flex items-center justify-between text-zinc-400">
          <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-blue-400" /> Prompt Library
          </span>
          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[10px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-1.5 py-0.5 rounded ${filter === 'all' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('presets')}
              className={`px-1.5 py-0.5 rounded ${filter === 'presets' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
            >
              Presets
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredPrompts.map((p) => {
            const isActive = p.id === activePromptId;
            const isPreset = p.id.startsWith('preset-');
            return (
              <div
                key={p.id}
                onClick={() => loadSavedPrompt(p.id)}
                className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition border ${
                  isActive
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                    : 'border-transparent hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isPreset && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span className="truncate font-medium text-xs">{p.title}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">{p.description}</div>
                </div>

                {!isPreset && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedPrompt(p.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                    title="Delete saved prompt"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 space-y-2">
        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Active Model:</span>
          </span>
          <span className="font-mono text-zinc-200 text-[10px]">{config.model}</span>
        </div>

        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Run: <kbd className="px-1 py-0.5 bg-zinc-800 rounded font-mono text-zinc-400">⌘+Enter</kbd></span>
          <a
            href="https://ai.google.dev/gemini-api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-blue-400 transition"
          >
            <span>Docs</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
