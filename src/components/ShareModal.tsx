import React, { useState } from 'react';
import { Share2, Copy, Check, Download, X } from 'lucide-react';
import { useStudioStore } from '../store/studioStore';

export const ShareModal: React.FC = () => {
  const { isShareModalOpen, setIsShareModalOpen, promptTitle, config, messages, activeTab } = useStudioStore();
  const [copied, setCopied] = useState(false);

  if (!isShareModalOpen) return null;

  const promptSpec = {
    title: promptTitle,
    mode: activeTab,
    version: '1.0',
    exportedAt: new Date().toISOString(),
    config,
    messages,
  };

  const specString = JSON.stringify(promptSpec, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(specString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(specString);
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${promptTitle.toLowerCase().replace(/\s+/g, '_')}_spec.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">
              Share & Export Prompt
            </h3>
          </div>
          <button
            onClick={() => setIsShareModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-zinc-300">
          <p className="text-zinc-400">
            Export the complete prompt specification including system instructions, model hyperparameters, tools, schemas, and turn history.
          </p>

          <div className="relative">
            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-300 max-h-56 overflow-y-auto select-text">
              {specString}
            </pre>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 py-2 rounded-lg font-medium border border-zinc-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition"
            >
              <Download className="w-4 h-4" />
              <span>Download .JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
