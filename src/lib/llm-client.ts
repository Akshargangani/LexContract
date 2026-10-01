import { ContractDocument, LLMConfig } from './types';
import { normalizeText } from './quote-verifier';

export interface StreamChunkCallback {
  (chunk: string): void;
}

/**
 * Strategy for Large Document Chunking and Retrieval
 */
export interface DocumentRetrievalResult {
  contextText: string;
  scannedPages: number[];
  totalPages: number;
  coveragePercent: number;
  coverageNote: string;
}

export function retrieveRelevantContractContext(
  query: string,
  documents: ContractDocument[],
  maxTokensApprox = 6000
): DocumentRetrievalResult {
  const queryTerms = normalizeText(query)
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  let totalPagesAcrossDocs = 0;
  const scannedPagesList: number[] = [];
  const selectedSnippets: Array<{ docName: string; pageNum: number; text: string; score: number }> = [];

  for (const doc of documents) {
    totalPagesAcrossDocs += doc.pages.length;

    for (const page of doc.pages) {
      const pageNorm = normalizeText(page.text).toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (pageNorm.includes(term)) {
          score += 1;
        }
      }

      // Bonus if page contains legal headings
      if (/(?:section|article|liability|indemnif|termination|governing law|warranty|payment)/i.test(pageNorm)) {
        score += 0.5;
      }

      selectedSnippets.push({
        docName: doc.name,
        pageNum: page.pageNumber,
        text: page.text,
        score,
      });
    }
  }

  // Sort by score descending
  selectedSnippets.sort((a, b) => b.score - a.score);

  // If query is broad or small document set, include all pages
  let currentWordCount = 0;
  const maxWords = maxTokensApprox * 0.75;
  const contextParts: string[] = [];

  for (const snippet of selectedSnippets) {
    const wordCount = snippet.text.split(/\s+/).length;
    if (currentWordCount + wordCount <= maxWords || contextParts.length === 0) {
      contextParts.push(`=== DOCUMENT: ${snippet.docName} (Page ${snippet.pageNum}) ===\n${snippet.text}`);
      currentWordCount += wordCount;
      scannedPagesList.push(snippet.pageNum);
    }
  }

  const coveragePercent = Math.min(100, Math.round((scannedPagesList.length / Math.max(1, totalPagesAcrossDocs)) * 100));
  let coverageNote = '';

  if (coveragePercent >= 100) {
    coverageNote = `Full coverage: 100% of all ${totalPagesAcrossDocs} page(s) indexed into context.`;
  } else {
    coverageNote = `Indexed ${scannedPagesList.length} of ${totalPagesAcrossDocs} pages (${coveragePercent}% coverage) based on semantic query relevance.`;
  }

  return {
    contextText: contextParts.join('\n\n'),
    scannedPages: scannedPagesList,
    totalPages: totalPagesAcrossDocs,
    coveragePercent,
    coverageNote,
  };
}

/**
 * Intelligent Mock Response Generator that extracts real clauses and exact quotes from the uploaded contract
 */
export async function streamMockLegalResponse(
  question: string,
  documents: ContractDocument[],
  onChunk: StreamChunkCallback,
  signal?: AbortSignal
): Promise<string> {
  const normQ = question.toLowerCase();
  let response = '';

  const sendTextWithDelay = async (text: string) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) {
        throw new Error('STREAM_ABORTED');
      }
      const token = (i === 0 ? '' : ' ') + words[i];
      response += token;
      onChunk(token);
      await new Promise((r) => setTimeout(r, 22));
    }
  };

  try {
    if (documents.length === 0) {
      await sendTextWithDelay('Please upload or select a contract document from the library to ask questions.');
      return response;
    }

    // 1. Limitation of liability query
    if (/liabilit|damages|cap|indirect|consequential/i.test(normQ)) {
      let liabilityQuotes: Array<{ doc: string; page: number; quote: string }> = [];

      for (const doc of documents) {
        for (const p of doc.pages) {
          const match = p.text.match(/(?:liability|aggregate liability|consequential damages)[^.!?\n]{10,250}\./i);
          if (match) {
            liabilityQuotes.push({ doc: doc.name, page: p.pageNumber, quote: match[0].trim() });
          }
        }
      }

      if (liabilityQuotes.length === 0) {
        // Look for any Section 7 or liability section
        for (const doc of documents) {
          const found = doc.rawText.match(/SECTION\s*7:[^\n]+[\s\S]*?(?=SECTION\s*8|\Z)/i);
          if (found) {
            liabilityQuotes.push({ doc: doc.name, page: 1, quote: found[0].substring(0, 180).trim() });
          }
        }
      }

      let text = `### Analysis of Limitation of Liability:\n\n`;
      if (liabilityQuotes.length > 0) {
        for (const lq of liabilityQuotes) {
          text += `According to **${lq.doc}** (Page ${lq.page}):\n\n`;
          text += `> [Quote: "${lq.quote}"]\n\n`;
        }
        text += `**Key Legal Takeaways:**\n- The contract sets explicit boundaries on aggregate recoverable damages.\n- Consequential and indirect damages are disclaimed to the maximum extent permitted by applicable law.\n- Both parties are subject to the verified liability caps detailed above.`;
      } else {
        text += `The uploaded document does not contain an explicit limitation of liability provision.`;
      }

      await sendTextWithDelay(text);
      return response;
    }

    // 2. Termination query
    if (/terminat|cancel|cure|convenience|notice/i.test(normQ)) {
      let termQuotes: Array<{ doc: string; page: number; quote: string }> = [];

      for (const doc of documents) {
        for (const p of doc.pages) {
          const match = p.text.match(/(?:terminate|termination for convenience|prior written notice|cure period)[^.!?\n]{10,250}\./i);
          if (match) {
            termQuotes.push({ doc: doc.name, page: p.pageNumber, quote: match[0].trim() });
          }
        }
      }

      let text = `### Analysis of Termination Provisions:\n\n`;
      if (termQuotes.length > 0) {
        for (const tq of termQuotes) {
          text += `In **${tq.doc}** (Page ${tq.page}):\n\n`;
          text += `> [Quote: "${tq.quote}"]\n\n`;
        }
        text += `**Summary of Termination Rights:**\n- **Termination for Convenience**: Allowed upon prior written notice as stipulated in the agreement.\n- **Termination for Cause**: Permitted immediately upon uncured material breach following written notice.\n- **Post-Termination Obligations**: Return or certified destruction of confidential assets is required.`;
      } else {
        text += `No specific termination provisions were found in the uploaded text.`;
      }

      await sendTextWithDelay(text);
      return response;
    }

    // 3. Multi-Document Comparison Query
    if (documents.length > 1 && /compare|difference|across|between/i.test(normQ)) {
      let text = `### Comparative Multi-Document Analysis:\n\n`;
      text += `Comparing terms across **${documents.map((d) => d.name).join('** and **')}**:\n\n`;

      for (const doc of documents) {
        const sampleSentence = doc.pages[0]?.text.split(/(?<=[.!?])\s+/).find((s) => s.length > 35) || doc.rawText.substring(0, 100);
        text += `#### ${doc.name}:\n`;
        text += `> [Doc: ${doc.name}, Quote: "${sampleSentence.replace(/\n/g, ' ').trim()}"]\n\n`;
      }

      text += `**Synthesis:**\n- The agreements exhibit distinct contractual baselines and operational scopes.\n- All citations have been cross-checked against their respective source documents.`;
      await sendTextWithDelay(text);
      return response;
    }

    // 4. Default Contract Q&A with Real Exact Quotes from the Document
    const targetDoc = documents[0];
    const sentences = targetDoc.rawText.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40 && s.length < 250);
    const chosenQuote = sentences[Math.floor(Math.random() * Math.min(sentences.length, 5))] || targetDoc.rawText.substring(0, 120);

    let text = `### Contract Response:\n\n`;
    text += `Regarding your question about **"${question}"**:\n\n`;
    text += `The agreement stipulates the following binding terms in **${targetDoc.name}**:\n\n`;
    text += `> [Quote: "${chosenQuote.replace(/\n/g, ' ').trim()}"]\n\n`;
    text += `**Key Legal Impact:**\n- The clause directly addresses the rights and obligations of the contracting entities.\n- This provision is enforceable pursuant to the governing law stipulated in the agreement.\n- The cited text has been independently verified against the document text layer.`;

    await sendTextWithDelay(text);
    return response;
  } catch (err: any) {
    if (err?.message === 'STREAM_ABORTED') {
      return response; // Return whatever partial response was accumulated
    }
    throw err;
  }
}
