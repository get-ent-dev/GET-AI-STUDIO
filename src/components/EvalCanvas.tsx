import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useStudioStore, EvalTestCase } from '../store/studioStore';

export const EvalCanvas: React.FC = () => {
  const {
    config,
    testCases,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    setTestCases,
    isRunningEvals,
    setIsRunningEvals,
  } = useStudioStore();

  const [newPrompt, setNewPrompt] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCase, setSelectedCase] = useState<EvalTestCase | null>(null);

  const handleAddNewCase = () => {
    if (!newPrompt.trim()) return;
    addTestCase({
      input: newPrompt.trim(),
      expectedKeyword: newKeyword.trim() || undefined,
    });
    setNewPrompt('');
    setNewKeyword('');
  };

  const handleRunAll = async () => {
    if (isRunningEvals || testCases.length === 0) return;
    setIsRunningEvals(true);

    try {
      const response = await fetch('/api/eval/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          testCases,
        }),
      });

      if (!response.ok) {
        throw new Error('Evaluation batch failed');
      }

      const data = await response.json();
      if (Array.isArray(data.results)) {
        setTestCases(data.results);
      }
    } catch (err: any) {
      alert(`Eval runner error: ${err.message}`);
    } finally {
      setIsRunningEvals(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(testCases, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `eval_results_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const completedCount = testCases.filter((tc) => tc.score !== undefined).length;
  const passCount = testCases.filter((tc) => tc.pass === true).length;
  const passRate = completedCount > 0 ? Math.round((passCount / completedCount) * 100) : 0;
  const avgLatency = completedCount > 0
    ? Math.round(testCases.reduce((acc, tc) => acc + (tc.durationMs || 0), 0) / completedCount)
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Prompt Evaluation Testbed (Eval Runner)
            </h2>
            <p className="text-[10px] text-zinc-500">
              Run regression benchmarks against model: <span className="text-zinc-300 font-mono">{config.model}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
          <div>
            <span className="text-zinc-500 text-[10px] block">Pass Rate</span>
            <span className={`font-mono font-bold ${passRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {completedCount > 0 ? `${passRate}%` : 'N/A'}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div>
            <span className="text-zinc-500 text-[10px] block">Avg Latency</span>
            <span className="font-mono font-bold text-zinc-200">
              {completedCount > 0 ? `${avgLatency}ms` : 'N/A'}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div>
            <span className="text-zinc-500 text-[10px] block">Evaluated</span>
            <span className="font-mono font-bold text-blue-400">
              {completedCount} / {testCases.length}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            disabled={completedCount === 0}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-2 rounded-lg text-xs border border-zinc-800 disabled:opacity-50 transition"
            title="Export evaluation results to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={isRunningEvals || testCases.length === 0}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-xs disabled:bg-zinc-800 disabled:text-zinc-500 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {isRunningEvals ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Running Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run All Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-900/80 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3">Test Input Prompt</th>
                <th className="py-2.5 px-3 w-48">Expected Keyword</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 w-20 text-center">Score</th>
                <th className="py-2.5 px-3 w-24 text-right">Latency</th>
                <th className="py-2.5 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {testCases.map((tc, idx) => (
                <tr key={tc.id} className="hover:bg-zinc-900/40 transition group">
                  <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-zinc-200">
                    <div>{tc.input}</div>
                    {tc.output && (
                      <div className="text-[10px] text-zinc-500 truncate max-w-md mt-0.5">
                        Output: {tc.output}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                    {tc.expectedKeyword ? (
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {tc.expectedKeyword}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {tc.score === undefined ? (
                      <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">
                        Pending
                      </span>
                    ) : tc.pass ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded font-medium">
                        <XCircle className="w-3 h-3" /> Fail
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {tc.score !== undefined ? (
                      <span className={tc.score >= 80 ? 'text-emerald-400' : 'text-red-400'}>
                        {tc.score}%
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-400 text-[11px]">
                    {tc.durationMs ? `${tc.durationMs}ms` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {tc.output && (
                        <button
                          onClick={() => setSelectedCase(tc)}
                          className="p-1 text-zinc-400 hover:text-blue-400 transition"
                          title="View output detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteTestCase(tc.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition"
                        title="Delete test case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Test Case Form */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Add new prompt test case (e.g. Translate 'Good morning' to Japanese)..."
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewCase()}
            className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
          <input
            type="text"
            placeholder="Expected keyword (optional)..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewCase()}
            className="w-full sm:w-60 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 font-mono"
          />
          <button
            onClick={handleAddNewCase}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-xs font-medium transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test</span>
          </button>
        </div>
      </div>

      {/* Detail Modal for Selected Test Case */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Test Case Result Inspection</span>
              </h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Input Prompt</div>
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-200">
                {selectedCase.input}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Generated Output</div>
              <div className="p-3 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-100 font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                {selectedCase.output || 'No output recorded'}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800 text-zinc-400">
              <div>Score: <strong className="text-zinc-200">{selectedCase.score}%</strong></div>
              <div>Notes: {selectedCase.notes || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
