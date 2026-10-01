export type DocumentFormat = 'pdf' | 'docx';

export interface DocumentPage {
  pageNumber: number;
  text: string;
  charStart: number;
  charEnd: number;
}

export interface ContractDocument {
  id: string;
  name: string;
  size: number;
  format: DocumentFormat;
  uploadedAt: number;
  rawText: string;
  pages: DocumentPage[];
  pageCount: number;
  isScannedOrUnreadable?: boolean;
  htmlContent?: string;
  detectedClauses?: DetectedClause[];
  anonymizedText?: string;
  anonymizationMap?: Record<string, string>;
  rawBufferBase64?: string; // Stored for docx tracked changes manipulation
  isRTL?: boolean;
}

export interface DetectedClause {
  id: string;
  type: 'Termination' | 'Limitation of Liability' | 'Indemnification' | 'Governing Law' | 'Confidentiality' | 'Non-Compete' | 'Force Majeure' | 'Intellectual Property' | 'Payment Terms' | 'General';
  title: string;
  text: string;
  pageNumber: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
}

export interface QuoteVerificationResult {
  rawQuote: string;
  isVerified: boolean;
  documentId?: string;
  documentName?: string;
  pageNumber?: number;
  charStart?: number;
  charEnd?: number;
  matchedText?: string;
  confidence: number;
  contextSnippet?: string;
  unverifiedReason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  documentIds: string[];
  isStreaming?: boolean;
  isStopped?: boolean;
  quotes?: QuoteVerificationResult[];
  coveragePercent?: number;
  coverageNote?: string;
  agentTrace?: AgentTraceStep[];
}

export interface AgentTraceStep {
  id: string;
  stepNumber: number;
  actionType: 'thought' | 'tool_call' | 'tool_result' | 'final_answer';
  toolName?: 'search_document' | 'get_section' | 'list_clauses' | 'cross_reference';
  toolParams?: Record<string, any>;
  description: string;
  output?: string;
  timestamp: number;
}

export type ChangeSignificance = 'Critical' | 'High' | 'Medium' | 'Low' | 'Editorial';

export interface ComparisonDiffItem {
  id: string;
  clauseTitle: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  doc1Text?: string;
  doc2Text?: string;
  doc1Page?: number;
  doc2Page?: number;
  significance: ChangeSignificance;
  substantiveSummary: string;
  legalImpact: string;
}

export interface DocumentComparisonResult {
  doc1Id: string;
  doc2Id: string;
  doc1Name: string;
  doc2Name: string;
  executiveSummary: string;
  overallRiskChange: 'Increased' | 'Decreased' | 'Neutral' | 'Mixed';
  diffs: ComparisonDiffItem[];
  timestamp: number;
}

export interface TrackedChangeEdit {
  id: string;
  originalText: string;
  replacementText: string;
  instruction: string;
  status: 'applied' | 'pending' | 'rejected';
  clauseTitle?: string;
  author: string;
  date: string;
}

export interface RedlineResult {
  originalDocName: string;
  modifiedFileName: string;
  edits: TrackedChangeEdit[];
  downloadableBase64?: string;
  summaryOfChanges: string;
}

export interface LLMConfig {
  provider: 'mock' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}
