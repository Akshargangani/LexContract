import { ContractDocument, QuoteVerificationResult } from './types';

/**
 * Normalizes text for legal quote matching:
 * - Collapses consecutive whitespaces & newlines to a single space
 * - Normalizes smart quotes, apostrophes, and primes (“ ” ‘ ’ ` ' ")
 * - Normalizes various dash characters (— – − -)
 * - Normalizes non-breaking spaces and special unicode characters
 * - Strips trailing/leading punctuation if needed
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B`]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract quote candidate strings from an AI-generated assistant answer.
 * Looks for patterns like:
 * - [Quote: "..."]
 * - "..." (blockquotes or quoted phrases >= 15 chars)
 * - > "..."
 * - [Citation: "..."]
 * - [Doc: ..., Quote: "..."]
 */
export function extractQuoteCandidates(markdownText: string): string[] {
  const quotes: string[] = [];
  const seen = new Set<string>();

  const addUnique = (q: string) => {
    const clean = q.trim().replace(/^["']|["']$/g, '').trim();
    // Only verify substantial quotes (>= 12 characters and at least 3 words)
    if (clean.length >= 12 && clean.split(/\s+/).length >= 2 && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      quotes.push(clean);
    }
  };

  // 1. Match explicit [Quote: "..."] or [Doc: ..., "..." or Quote: "..."]
  const explicitQuoteRegex = /\[(?:Quote|Citation|Doc\s*[^\]]*?Quote|Doc\s*\d+[^\]]*?):\s*["“']([^"”']+)["”']\]/gi;
  let match: RegExpExecArray | null;
  while ((match = explicitQuoteRegex.exec(markdownText)) !== null) {
    if (match[1]) addUnique(match[1]);
  }

  // 2. Match markdown blockquotes: > "..."
  const blockquoteRegex = /(?:^|\n)>\s*["“']?([^"\n\r”]+)["”']?/g;
  while ((match = blockquoteRegex.exec(markdownText)) !== null) {
    if (match[1]) addUnique(match[1]);
  }

  // 3. Match quoted phrases in double or smart quotes
  const quotedPhraseRegex = /["“]([^"”\n\r]{15,400})["”]/g;
  while ((match = quotedPhraseRegex.exec(markdownText)) !== null) {
    if (match[1]) addUnique(match[1]);
  }

  return quotes;
}

/**
 * Tokenizes text into word tokens with original character offsets
 */
interface WordToken {
  word: string;
  normalized: string;
  charStart: number;
  charEnd: number;
}

function tokenizeWithOffsets(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const cleanWord = word.toLowerCase().replace(/^[^\w\d]+|[^\w\d]+$/g, '');
    if (cleanWord.length > 0) {
      tokens.push({
        word,
        normalized: cleanWord,
        charStart: match.index,
        charEnd: match.index + word.length,
      });
    }
  }
  return tokens;
}

/**
 * Verifies if a quote exists in a document, accounting for whitespace differences,
 * line breaks, formatting variations, and page splits.
 *
 * It NEVER trusts AI position/page numbers and performs independent text search.
 */
export function verifyQuoteAgainstDocument(
  rawQuote: string,
  document: ContractDocument
): QuoteVerificationResult {
  const normQuote = normalizeText(rawQuote);
  if (!normQuote || normQuote.length < 5) {
    return {
      rawQuote,
      isVerified: false,
      confidence: 0,
      unverifiedReason: 'Quote is too short or empty to verify reliably.',
    };
  }

  const quoteLower = normQuote.toLowerCase();
  const quoteTokens = tokenizeWithOffsets(rawQuote).map((t) => t.normalized);

  if (quoteTokens.length === 0) {
    return {
      rawQuote,
      isVerified: false,
      confidence: 0,
      unverifiedReason: 'No verifiable words found in quote.',
    };
  }

  // 1. Search page-by-page first for precise page resolution
  for (const page of document.pages) {
    const pageNorm = normalizeText(page.text);
    const pageLower = pageNorm.toLowerCase();

    // Exact normalized substring match on this page
    const foundIndex = pageLower.indexOf(quoteLower);
    if (foundIndex !== -1) {
      const charStart = foundIndex;
      const charEnd = foundIndex + normQuote.length;
      const snippetStart = Math.max(0, foundIndex - 60);
      const snippetEnd = Math.min(pageNorm.length, charEnd + 60);
      const contextSnippet = pageNorm.substring(snippetStart, snippetEnd);

      return {
        rawQuote,
        isVerified: true,
        documentId: document.id,
        documentName: document.name,
        pageNumber: page.pageNumber,
        charStart: page.charStart + charStart,
        charEnd: page.charStart + charEnd,
        matchedText: pageNorm.substring(charStart, charEnd),
        confidence: 1.0,
        contextSnippet: `...${contextSnippet}...`,
      };
    }
  }

  // 2. Search across the entire rawText (handles quotes spanning across page boundaries)
  const fullDocNorm = normalizeText(document.rawText);
  const fullDocLower = fullDocNorm.toLowerCase();
  const fullIndex = fullDocLower.indexOf(quoteLower);

  if (fullIndex !== -1) {
    // Determine which page this falls on
    const approxChar = fullIndex;
    let targetPage = document.pages[0]?.pageNumber || 1;
    for (const page of document.pages) {
      if (approxChar >= page.charStart && approxChar <= page.charEnd) {
        targetPage = page.pageNumber;
        break;
      }
    }

    const snippetStart = Math.max(0, fullIndex - 60);
    const snippetEnd = Math.min(fullDocNorm.length, fullIndex + normQuote.length + 60);

    return {
      rawQuote,
      isVerified: true,
      documentId: document.id,
      documentName: document.name,
      pageNumber: targetPage,
      charStart: fullIndex,
      charEnd: fullIndex + normQuote.length,
      matchedText: fullDocNorm.substring(fullIndex, fullIndex + normQuote.length),
      confidence: 0.98,
      contextSnippet: `...${fullDocNorm.substring(snippetStart, snippetEnd)}...`,
    };
  }

  // 3. Sliding Window Fuzzy / Token-level Match (Handles minor OCR/hyphenation anomalies)
  // Check if at least 85% of consecutive tokens match exactly
  for (const page of document.pages) {
    const pageTokens = tokenizeWithOffsets(page.text);
    if (pageTokens.length < quoteTokens.length) continue;

    const windowSize = quoteTokens.length;
    let bestMatchScore = 0;
    let bestMatchStart = -1;
    let bestMatchEnd = -1;

    for (let i = 0; i <= pageTokens.length - windowSize; i++) {
      let matchedCount = 0;
      for (let j = 0; j < windowSize; j++) {
        if (pageTokens[i + j].normalized === quoteTokens[j]) {
          matchedCount++;
        }
      }

      const score = matchedCount / windowSize;
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatchStart = pageTokens[i].charStart;
        bestMatchEnd = pageTokens[i + windowSize - 1].charEnd;
      }
    }

    // If 85%+ tokens match in order, accept as verified with high confidence
    if (bestMatchScore >= 0.85 && bestMatchStart !== -1) {
      const rawPageSnippet = page.text.substring(
        Math.max(0, bestMatchStart - 60),
        Math.min(page.text.length, bestMatchEnd + 60)
      );

      return {
        rawQuote,
        isVerified: true,
        documentId: document.id,
        documentName: document.name,
        pageNumber: page.pageNumber,
        charStart: page.charStart + bestMatchStart,
        charEnd: page.charStart + bestMatchEnd,
        matchedText: page.text.substring(bestMatchStart, bestMatchEnd),
        confidence: Number(bestMatchScore.toFixed(2)),
        contextSnippet: `...${rawPageSnippet.replace(/\s+/g, ' ').trim()}...`,
      };
    }
  }

  // Quote was not found in document
  return {
    rawQuote,
    isVerified: false,
    documentId: document.id,
    documentName: document.name,
    confidence: 0,
    unverifiedReason: 'Quote was not found in the document text. The AI may have paraphrased or invented this passage.',
  };
}

/**
 * Verify a list of quotes against one or multiple documents.
 */
export function verifyAllQuotes(
  quotes: string[],
  documents: ContractDocument[]
): QuoteVerificationResult[] {
  const results: QuoteVerificationResult[] = [];

  for (const quote of quotes) {
    let bestResult: QuoteVerificationResult | null = null;

    for (const doc of documents) {
      const res = verifyQuoteAgainstDocument(quote, doc);
      if (res.isVerified) {
        bestResult = res;
        break; // Found in this document!
      } else if (!bestResult || res.confidence > bestResult.confidence) {
        bestResult = res;
      }
    }

    if (bestResult) {
      results.push(bestResult);
    } else {
      results.push({
        rawQuote: quote,
        isVerified: false,
        confidence: 0,
        unverifiedReason: 'Quote not found in any selected documents.',
      });
    }
  }

  return results;
}
