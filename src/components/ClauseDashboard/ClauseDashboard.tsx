'use client';

import React, { useState } from 'react';
import { ContractDocument, DetectedClause, QuoteVerificationResult } from '@/lib/types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  ExternalLink, 
  Filter,
  CheckCircle2
} from 'lucide-react';

interface ClauseDashboardProps {
  document: ContractDocument | null;
  onCitationClick: (citation: QuoteVerificationResult) => void;
}

export const ClauseDashboard: React.FC<ClauseDashboardProps> = ({
  document,
  onCitationClick,
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('All');

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/30 text-slate-500">
        <FileText className="w-16 h-16 stroke-[1.2] mb-3 opacity-40 text-slate-400" />
        <h3 className="text-base font-semibold text-slate-300">No Contract Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          Select a contract to review extracted legal clauses and risk ratings.
        </p>
      </div>
    );
  }

  const clauses = document.detectedClauses || [];
  const filteredClauses = clauses.filter((c) => {
    if (selectedRiskFilter === 'All') return true;
    return c.riskLevel === selectedRiskFilter;
  });

  const criticalCount = clauses.filter((c) => c.riskLevel === 'Critical').length;
  const highCount = clauses.filter((c) => c.riskLevel === 'High').length;
  const mediumCount = clauses.filter((c) => c.riskLevel === 'Medium').length;
  const lowCount = clauses.filter((c) => c.riskLevel === 'Low').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Automated Clause Extraction &amp; Risk Dashboard
              </h2>
              <p className="text-xs text-slate-400">
                Extracted provisions for &quot;{document.name}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Risk Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              Critical Risk
            </span>
            <span className="text-2xl font-bold">{criticalCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              High Risk
            </span>
            <span className="text-2xl font-bold">{highCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-yellow-950/30 border border-yellow-500/30 text-yellow-300">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              Medium Risk
            </span>
            <span className="text-2xl font-bold">{mediumCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              Low Risk
            </span>
            <span className="text-2xl font-bold">{lowCount}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 flex items-center space-x-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Risk:</span>
          </span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedRiskFilter(filter)}
              className={`text-xs px-3 py-1 rounded-lg border transition cursor-pointer ${
                selectedRiskFilter === filter
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Clauses List */}
        <div className="space-y-4">
          {filteredClauses.map((clause) => (
            <div
              key={clause.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-slate-100">{clause.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Page {clause.pageNumber}
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    clause.riskLevel === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : clause.riskLevel === 'High'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : clause.riskLevel === 'Medium'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {clause.riskLevel} Risk
                </span>
              </div>

              <p className="text-xs text-indigo-300 font-medium">
                💡 {clause.summary}
              </p>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-serif">
                &quot;{clause.text}&quot;
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() =>
                    onCitationClick({
                      rawQuote: clause.text,
                      isVerified: true,
                      pageNumber: clause.pageNumber,
                      documentId: document.id,
                      documentName: document.name,
                      confidence: 1.0,
                    })
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                >
                  <span>View in Document Viewer</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
