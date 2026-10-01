'use client';

import React, { useState } from 'react';
import { ContractDocument, AgentTraceStep, QuoteVerificationResult } from '@/lib/types';
import { 
  Bot, 
  Search, 
  FileText, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Play, 
  Layers, 
  ShieldCheck, 
  Cpu,
  ArrowRight
} from 'lucide-react';

interface AgentTracePanelProps {
  documents: ContractDocument[];
  onCitationClick: (citation: QuoteVerificationResult) => void;
}

export const AgentTracePanel: React.FC<AgentTracePanelProps> = ({
  documents,
  onCitationClick,
}) => {
  const [question, setQuestion] = useState<string>('Search for all indemnification provisions and cross-reference gross negligence exceptions.');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [traceSteps, setTraceSteps] = useState<AgentTraceStep[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [verifiedQuotes, setVerifiedQuotes] = useState<QuoteVerificationResult[]>([]);

  const handleRunAgent = async () => {
    if (!question.trim() || isRunning || documents.length === 0) return;

    setIsRunning(true);
    setTraceSteps([]);
    setFinalAnswer(null);
    setVerifiedQuotes([]);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          documents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Agent execution failed');

      // Animate steps appearing one by one
      for (let i = 0; i < data.trace.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        setTraceSteps((prev) => [...prev, data.trace[i]]);
      }

      setFinalAnswer(data.finalAnswer);
      setVerifiedQuotes(data.quotes || []);
    } catch (err: any) {
      alert(`Agent failed: ${err.message || 'Error running agent'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Autonomous Agentic Document Research (Part C)
              </h2>
              <p className="text-xs text-slate-400">
                Multi-round autonomous tool-calling loop: search_document, get_section, list_clauses, cross_reference
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <label className="block text-xs font-semibold text-slate-300">
            Research Prompt / Multi-Clause Investigation Query
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Investigate whether there is an IP assignment clause and if moral rights are waived..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleRunAgent}
              disabled={isRunning || !question.trim() || documents.length === 0}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-blue-950/50 cursor-pointer"
            >
              {isRunning ? <Bot className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Agent Investigating...' : 'Launch Agent'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Search for all indemnification provisions and cross-reference gross negligence exceptions.',
              'Check for restrictive covenants, non-compete, or non-solicitation clauses.',
              'Verify governing law, jurisdiction, and arbitration venue across all contracts.',
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setQuestion(preset)}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Real-Time Agent Execution Trace */}
        {traceSteps.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Multi-Round Autonomous Agent Trace ({traceSteps.length} Rounds Executed)</span>
            </span>

            <div className="space-y-3">
              {traceSteps.map((step) => {
                const isThought = step.actionType === 'thought';
                const isToolCall = step.actionType === 'tool_call';
                const isToolResult = step.actionType === 'tool_result';

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-xl border text-xs transition space-y-2 ${
                      isThought
                        ? 'bg-purple-950/20 border-purple-500/30'
                        : isToolCall
                        ? 'bg-blue-950/20 border-blue-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-300">
                          {step.stepNumber}
                        </span>
                        <span className="font-bold text-slate-200 uppercase">
                          {isThought ? '🧠 Agent Reasoning' : isToolCall ? `⚡ Calling Tool: ${step.toolName}` : `📥 Tool Output: ${step.toolName}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed">{step.description}</p>

                    {step.toolParams && Object.keys(step.toolParams).length > 0 && (
                      <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-400">
                        Params: {JSON.stringify(step.toolParams)}
                      </div>
                    )}

                    {step.output && (
                      <pre className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-32">
                        {step.output}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Final Agent Answer & Verified Citations */}
        {finalAnswer && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Synthesized Research Findings:</span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap">
              {finalAnswer}
            </div>

            {verifiedQuotes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Quotes:</span>
                </div>
                <div className="space-y-2">
                  {verifiedQuotes.map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => onCitationClick(q)}
                      className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 cursor-pointer hover:bg-emerald-950/50 transition flex items-center justify-between"
                    >
                      <span>
                        ✓ Page {q.pageNumber || 1}: &quot;{q.rawQuote}&quot;
                      </span>
                      <span className="text-[10px] underline">Jump to document</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
