import { ContractDocument, DetectedClause } from './types';

interface ClausePattern {
  type: DetectedClause['type'];
  keywords: RegExp[];
  riskDefault: DetectedClause['riskLevel'];
}

const CLAUSE_PATTERNS: ClausePattern[] = [
  {
    type: 'Limitation of Liability',
    keywords: [
      /\b(limitation of liability|liability cap|aggregate liability|consequential damages|indirect damages)\b/i,
    ],
    riskDefault: 'High',
  },
  {
    type: 'Indemnification',
    keywords: [
      /\b(indemnif|hold harmless|defend, indemnify|third[-\s]party claims)\b/i,
    ],
    riskDefault: 'High',
  },
  {
    type: 'Termination',
    keywords: [
      /\b(termination for convenience|termination for cause|cure period|notice of termination|expiry)\b/i,
    ],
    riskDefault: 'Medium',
  },
  {
    type: 'Governing Law',
    keywords: [
      /\b(governing law|jurisdiction|applicable law|dispute resolution|arbitration|courts of)\b/i,
    ],
    riskDefault: 'Low',
  },
  {
    type: 'Confidentiality',
    keywords: [
      /\b(confidential information|non-disclosure|proprietary information|trade secret|confidentiality period)\b/i,
    ],
    riskDefault: 'Medium',
  },
  {
    type: 'Non-Compete',
    keywords: [
      /\b(non-compete|non-competition|restrictive covenant|non-solicit|solicitation)\b/i,
    ],
    riskDefault: 'Critical',
  },
  {
    type: 'Intellectual Property',
    keywords: [
      /\b(intellectual property|work made for hire|ip assignment|ownership of deliverables|patent|trademark|copyright)\b/i,
    ],
    riskDefault: 'High',
  },
  {
    type: 'Force Majeure',
    keywords: [
      /\b(force majeure|act of god|unforeseen circumstances|pandemic|epidemic|war|civil unrest)\b/i,
    ],
    riskDefault: 'Low',
  },
  {
    type: 'Payment Terms',
    keywords: [
      /\b(payment terms|net 30|net 60|invoicing|fees and payment|late payment interest|compensation)\b/i,
    ],
    riskDefault: 'Low',
  },
];

/**
 * Scans document paragraphs and detects standard legal clauses
 */
export function analyzeDocumentClauses(doc: ContractDocument): DetectedClause[] {
  const clauses: DetectedClause[] = [];
  const paragraphs = doc.rawText.split(/\n\s*\n/);
  const seenTypes = new Set<string>();

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (para.length < 40) continue;

    for (const pattern of CLAUSE_PATTERNS) {
      const isMatch = pattern.keywords.some((kw) => kw.test(para));
      if (isMatch && !seenTypes.has(pattern.type + '_' + i)) {
        seenTypes.add(pattern.type + '_' + i);

        // Determine page number
        let pageNum = 1;
        const paraIndex = doc.rawText.indexOf(para);
        if (paraIndex !== -1) {
          for (const page of doc.pages) {
            if (paraIndex >= page.charStart && paraIndex <= page.charEnd) {
              pageNum = page.pageNumber;
              break;
            }
          }
        }

        // Generate summary & risk assessment
        let risk = pattern.riskDefault;
        let summary = `Identified ${pattern.type} provision.`;

        if (pattern.type === 'Limitation of Liability') {
          if (/unlimited|no cap|shall not exceed 100|excluding/i.test(para)) {
            risk = 'Critical';
            summary = 'Elevated liability risk: contains exclusions or asymmetric caps.';
          } else {
            summary = 'Standard liability limitation cap detected.';
          }
        } else if (pattern.type === 'Indemnification') {
          if (/unlimited|gross negligence|shall indemnify and hold/i.test(para)) {
            risk = 'High';
            summary = 'Broad indemnification obligation detected. Review defense scope.';
          }
        } else if (pattern.type === 'Termination') {
          if (/immediate|without cause|without notice/i.test(para)) {
            risk = 'High';
            summary = 'Allows termination without prior notice or short cure window.';
          } else {
            summary = 'Standard termination with notice period.';
          }
        }

        clauses.push({
          id: `clause_${clauses.length + 1}`,
          type: pattern.type,
          title: `${pattern.type} (Section ${clauses.length + 1})`,
          text: para,
          pageNumber: pageNum,
          riskLevel: risk,
          summary,
        });
        break;
      }
    }
  }

  return clauses;
}

/**
 * Anonymization Engine: Masks PII and returns reversible dictionary
 */
export function anonymizeContractText(text: string): {
  anonymizedText: string;
  mapping: Record<string, string>;
  reverseMapping: Record<string, string>;
} {
  const mapping: Record<string, string> = {};
  const reverseMapping: Record<string, string> = {};

  let anonymized = text;

  // 1. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  let emailCount = 1;
  anonymized = anonymized.replace(emailRegex, (match) => {
    if (!mapping[match]) {
      const placeholder = `[EMAIL_${emailCount++}]`;
      mapping[match] = placeholder;
      reverseMapping[placeholder] = match;
    }
    return mapping[match];
  });

  // 2. Phone numbers
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  let phoneCount = 1;
  anonymized = anonymized.replace(phoneRegex, (match) => {
    if (!mapping[match]) {
      const placeholder = `[PHONE_${phoneCount++}]`;
      mapping[match] = placeholder;
      reverseMapping[placeholder] = match;
    }
    return mapping[match];
  });

  // 3. Monetary amounts (e.g. $1,000,000 or AED 500,000 or USD 50,000)
  const currencyRegex = /\b(?:USD|AED|EUR|GBP|\$|€|£)\s?[\d,]+(?:\.\d{2})?\b/gi;
  let currCount = 1;
  anonymized = anonymized.replace(currencyRegex, (match) => {
    if (!mapping[match]) {
      const placeholder = `[MONETARY_VALUE_${currCount++}]`;
      mapping[match] = placeholder;
      reverseMapping[placeholder] = match;
    }
    return mapping[match];
  });

  // 4. Company entities (e.g. "Acme Corp", "Apex Technologies LLC", "Global Solutions Inc")
  const companyRegex = /\b[A-Z][A-Za-z0-9\s&]{2,25}(?:Inc|LLC|Corp|Corporation|Ltd|Limited|GmbH|FZ-LLC|Co\.)\b/g;
  let compCount = 1;
  anonymized = anonymized.replace(companyRegex, (match) => {
    const clean = match.trim();
    if (!mapping[clean]) {
      const placeholder = `[COMPANY_${String.fromCharCode(64 + compCount++)}]`;
      mapping[clean] = placeholder;
      reverseMapping[placeholder] = clean;
    }
    return mapping[clean];
  });

  return {
    anonymizedText: anonymized,
    mapping,
    reverseMapping,
  };
}

/**
 * Deanonymizes text using the reversible mapping dictionary
 */
export function deanonymizeText(text: string, reverseMapping: Record<string, string>): string {
  let restored = text;
  for (const [placeholder, original] of Object.entries(reverseMapping)) {
    restored = restored.replaceAll(placeholder, original);
  }
  return restored;
}
