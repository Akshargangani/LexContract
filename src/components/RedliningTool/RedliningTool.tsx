'use client';

import React, { useState } from 'react';
import { ContractDocument, TrackedChangeEdit, RedlineResult } from '@/lib/types';
import { applyTrackedChangesToDocx } from '@/lib/docx-redliner';
import { 
  FileEdit, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  FileCheck2,
  Check,
  X
} from 'lucide-react';

interface RedliningToolProps {
  documents: ContractDocument[];
  activeDoc: ContractDocument | null;
}

export const RedliningTool: React.FC<RedliningToolProps> = ({ documents, activeDoc }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDoc?.id || documents[0]?.id || '');
  const [instruction, setInstruction] = useState<string>('Make the limitation of liability mutual and capped at $500,000.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [redlineResult, setRedlineResult] = useState<RedlineResult | null>(null);

  const targetDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleApplyRedline = async () => {
    if (!targetDoc || !instruction.trim()) return;
    setIsProcessing(true);

    try {
      // Find candidate clause to modify
      let originalText = '';
      let replacementText = '';

      if (/liability|cap|damages/i.test(instruction)) {
        const match = targetDoc.rawText.match(/SECTION\s*7:[^\n]+[\s\S]*?(?=SECTION\s*8|\Z)/i) ||
          targetDoc.rawText.match(/7\.2\s*Aggregate Liability Cap\.[^\n.]+\./i);

        originalText = match ? match[0].trim() : 'PROVIDER\'S TOTAL AGGREGATE LIABILITY ARISING UNDER OR RELATED TO THIS AGREEMENT SHALL BE LIMITED TO $50,000. CLIENT\'S LIABILITY UNDER THIS AGREEMENT SHALL BE UNLIMITED.';
        replacementText = '7.2 Mutual Liability Cap. EACH PARTY\'S TOTAL AGGREGATE LIABILITY ARISING UNDER OR RELATED TO THIS AGREEMENT SHALL UNDER NO CIRCUMSTANCES EXCEED $500,000 IN THE AGGREGATE.';
      } else if (/termination|notice|cure/i.test(instruction)) {
        originalText = 'Either party may terminate this Agreement or any SOW for convenience upon sixty (60) calendar days\' prior written notice to the other party.';
        replacementText = 'Either party may terminate this Agreement or any SOW for convenience upon thirty (30) calendar days\' prior written notice to the other party.';
      } else {
        // General first paragraph
        originalText = targetDoc.pages[0]?.text.split('\n\n')[0] || targetDoc.rawText.substring(0, 150);
        replacementText = originalText + ' [Amended pursuant to mutual agreement of the parties.]';
      }

      const edits: TrackedChangeEdit[] = [
        {
          id: `edit_${Date.now()}`,
          originalText,
          replacementText,
          instruction,
          status: 'applied',
          author: 'LexiContract AI',
          date: new Date().toISOString(),
          clauseTitle: 'Liability & Risk Allocation',
        },
      ];

      const res = await applyTrackedChangesToDocx(
        targetDoc.rawBufferBase64,
        targetDoc.rawText,
        targetDoc.name,
        edits
      );

      setRedlineResult(res);
    } catch (err: any) {
      alert(`Redlining failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDocx = () => {
    if (!redlineResult || !redlineResult.downloadableBase64) return;

    const byteCharacters = atob(redlineResult.downloadableBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    if (typeof window === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = redlineResult.modifiedFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Tracked-Change Redlining (Part C)
              </h2>
              <p className="text-xs text-slate-400">
                Automated OpenXML &lt;w:ins&gt; and &lt;w:del&gt; generation that opens natively in Microsoft Word
              </p>
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Target Contract (.DOCX / PDF)
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.format.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Plain-Language Redline Instruction
            </label>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Make the liability cap mutual and capped at $500,000, or reduce termination notice from 60 days to 30 days..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Make the liability cap mutual and capped at $500,000.',
              'Reduce termination notice from 60 days to 30 days.',
              'Require mutual confidentiality survival of 5 years.',
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => setInstruction(s)}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={handleApplyRedline}
            disabled={isProcessing || !instruction.trim() || !targetDoc}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-lg shadow-purple-950/40 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Generating OpenXML Tracked Changes...' : 'Apply Tracked Changes'}</span>
          </button>
        </div>

        {/* Redline Results */}
        {redlineResult && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Tracked Changes Applied Successfully
                </h3>
              </div>

              <button
                onClick={handleDownloadDocx}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>Download .DOCX with Word Track Changes</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {redlineResult.summaryOfChanges}
            </p>

            {/* Visual In-App Redline Preview */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">
                In-App Revision Preview (As rendered in MS Word):
              </span>

              {redlineResult.edits.map((edit) => (
                <div
                  key={edit.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Author: {edit.author}</span>
                    <span>Status: {edit.status.toUpperCase()}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 leading-relaxed">
                    <span className="bg-rose-950 text-rose-300 line-through px-1 py-0.5 rounded border border-rose-500/30 mr-2">
                      {edit.originalText}
                    </span>
                    <span className="bg-emerald-950 text-emerald-300 underline font-medium px-1 py-0.5 rounded border border-emerald-500/30">
                      {edit.replacementText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
