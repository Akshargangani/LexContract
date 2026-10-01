'use client';

import React, { useState } from 'react';
import { ContractDocument, DocumentComparisonResult, ChangeSignificance } from '@/lib/types';
import { compareContracts } from '@/lib/document-diff';
import { 
  GitCompare, 
  AlertTriangle, 
  CheckCircle2, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  ShieldAlert, 
  Filter, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface DocumentComparisonProps {
  documents: ContractDocument[];
}

export const DocumentComparison: React.FC<DocumentComparisonProps> = ({ documents }) => {
  const [doc1Id, setDoc1Id] = useState<string>(documents[0]?.id || '');
  const [doc2Id, setDoc2Id] = useState<string>(documents[1]?.id || documents[0]?.id || '');
  const [result, setResult] = useState<DocumentComparisonResult | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isComparing, setIsComparing] = useState(false);

  const doc1 = documents.find((d) => d.id === doc1Id);
  const doc2 = documents.find((d) => d.id === doc2Id);

  const handleRunComparison = () => {
    if (!doc1 || !doc2) return;
    setIsComparing(true);
    setTimeout(() => {
      const res = compareContracts(doc1, doc2);
      setResult(res);
      setIsComparing(false);
    }, 400);
  };

  const filteredDiffs = result?.diffs.filter((diff) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Changed Only') return diff.changeType !== 'unchanged';
    return diff.significance === selectedFilter;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 p-6 overflow-y-auto">
      {/* Header & Contract Selectors */}
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Contract Version Comparison</h2>
              <p className="text-xs text-slate-400">
                Substantive clause-level diff and legal impact analysis between two contracts
              </p>
            </div>
          </div>

          <button
            onClick={handleRunComparison}
            disabled={!doc1 || !doc2 || isComparing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-indigo-950/50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isComparing ? 'Comparing...' : 'Compare Contracts'}</span>
          </button>
        </div>

        {/* Contract Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doc 1 (Base Version) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Version 1 (Original Contract / Baseline)
            </label>
            <select
              value={doc1Id}
              onChange={(e) => setDoc1Id(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.pages.length} pages)
                </option>
              ))}
            </select>
          </div>

          {/* Doc 2 (Revised Version) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Version 2 (Revised Contract / Amendment)
            </label>
            <select
              value={doc2Id}
              onChange={(e) => setDoc2Id(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.pages.length} pages)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Executive Summary Card */}
        {result && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Executive Substantive Summary
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 ${
                  result.overallRiskChange === 'Increased'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                Risk Profile: {result.overallRiskChange}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">{result.executiveSummary}</p>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 flex items-center space-x-1 mr-2">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter by Significance:</span>
              </span>
              {['All', 'Changed Only', 'Critical', 'High', 'Medium', 'Low', 'Editorial'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    selectedFilter === filter
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clause Diff Items List */}
        {filteredDiffs && (
          <div className="space-y-4">
            {filteredDiffs.map((diff) => {
              const isAdded = diff.changeType === 'added';
              const isRemoved = diff.changeType === 'removed';
              const isModified = diff.changeType === 'modified';

              return (
                <div
                  key={diff.id}
                  className={`p-4 rounded-xl border transition ${
                    isAdded
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : isRemoved
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : isModified
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  {/* Diff Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {isAdded && <PlusCircle className="w-4 h-4 text-emerald-400" />}
                      {isRemoved && <MinusCircle className="w-4 h-4 text-rose-400" />}
                      {isModified && <RefreshCw className="w-4 h-4 text-amber-400" />}
                      <h4 className="text-xs font-bold text-slate-100">{diff.clauseTitle}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-300">
                        {diff.changeType}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        diff.significance === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : diff.significance === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : diff.significance === 'Medium'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {diff.significance} Risk
                    </span>
                  </div>

                  {/* Substantive Summary */}
                  <p className="text-xs text-indigo-300 font-medium mb-2">
                    ⚖️ {diff.substantiveSummary}
                  </p>
                  <p className="text-[11px] text-slate-400 mb-3">{diff.legalImpact}</p>

                  {/* Side-by-Side Clause Text Comparison */}
                  {isModified && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-200">
                        <span className="block text-[10px] font-bold text-rose-400 mb-1">
                          Original (v1):
                        </span>
                        <p className="text-[11px] leading-relaxed line-through opacity-80">
                          {diff.doc1Text}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-200">
                        <span className="block text-[10px] font-bold text-emerald-400 mb-1">
                          Revised (v2):
                        </span>
                        <p className="text-[11px] leading-relaxed">{diff.doc2Text}</p>
                      </div>
                    </div>
                  )}

                  {isAdded && diff.doc2Text && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 text-xs">
                      <span className="block text-[10px] font-bold text-emerald-400 mb-1">
                        New Added Clause:
                      </span>
                      <p className="text-[11px] leading-relaxed">{diff.doc2Text}</p>
                    </div>
                  )}

                  {isRemoved && diff.doc1Text && (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-200 text-xs">
                      <span className="block text-[10px] font-bold text-rose-400 mb-1">
                        Removed Clause:
                      </span>
                      <p className="text-[11px] leading-relaxed line-through opacity-80">
                        {diff.doc1Text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
