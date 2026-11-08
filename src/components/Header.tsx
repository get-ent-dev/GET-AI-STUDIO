import React, { useState } from 'react';
import {
  Cpu,
  Code,
  Share2,
  Trash2,
  Database,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  MessageSquare,
  Swords,
  FlaskConical,
  TableProperties,
  Edit2,
  Check,
  Save,
  Brackets,
  BookOpen,
} from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { checkContextCachingThreshold } from '../utils/telemetry';

export const Header: React.FC = () => {
  const {
    promptTitle,
    setPromptTitle,
    activeTab,
    setActiveTab,
    messages,
    clearMessages,
    isLeftNavOpen,
    toggleLeftNav,
    isInspectorOpen,
    toggleInspector,
    setIsCodeModalOpen,
    setIsCachingModalOpen,
    setIsShareModalOpen,
    setIsPromptGalleryOpen,
    saveCurrentPrompt,
  } = useStudioStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(promptTitle);

  const totalTokens = messages.reduce(
    (acc, m) => acc + (m.telemetry?.tokenCount || 0) + (m.telemetry?.inputTokens || 0),
    0
  );

  const cacheInfo = checkContextCachingThreshold(totalTokens);

  const handleTitleSubmit = () => {
    setPromptTitle(titleInput.trim() || 'Untitled Prompt');
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-3 sm:px-4 flex items-center justify-between select-none shrink-0 z-20">
      {/* Left: Nav Toggle + Logo + Editable Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleLeftNav}
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          title={isLeftNavOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-label="Toggle Navigation Drawer"
        >
          {isLeftNavOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm shadow-blue-500/20">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-100 text-sm hidden md:inline tracking-tight">
              Google AI Studio
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300">
              Enhanced
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

        {/* Title Editor */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-zinc-900 border border-blue-500 rounded px-2 py-0.5 text-xs text-zinc-100 focus:outline-none"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                title="Save title"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTitleInput(promptTitle);
                setIsEditingTitle(true);
              }}
              className="group flex items-center gap-1.5 text-xs text-zinc-300 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-900 transition max-w-[140px] sm:max-w-[200px] truncate"
              title="Click to rename prompt"
            >
              <span className="truncate font-medium">{promptTitle}</span>
              <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Mode Tabs (Always visible & responsive) */}
      <div className="flex items-center bg-zinc-900/90 p-0.5 sm:p-1 rounded-lg border border-zinc-800 shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition shrink-0 ${
            activeTab === 'chat'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Chat Prompt Mode"
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('freeform')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition shrink-0 ${
            activeTab === 'freeform'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Freeform Prompt Canvas with {{variable}} templating"
        >
          <Brackets className="w-3.5 h-3.5 text-emerald-400" />
          <span>Prompt (Freeform)</span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition shrink-0 ${
            activeTab === 'prompts'
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-blue-400/90 hover:text-blue-300'
          }`}
          title="Prompts & Templates Hub (25+ Production Prompts)"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold">Prompts Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('arena')}
          className={`hidden md:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition shrink-0 ${
            activeTab === 'arena'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Dual-Model Arena"
        >
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>Arena</span>
        </button>

        <button
          onClick={() => setActiveTab('evals')}
          className={`hidden lg:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition shrink-0 ${
            activeTab === 'evals'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Prompt Evaluation Testbed"
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
          <span>Evals</span>
        </button>

        <button
          onClick={() => setActiveTab('structured')}
          className={`hidden lg:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition shrink-0 ${
            activeTab === 'structured'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Structured Few-Shot Prompt"
        >
          <TableProperties className="w-3.5 h-3.5 text-purple-400" />
          <span>Structured</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
        {/* Context / Token Cache Counter */}
        <button
          onClick={() => setIsCachingModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-2 py-1 rounded-full transition text-[11px]"
          title="View Context Caching & Token Telemetry"
        >
          <Database className="w-3 h-3 text-blue-400" />
          <span className="font-mono text-zinc-200">{totalTokens.toLocaleString()}</span>
          <span className="text-zinc-500 hidden xl:inline">/ 2M</span>
          {cacheInfo.eligible ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Cache Active" />
          ) : (
            <span className="text-[10px] text-zinc-500 font-mono hidden xl:inline">
              ({cacheInfo.progressPercent}%)
            </span>
          )}
        </button>

        {/* Save Prompt */}
        <button
          onClick={saveCurrentPrompt}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2 sm:px-2.5 py-1.5 rounded-md border border-zinc-800 transition"
          title="Save Prompt to Library"
        >
          <Save className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Get Code */}
        <button
          onClick={() => setIsCodeModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 sm:px-2.5 py-1.5 rounded-md transition font-medium"
          title="Get Code (Python, TypeScript, cURL)"
        >
          <Code className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Get Code</span>
        </button>

        {/* Share */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md border border-zinc-800 transition"
          title="Share Prompt"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Clear Messages */}
        <button
          onClick={() => {
            if (window.confirm('Clear current messages?')) {
              clearMessages();
            }
          }}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-md transition"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        {/* Inspector Panel Toggle */}
        <button
          onClick={toggleInspector}
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          title={isInspectorOpen ? 'Hide parameters' : 'Show parameters'}
          aria-label="Toggle Parameters Inspector"
        >
          {isInspectorOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
