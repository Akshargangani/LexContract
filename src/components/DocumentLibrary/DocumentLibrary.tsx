'use client';

import React, { useState, useRef } from 'react';
import { ContractDocument } from '@/lib/types';
import { processUploadedFile } from '@/lib/text-extractor';
import { createSampleDocuments } from '@/lib/sample-contracts';
import { analyzeDocumentClauses } from '@/lib/clause-analyzer';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  Scale, 
  FileCheck, 
  ArrowRight,
  ShieldCheck,
  Languages
} from 'lucide-react';

interface DocumentLibraryProps {
  documents: ContractDocument[];
  selectedDocIds: string[];
  activeDocId: string | null;
  onSelectDocument: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  onAddDocuments: (docs: ContractDocument[]) => void;
  onDeleteDocument: (id: string) => void;
  onLoadSamples: () => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  selectedDocIds,
  activeDocId,
  onSelectDocument,
  onToggleMultiSelect,
  onAddDocuments,
  onDeleteDocument,
  onLoadSamples,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsProcessing(true);

    const newDocs: ContractDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext !== 'pdf' && ext !== 'docx') {
        setErrorMessage(`Invalid format: "${file.name}". Only .PDF and .DOCX contracts are supported.`);
        continue;
      }

      try {
        setProcessingStatus(`Extracting text & structure from ${file.name}...`);
        const doc = await processUploadedFile(file);

        setProcessingStatus(`Analyzing legal clauses and risk levels...`);
        doc.detectedClauses = analyzeDocumentClauses(doc);

        newDocs.push(doc);
      } catch (err: any) {
        setErrorMessage(`Failed to process "${file.name}": ${err.message || 'Unknown error'}`);
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');

    if (newDocs.length > 0) {
      onAddDocuments(newDocs);
      if (newDocs[0]) {
        onSelectDocument(newDocs[0].id);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-slate-800/80 w-80 lg:w-96 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide">Document Library</h2>
            <p className="text-xs text-slate-400">{documents.length} Contract(s) Indexed</p>
          </div>
        </div>

        <button
          onClick={onLoadSamples}
          title="Load Pre-loaded Sample Contracts"
          className="flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Samples</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700/70 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <div className="p-2.5 rounded-full bg-slate-800 text-indigo-400 mb-2">
          <UploadCloud className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-slate-200">
          Drop contracts here, or <span className="text-indigo-400 underline">browse</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-1">Accepts PDF &amp; DOCX up to 150+ pages</p>
      </div>

      {/* Processing Status Feedback */}
      {isProcessing && (
        <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center space-x-2 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span className="text-xs text-indigo-300">{processingStatus}</span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start space-x-2 text-rose-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-xs">{errorMessage}</span>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1">
        {documents.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-medium text-slate-300">No contracts uploaded yet</p>
            <p className="text-[11px] text-slate-500 mt-1">Upload a PDF or DOCX file or click &quot;Samples&quot; above to load sample legal contracts.</p>
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            const isActive = activeDocId === doc.id;

            return (
              <div
                key={doc.id}
                className={`relative group rounded-xl p-3 border transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
                onClick={() => onSelectDocument(doc.id)}
              >
                {/* Scanned PDF Warning Badge */}
                {doc.isScannedOrUnreadable && (
                  <div className="mb-2 p-1.5 rounded bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[10px] flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Scanned PDF: No selectable text layer found</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleMultiSelect(doc.id);
                      }}
                      title="Select for Multi-Document Query or Comparison"
                      className="mt-1 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          doc.format === 'pdf' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {doc.format}
                        </span>
                        {doc.isRTL && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center space-x-0.5">
                            <Languages className="w-2.5 h-2.5 mr-0.5" />
                            RTL
                          </span>
                        )}
                        <p className="text-xs font-medium text-slate-100 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                        <span>{doc.pageCount} page{doc.pageCount > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    title="Delete document"
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Detected Clauses Chips */}
                {doc.detectedClauses && doc.detectedClauses.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {doc.detectedClauses.slice(0, 3).map((cl) => (
                      <span
                        key={cl.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                          cl.riskLevel === 'Critical'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                            : cl.riskLevel === 'High'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {cl.type}
                      </span>
                    ))}
                    {doc.detectedClauses.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        +{doc.detectedClauses.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Multi-Document Selection Banner */}
      {selectedDocIds.length > 1 && (
        <div className="mt-3 p-2.5 rounded-lg bg-indigo-900/40 border border-indigo-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-indigo-300">
            <Layers className="w-4 h-4" />
            <span>{selectedDocIds.length} docs selected</span>
          </div>
          <span className="text-[10px] text-indigo-400 font-medium">Multi-Doc Query Active</span>
        </div>
      )}
    </div>
  );
};
