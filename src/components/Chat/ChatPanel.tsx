'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ContractDocument, ChatMessage, QuoteVerificationResult, LLMConfig } from '@/lib/types';
import { 
  Send, 
  Square, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Sparkles, 
  Bot, 
  User, 
  Layers, 
  BookOpen, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { extractQuoteCandidates, verifyAllQuotes } from '@/lib/quote-verifier';

interface ChatPanelProps {
  documents: ContractDocument[];
  selectedDocIds: string[];
  activeDoc: ContractDocument | null;
  onCitationClick: (citation: QuoteVerificationResult) => void;
  llmConfig: LLMConfig;
  onSwitchToAgentTab?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  documents,
  selectedDocIds,
  activeDoc,
  onCitationClick,
  llmConfig,
  onSwitchToAgentTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  // Target documents for current chat query
  const targetDocs = selectedDocIds.length > 0
    ? documents.filter((d) => selectedDocIds.includes(d.id))
    : activeDoc
    ? [activeDoc]
    : documents.slice(0, 1);

  // Initialize sample greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome_msg',
          role: 'assistant',
          content: `Hello! I am **LexiContract AI**, your verified legal contract assistant.

Upload or select any contract to begin. Ask questions such as:
- *"What are the limitation of liability provisions and aggregate caps?"*
- *"What are the notice requirements for termination for convenience?"*
- *"Compare indemnification obligations across selected contracts."*

**Strict Verification Guarantee**: Every answer is backed by exact quotes cross-verified against the document's raw text layer. Click any verified quote badge to jump directly to the passage.`,
          timestamp: Date.now(),
          documentIds: targetDocs.map((d) => d.id),
        },
      ]);
    }
  }, []);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle Speech-to-Text Voice Input
  const toggleVoiceRecording = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Stop Generation Handler
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    setMessages((prev) => {
      const updated = [...prev];
      const lastMsg = updated[updated.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.isStreaming = false;
        lastMsg.isStopped = true;

        // Perform verification on whatever partial text arrived
        const candidateQuotes = extractQuoteCandidates(lastMsg.content);
        lastMsg.quotes = verifyAllQuotes(candidateQuotes, targetDocs);
      }
      return updated;
    });
  };

  // Send Message Handler
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputValue).trim();
    if (!textToSend || isGenerating || targetDocs.length === 0) return;

    setInputValue('');
    setIsGenerating(true);

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      documentIds: targetDocs.map((d) => d.id),
    };

    const assistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      documentIds: targetDocs.map((d) => d.id),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          documents: targetDocs,
          config: llmConfig,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let coveragePercent = 100;
      let coverageNote = '';
      let verifiedQuotes: QuoteVerificationResult[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'coverage') {
                coveragePercent = data.coveragePercent;
                coverageNote = data.coverageNote;
              } else if (data.type === 'chunk') {
                accumulatedText += data.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  const idx = copy.findIndex((m) => m.id === assistantMessageId);
                  if (idx !== -1) {
                    copy[idx] = {
                      ...copy[idx],
                      content: accumulatedText,
                      coveragePercent,
                      coverageNote,
                    };
                  }
                  return copy;
                });
              } else if (data.type === 'verification') {
                verifiedQuotes = data.quotes;
              }
            } catch {}
          }
        }
      }

      // Final pass verification if not returned by server
      if (verifiedQuotes.length === 0) {
        const candidateQuotes = extractQuoteCandidates(accumulatedText);
        verifiedQuotes = verifyAllQuotes(candidateQuotes, targetDocs);
      }

      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.id === assistantMessageId);
        if (idx !== -1) {
          copy[idx] = {
            ...copy[idx],
            content: accumulatedText,
            isStreaming: false,
            quotes: verifiedQuotes,
            coveragePercent,
            coverageNote,
          };
        }
        return copy;
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Handled cleanly in handleStopGenerating
      } else {
        setMessages((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((m) => m.id === assistantMessageId);
          if (idx !== -1) {
            copy[idx] = {
              ...copy[idx],
              content: copy[idx].content + `\n\n*(Error during response: ${err.message || 'Connection lost'})*`,
              isStreaming: false,
            };
          }
          return copy;
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatToMarkdown = () => {
    const lines = messages.map((m) => {
      const author = m.role === 'user' ? '### User Question' : '### LexiContract AI Response';
      const quotesSection = m.quotes && m.quotes.length > 0
        ? `\n\n**Verified Citations:**\n` + m.quotes.map((q) => `- [${q.isVerified ? '✓ Verified' : '⚠ Unverified'}] Page ${q.pageNumber || 'N/A'}: "${q.rawQuote}"`).join('\n')
        : '';
      return `${author}\n${m.content}${quotesSection}\n\n---\n`;
    });

    if (typeof window === 'undefined') return;
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `Contract_Analysis_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/90">
      {/* Top Header & Coverage Banner */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-100">Contract Analysis Chat</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 mr-0.5" />
                Verified Quotes Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Querying {targetDocs.length} active contract{targetDocs.length > 1 ? 's' : ''}:{' '}
              <span className="text-slate-200 font-medium truncate inline-block max-w-[240px] align-bottom">
                {targetDocs.map((d) => d.name).join(', ')}
              </span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={exportChatToMarkdown}
            title="Export Q&A Report with Citations to Markdown"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 max-w-4xl mx-auto ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-indigo-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 rounded-2xl p-4 md:p-5 border transition shadow-lg ${
                  isUser
                    ? 'bg-indigo-950/60 border-indigo-700/60 text-slate-100'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200'
                }`}
              >
                {/* Large Document Coverage Indicator (if present) */}
                {!isUser && msg.coveragePercent !== undefined && (
                  <div className="mb-3 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{msg.coverageNote || `Indexed ${msg.coveragePercent}% of document`}</span>
                    </span>
                    <span className={`font-semibold ${msg.coveragePercent >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {msg.coveragePercent}% Coverage
                    </span>
                  </div>
                )}

                {/* Message Content */}
                <div className="prose prose-invert prose-sm max-w-none space-y-3 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* Stopped generation notice */}
                {msg.isStopped && (
                  <span className="inline-block mt-2 text-[11px] text-amber-400/80 italic">
                    ⏹ Generation stopped by user.
                  </span>
                )}

                {/* Verified Quotes Section (Critical Assignment Requirement) */}
                {!isUser && msg.quotes && msg.quotes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verified Contract Quotes ({msg.quotes.filter((q) => q.isVerified).length}/{msg.quotes.length} Found)</span>
                    </div>

                    <div className="space-y-2">
                      {msg.quotes.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          onClick={() => q.isVerified && onCitationClick(q)}
                          className={`p-2.5 rounded-lg border text-xs transition flex flex-col space-y-1 ${
                            q.isVerified
                              ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/70 hover:bg-emerald-950/40 cursor-pointer'
                              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              {q.isVerified ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-300 font-semibold">
                                    Verified Passage (Page {q.pageNumber || 1})
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                  <span className="text-rose-300 font-semibold">
                                    ⚠ Unverified / AI-Invented Quote
                                  </span>
                                </>
                              )}
                              {q.documentName && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                  {q.documentName}
                                </span>
                              )}
                            </div>

                            {q.isVerified && (
                              <span className="text-[10px] text-emerald-400 flex items-center space-x-0.5 hover:underline">
                                <span>Jump to page</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                              </span>
                            )}
                          </div>

                          <p className="text-slate-300 italic text-[11px] line-clamp-2">
                            &quot;{q.rawQuote}&quot;
                          </p>

                          {!q.isVerified && q.unverifiedReason && (
                            <p className="text-[10px] text-rose-400 font-medium">
                              {q.unverifiedReason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message footer with copy button */}
                <div className="mt-3 flex items-center justify-end space-x-2 text-xs text-slate-500">
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="flex items-center space-x-1 hover:text-slate-300 transition"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Legal Prompts */}
      {messages.length < 3 && (
        <div className="px-6 py-2 flex flex-wrap gap-2">
          {[
            'What is the aggregate liability cap?',
            'What are the termination for convenience terms?',
            'Who owns intellectual property and work product?',
            'Is there any non-compete clause in the contract?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar with Stop Button & Voice Dictation */}
      <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2 max-w-4xl mx-auto"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            title={isRecording ? 'Stop Recording' : 'Voice Input (Speech-to-Text)'}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={
                targetDocs.length > 0
                  ? `Ask questions about ${targetDocs.map((d) => d.name).join(', ')}...`
                  : 'Upload a contract to start asking questions...'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isGenerating || targetDocs.length === 0}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Send or Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStopGenerating}
              className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-rose-950/40 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim() || targetDocs.length === 0}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition shadow-lg shadow-indigo-950/40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
