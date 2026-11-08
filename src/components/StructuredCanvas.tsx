import React, { useState } from 'react';
import {
  TableProperties,
  Plus,
  Trash2,
  Play,
  Square,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useStudioStore, StructuredRow } from '../store/studioStore';

export const StructuredCanvas: React.FC = () => {
  const {
    config,
    structuredRows,
    addStructuredRow,
    updateStructuredRow,
    deleteStructuredRow,
    structuredInput,
    setStructuredInput,
    structuredOutput,
    setStructuredOutput,
    isGeneratingStructured,
    setIsGeneratingStructured,
  } = useStudioStore();

  const [inputVal, setInputVal] = useState('');
  const [contextVal, setContextVal] = useState('');
  const [outputVal, setOutputVal] = useState('');

  const handleAddExample = () => {
    if (!inputVal.trim() && !outputVal.trim()) return;
    addStructuredRow({
      input: inputVal.trim(),
      context: contextVal.trim() || undefined,
      output: outputVal.trim(),
    });
    setInputVal('');
    setContextVal('');
    setOutputVal('');
  };

  const handleRunFewShot = async () => {
    if (!structuredInput.trim() || isGeneratingStructured) return;
    setIsGeneratingStructured(true);
    setStructuredOutput('');

    // Construct few-shot prompt messages
    const fewShotMessages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    structuredRows.forEach((row) => {
      let userText = `Input: ${row.input}`;
      if (row.context) userText += `\nContext: ${row.context}`;
      fewShotMessages.push({
        role: 'user',
        parts: [{ text: userText }],
      });
      fewShotMessages.push({
        role: 'model',
        parts: [{ text: row.output }],
      });
    });

    fewShotMessages.push({
      role: 'user',
      parts: [{ text: `Input: ${structuredInput}` }],
    });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages: fewShotMessages,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Generation failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

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
              if (parsed.text) {
                accumulated += parsed.text;
                setStructuredOutput(accumulated);
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (err: any) {
      setStructuredOutput(`Error: ${err.message}`);
    } finally {
      setIsGeneratingStructured(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TableProperties className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Structured Prompt (Few-Shot Tabular Dataset)
            </h2>
            <p className="text-[10px] text-zinc-500">
              Provide input/output pairs to guide Gemini's pattern recognition through in-context few-shot learning
            </p>
          </div>
        </div>
        <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-mono">
          {structuredRows.length} few-shot examples
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Table of Examples */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-900/80 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3 w-1/3">Input Example</th>
                <th className="py-2.5 px-3 w-1/4">Context (Optional)</th>
                <th className="py-2.5 px-3">Expected Output</th>
                <th className="py-2.5 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {structuredRows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-zinc-900/40 transition">
                  <td className="py-2.5 px-3 text-zinc-500 font-mono text-[10px]">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <textarea
                      value={row.input}
                      onChange={(e) => updateStructuredRow(row.id, { input: e.target.value })}
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <textarea
                      value={row.context || ''}
                      onChange={(e) => updateStructuredRow(row.id, { context: e.target.value })}
                      rows={2}
                      placeholder="(none)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <textarea
                      value={row.output}
                      onChange={(e) => updateStructuredRow(row.id, { output: e.target.value })}
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-zinc-700 resize-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => deleteStructuredRow(row.id)}
                      className="text-zinc-500 hover:text-red-400 transition"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Row Bar */}
          <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
            <input
              type="text"
              placeholder="New input example..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <input
              type="text"
              placeholder="Context (optional)..."
              value={contextVal}
              onChange={(e) => setContextVal(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <input
              type="text"
              placeholder="Expected target output..."
              value={outputVal}
              onChange={(e) => setOutputVal(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <button
              onClick={handleAddExample}
              className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-medium transition border border-zinc-700"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Example</span>
            </button>
          </div>
        </div>

        {/* Test Section */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Test Against Few-Shot Examples</span>
            </span>
            <button
              onClick={handleRunFewShot}
              disabled={isGeneratingStructured || !structuredInput.trim()}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-md text-xs font-semibold disabled:bg-zinc-800 transition"
            >
              {isGeneratingStructured ? (
                <>
                  <Square className="w-3.5 h-3.5 animate-pulse" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Test</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Test Input
              </label>
              <textarea
                value={structuredInput}
                onChange={(e) => setStructuredInput(e.target.value)}
                placeholder="Type test input to evaluate..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Generated Few-Shot Output
              </label>
              <div className="w-full min-h-[76px] bg-zinc-900 border border-zinc-800 rounded-md p-2 text-xs font-mono text-emerald-300 whitespace-pre-wrap select-text">
                {structuredOutput || (
                  <span className="text-zinc-600">Click 'Run Test' to see model generation...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
