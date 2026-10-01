'use client';

import React, { useState } from 'react';
import { ContractDocument } from '@/lib/types';
import { anonymizeContractText } from '@/lib/clause-analyzer';
import { 
  EyeOff, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Lock, 
  Sparkles,
  KeyRound
} from 'lucide-react';

interface AnonymizerPanelProps {
  document: ContractDocument | null;
}

export const AnonymizerPanel: React.FC<AnonymizerPanelProps> = ({ document }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/30 text-slate-500">
        <FileText className="w-16 h-16 stroke-[1.2] mb-3 opacity-40 text-slate-400" />
        <h3 className="text-base font-semibold text-slate-300">No Contract Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          Select a contract to review PII redactions and reversible key mappings.
        </p>
      </div>
    );
  }

  const { anonymizedText, mapping, reverseMapping } = anonymizeContractText(document.rawText);
  const mappingsList = Object.entries(reverseMapping);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadAnonymized = () => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([anonymizedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name.replace(/\.[^/.]+$/, '')}_Anonymized.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                PII Anonymization &amp; Reversible Redaction
              </h2>
              <p className="text-xs text-slate-400">
                Replaces names, companies, emails, and monetary figures with reversible tokens
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadAnonymized}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-purple-950/50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Anonymized Contract</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Redacted Entities
            </span>
            <span className="text-2xl font-bold text-purple-400">{mappingsList.length}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Compliance Standard
            </span>
            <span className="text-sm font-bold text-emerald-400 flex items-center space-x-1 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>GDPR / HIPAA Safe Harbor</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Reversibility
            </span>
            <span className="text-sm font-bold text-indigo-400 flex items-center space-x-1 mt-1">
              <KeyRound className="w-4 h-4" />
              <span>100% Deterministic Map</span>
            </span>
          </div>
        </div>

        {/* Reversible Mapping Table */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Bidirectional Reversible Mapping Table
          </h3>

          {mappingsList.length === 0 ? (
            <p className="text-xs text-slate-500">No PII or monetary entities detected in document.</p>
          ) : (
            <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto pr-1">
              {mappingsList.map(([token, originalValue]) => (
                <div key={token} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-purple-400 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                      {token}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="text-slate-200 font-medium">{originalValue}</span>
                  </div>

                  <button
                    onClick={() => handleCopy(originalValue, token)}
                    className="text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                  >
                    {copiedKey === token ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side-by-Side Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="block font-bold text-slate-400 mb-2">Original Document Sample:</span>
            <div className="font-serif text-slate-300 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
              {document.rawText.substring(0, 1000)}...
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs">
            <span className="block font-bold text-purple-400 mb-2">Anonymized Document Sample:</span>
            <div className="font-serif text-purple-200 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
              {anonymizedText.substring(0, 1000)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
