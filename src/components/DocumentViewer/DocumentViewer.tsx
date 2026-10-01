'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ContractDocument, QuoteVerificationResult } from '@/lib/types';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Bookmark, 
  Highlighter, 
  Layers, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { anonymizeContractText } from '@/lib/clause-analyzer';

interface DocumentViewerProps {
  document: ContractDocument | null;
  activeCitation: QuoteVerificationResult | null;
  onClearActiveCitation: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  activeCitation,
  onClearActiveCitation,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAnonymizedView, setIsAnonymizedView] = useState<boolean>(false);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const highlightTargetRef = useRef<HTMLSpanElement>(null);

  // When a citation is clicked from Chat, jump to its page and highlight
  useEffect(() => {
    if (activeCitation && activeCitation.isVerified) {
      if (activeCitation.pageNumber) {
        setCurrentPage(activeCitation.pageNumber);
      }
      setHighlightedText(activeCitation.matchedText || activeCitation.rawQuote);

      // Smooth scroll to highlight target
      setTimeout(() => {
        if (highlightTargetRef.current) {
          highlightTargetRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 150);
    }
  }, [activeCitation]);

  // Reset page when document changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setHighlightedText(null);
  }, [document?.id]);

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/30 text-slate-500">
        <FileText className="w-16 h-16 stroke-[1.2] mb-3 opacity-40 text-slate-400" />
        <h3 className="text-base font-semibold text-slate-300">No Document Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          Select a contract from the library on the left or upload a PDF/DOCX to view and interact with citations.
        </p>
      </div>
    );
  }

  const activePageObj = document.pages.find((p) => p.pageNumber === currentPage) || document.pages[0];
  const totalPages = document.pageCount || 1;

  // Process page text for rendering & highlighting
  let renderedText = activePageObj?.text || document.rawText;
  if (isAnonymizedView) {
    const anon = anonymizeContractText(renderedText);
    renderedText = anon.anonymizedText;
  }

  // Render text with highlight tags
  const renderFormattedPageText = () => {
    const target = (highlightedText || searchQuery).trim();

    if (!target) {
      return (
        <div className="space-y-4">
          {renderedText.split(/\n\s*\n/).map((para, idx) => (
            <p key={idx} className="leading-relaxed text-slate-200">
              {para}
            </p>
          ))}
        </div>
      );
    }

    const cleanTarget = target.toLowerCase().replace(/^[^\w\d]+|[^\w\d]+$/g, '');
    const paragraphs = renderedText.split(/\n\s*\n/);

    return (
      <div className="space-y-4">
        {paragraphs.map((para, pIdx) => {
          const lowerPara = para.toLowerCase();
          const matchIdx = lowerPara.indexOf(cleanTarget);

          if (matchIdx !== -1) {
            const before = para.substring(0, matchIdx);
            const match = para.substring(matchIdx, matchIdx + cleanTarget.length);
            const after = para.substring(matchIdx + cleanTarget.length);

            return (
              <p key={pIdx} className="leading-relaxed text-slate-200">
                {before}
                <span
                  ref={highlightTargetRef}
                  className="citation-highlight-pulse bg-amber-400/30 text-amber-200 font-semibold px-1 rounded inline-block"
                >
                  {match}
                </span>
                {after}
              </p>
            );
          }

          return (
            <p key={pIdx} className="leading-relaxed text-slate-200">
              {para}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 border-r border-slate-800/80">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1.5 rounded bg-slate-800 text-slate-300">
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-100 truncate" title={document.name}>
              {document.name}
            </h3>
            <span className="text-[10px] text-slate-400">
              {document.format.toUpperCase()} • {document.pages.length} Pages • {document.isRTL ? 'Arabic RTL' : 'Standard'}
            </span>
          </div>
        </div>

        {/* Page navigation & Search Controls */}
        <div className="flex items-center space-x-2">
          {/* Anonymize View Toggle */}
          <button
            onClick={() => setIsAnonymizedView(!isAnonymizedView)}
            title="Toggle PII Anonymization Masking"
            className={`flex items-center space-x-1 text-xs px-2 py-1 rounded border transition cursor-pointer ${
              isAnonymizedView
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isAnonymizedView ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isAnonymizedView ? 'PII Masked' : 'Original'}</span>
          </button>

          {/* Search inside doc */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search contract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-1 text-xs rounded-md bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 w-36"
            />
          </div>

          {/* Page Pagination */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-md px-1 py-0.5 text-xs text-slate-300">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Citation Notification Banner */}
      {activeCitation && activeCitation.isVerified && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">
              Jumped to verified passage on Page {activeCitation.pageNumber || currentPage}
            </span>
          </div>
          <button
            onClick={onClearActiveCitation}
            className="text-[11px] text-amber-400 underline hover:text-amber-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Contract Content Canvas */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto p-6 md:p-8 legal-contract ${
          document.isRTL ? 'rtl' : ''
        }`}
      >
        <div className="max-w-3xl mx-auto bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 shadow-xl shadow-black/40">
          <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between text-xs text-slate-400">
            <span>Page {currentPage} of {totalPages}</span>
            <span>{document.name}</span>
          </div>

          {renderFormattedPageText()}
        </div>
      </div>
    </div>
  );
};
