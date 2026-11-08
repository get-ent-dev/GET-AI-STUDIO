import React, { useState } from 'react';
import { Copy, Check, Code2, X } from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import {
  generatePythonCode,
  generateTypeScriptCode,
  generateCurlCode,
} from '../utils/codeExport';

export const GetCodeModal: React.FC = () => {
  const { isCodeModalOpen, setIsCodeModalOpen, config, messages } = useStudioStore();
  const [lang, setLang] = useState<'python' | 'ts' | 'curl'>('python');
  const [copied, setCopied] = useState(false);

  if (!isCodeModalOpen) return null;

  const exportOptions = {
    model: config.model,
    temperature: config.temperature,
    topP: config.topP,
    topK: config.topK,
    maxOutputTokens: config.maxOutputTokens,
    systemInstruction: config.systemInstruction,
    groundingSearch: config.groundingSearch,
    codeExecution: config.codeExecution,
    responseMimeType: config.responseMimeType,
    responseSchemaText: config.responseSchemaText,
    messages: messages.map((m) => ({
      role: m.role,
      parts: m.parts.map((p) => ({
        text: p.text,
        inlineData: p.inlineData ? { mimeType: p.inlineData.mimeType, data: p.inlineData.data } : undefined,
      })),
    })),
  };

  const codeSnippets = {
    python: generatePythonCode(exportOptions),
    ts: generateTypeScriptCode(exportOptions),
    curl: generateCurlCode(exportOptions),
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">Get Code</h3>
            <span className="text-[10px] bg-blue-950 border border-blue-800 text-blue-300 px-1.5 py-0.5 rounded font-mono">
              @google/genai
            </span>
          </div>
          <button
            onClick={() => setIsCodeModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-4">
          <div className="flex">
            {(['python', 'ts', 'curl'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLang(tab)}
                className={`py-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                  lang === tab
                    ? 'border-blue-500 text-blue-400 bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'python' ? 'Python (SDK)' : tab === 'ts' ? 'TypeScript' : 'cURL'}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 px-3 py-1.5 rounded-md border border-zinc-700 text-xs font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="relative flex-1 p-4 bg-zinc-950 overflow-auto">
          <pre className="font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto select-text">
            {codeSnippets[lang]}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Official modern Google Gen AI SDK snippet. Requires GEMINI_API_KEY environment variable.</span>
          <span className="font-mono text-zinc-500">model: {config.model}</span>
        </div>
      </div>
    </div>
  );
};
