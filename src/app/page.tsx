'use client';

import React, { useState, useEffect } from 'react';
import { ContractDocument, QuoteVerificationResult, LLMConfig } from '@/lib/types';
import { createSampleDocuments } from '@/lib/sample-contracts';
import { DocumentLibrary } from '@/components/DocumentLibrary/DocumentLibrary';
import { DocumentViewer } from '@/components/DocumentViewer/DocumentViewer';
import { ChatPanel } from '@/components/Chat/ChatPanel';
import { DocumentComparison } from '@/components/DocumentComparison/DocumentComparison';
import { RedliningTool } from '@/components/RedliningTool/RedliningTool';
import { AgentTracePanel } from '@/components/AgentTrace/AgentTracePanel';
import { ClauseDashboard } from '@/components/ClauseDashboard/ClauseDashboard';
import { AnonymizerPanel } from '@/components/Anonymizer/AnonymizerPanel';
import { SettingsModal } from '@/components/Modals/SettingsModal';

import { 
  Scale, 
  MessageSquareText, 
  GitCompare, 
  FileEdit, 
  Cpu, 
  ShieldCheck, 
  EyeOff, 
  Settings, 
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Home() {
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeCitation, setActiveCitation] = useState<QuoteVerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'compare' | 'redline' | 'agent' | 'clauses' | 'anonymize'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'mock',
    model: 'gpt-4o-mini',
  });

  // Pre-load realistic sample contracts on first mount
  useEffect(() => {
    const samples = createSampleDocuments();
    setDocuments(samples);
    if (samples.length > 0) {
      setActiveDocId(samples[0].id);
      setSelectedDocIds([samples[0].id]);
    }
  }, []);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0] || null;

  const handleSelectDocument = (id: string) => {
    setActiveDocId(id);
    if (!selectedDocIds.includes(id)) {
      setSelectedDocIds([id]);
    }
  };

  const handleToggleMultiSelect = (id: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        return next.length > 0 ? next : prev; // keep at least 1
      } else {
        return [...prev, id];
      }
    });
  };

  const handleAddDocuments = (newDocs: ContractDocument[]) => {
    setDocuments((prev) => [...newDocs, ...prev]);
    if (newDocs[0]) {
      setActiveDocId(newDocs[0].id);
      setSelectedDocIds([newDocs[0].id]);
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((item) => item !== id));
    if (activeDocId === id) {
      const remaining = documents.filter((d) => d.id !== id);
      setActiveDocId(remaining[0]?.id || null);
    }
  };

  const handleLoadSamples = () => {
    const samples = createSampleDocuments();
    setDocuments(samples);
    setActiveDocId(samples[0].id);
    setSelectedDocIds([samples[0].id]);
  };

  const handleCitationClick = (citation: QuoteVerificationResult) => {
    if (citation.documentId) {
      setActiveDocId(citation.documentId);
    }
    setActiveCitation(citation);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100">
      {/* Top Main Navigation Header */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Document Library Sidebar"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-tight text-white">LexiContract</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  AI Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Workspace Tabs */}
        <div className="hidden md:flex items-center space-x-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Chat &amp; Citations</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              activeTab === 'compare'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Comparison (Part B)</span>
          </button>

          <button
            onClick={() => setActiveTab('redline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              activeTab === 'redline'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Redlining (Part C)</span>
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              activeTab === 'agent'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agentic Research (Part C)</span>
          </button>

          <button
            onClick={() => setActiveTab('clauses')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              activeTab === 'clauses'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clauses</span>
          </button>

          <button
            onClick={() => setActiveTab('anonymize')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              activeTab === 'anonymize'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Anonymizer</span>
          </button>
        </div>

        {/* Right Settings & Action Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Document Library */}
        {isSidebarOpen && (
          <DocumentLibrary
            documents={documents}
            selectedDocIds={selectedDocIds}
            activeDocId={activeDocId}
            onSelectDocument={handleSelectDocument}
            onToggleMultiSelect={handleToggleMultiSelect}
            onAddDocuments={handleAddDocuments}
            onDeleteDocument={handleDeleteDocument}
            onLoadSamples={handleLoadSamples}
          />
        )}

        {/* Center/Right Dynamic View Based on Active Tab */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden">
              {/* Interactive Document Viewer (Left Side of Split) */}
              <div className="hidden lg:flex flex-1 h-full overflow-hidden">
                <DocumentViewer
                  document={activeDoc}
                  activeCitation={activeCitation}
                  onClearActiveCitation={() => setActiveCitation(null)}
                />
              </div>

              {/* Conversational AI Chat Panel (Right Side of Split) */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <ChatPanel
                  documents={documents}
                  selectedDocIds={selectedDocIds}
                  activeDoc={activeDoc}
                  onCitationClick={handleCitationClick}
                  llmConfig={llmConfig}
                  onSwitchToAgentTab={() => setActiveTab('agent')}
                />
              </div>
            </div>
          )}

          {activeTab === 'compare' && <DocumentComparison documents={documents} />}

          {activeTab === 'redline' && (
            <RedliningTool documents={documents} activeDoc={activeDoc} />
          )}

          {activeTab === 'agent' && (
            <AgentTracePanel
              documents={documents}
              onCitationClick={handleCitationClick}
            />
          )}

          {activeTab === 'clauses' && (
            <ClauseDashboard
              document={activeDoc}
              onCitationClick={handleCitationClick}
            />
          )}

          {activeTab === 'anonymize' && <AnonymizerPanel document={activeDoc} />}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onSaveConfig={(cfg) => setLlmConfig(cfg)}
      />
    </div>
  );
}
