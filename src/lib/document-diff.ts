import * as diff from 'diff';
import { ContractDocument, ComparisonDiffItem, DocumentComparisonResult, ChangeSignificance } from './types';
import { normalizeText } from './quote-verifier';

/**
 * Splits document into logical semantic paragraphs/clauses
 */
function extractClauseBlocks(doc: ContractDocument): Array<{ title: string; text: string; pageNumber: number }> {
  const rawBlocks = doc.rawText.split(/\n\s*\n/).map((b) => b.trim()).filter((b) => b.length > 20);
  const blocks: Array<{ title: string; text: string; pageNumber: number }> = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const text = rawBlocks[i];
    // Check if starts with a section header or numbered item
    const headerMatch = text.match(/^(?:section|article|clause|\d+\.?\d*)\s*[:.\-\s]?\s*([^\n.]{3,50})/i);
    const title = headerMatch ? headerMatch[0].trim() : `Clause ${i + 1}`;

    let pageNum = 1;
    const idx = doc.rawText.indexOf(text);
    if (idx !== -1) {
      for (const p of doc.pages) {
        if (idx >= p.charStart && idx <= p.charEnd) {
          pageNum = p.pageNumber;
          break;
        }
      }
    }

    blocks.push({
      title,
      text,
      pageNumber: pageNum,
    });
  }

  return blocks;
}

/**
 * Calculates similarity between two strings (0.0 to 1.0)
 */
function calculateJaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean));
  const set2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean));
  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Classifies substantive legal significance of a modification
 */
function assessChangeSignificance(
  oldText: string,
  newText: string,
  title: string
): { significance: ChangeSignificance; summary: string; legalImpact: string } {
  const oldNorm = normalizeText(oldText).toLowerCase();
  const newNorm = normalizeText(newText).toLowerCase();

  // 1. Check for numbers / monetary amounts / dates changed
  const oldNumbers = oldText.match(/\b(?:\d+[\d,.]*|\$\d+|\bAED\s*\d+|\bEUR\s*\d+)\b/g) || [];
  const newNumbers = newText.match(/\b(?:\d+[\d,.]*|\$\d+|\bAED\s*\d+|\bEUR\s*\d+)\b/g) || [];
  const numbersChanged = JSON.stringify(oldNumbers) !== JSON.stringify(newNumbers);

  // 2. Check for liability / indemnification / non-compete keywords
  const isHighRiskClause = /liability|indemnif|non-compete|governing law|termination|warranty|ip\b|ownership/i.test(
    title + ' ' + oldText + ' ' + newText
  );

  // 3. Check for unilateral vs mutual shifts
  const shiftToUnilateral = /(solely|at its sole discretion|without liability|unlimited)/i.test(newText) && !/(solely|at its sole discretion)/i.test(oldText);
  const shiftToMutual = /mutual|either party|each party/i.test(newText) && !/mutual|either party/i.test(oldText);

  if (isHighRiskClause && (numbersChanged || shiftToUnilateral || /unlimited/i.test(newText))) {
    let summary = 'High-impact substantive alteration in core risk allocation.';
    if (numbersChanged) {
      summary = `Monetary/Numerical threshold altered from [${oldNumbers.join(', ')}] to [${newNumbers.join(', ')}].`;
    } else if (shiftToUnilateral) {
      summary = 'Clause shifted from standard terms to one-sided unilateral discretion.';
    }

    return {
      significance: 'Critical',
      summary,
      legalImpact: 'Significantly shifts financial exposure or contractual remedies. Requires mandatory executive legal review.',
    };
  }

  if (isHighRiskClause || numbersChanged || shiftToMutual) {
    let summary = 'Important operational or legal terms modified.';
    if (shiftToMutual) {
      summary = 'Clause broadened to be bilateral/mutual for both parties.';
    }
    return {
      significance: 'High',
      summary,
      legalImpact: 'Alters operational obligations, notice windows, or party rights.',
    };
  }

  // Calculate semantic distance
  const sim = calculateJaccardSimilarity(oldNorm, newNorm);
  if (sim < 0.6) {
    return {
      significance: 'Medium',
      summary: 'Paragraph rephrased with material text modifications.',
      legalImpact: 'Moderate legal significance. Review to ensure intent remains aligned.',
    };
  } else if (sim < 0.9) {
    return {
      significance: 'Low',
      summary: 'Minor wording adjustments or clarifications.',
      legalImpact: 'Low risk. Primarily structural refinements with consistent legal intent.',
    };
  } else {
    return {
      significance: 'Editorial',
      summary: 'Stylistic and punctuation refinements.',
      legalImpact: 'No substantive legal impact. Editorial clean-up.',
    };
  }
}

/**
 * Performs full clause-level semantic diff between two contract documents
 */
export function compareContracts(
  doc1: ContractDocument,
  doc2: ContractDocument
): DocumentComparisonResult {
  const blocks1 = extractClauseBlocks(doc1);
  const blocks2 = extractClauseBlocks(doc2);

  const diffItems: ComparisonDiffItem[] = [];
  const matchedDoc2Indices = new Set<number>();

  // Compare each block in doc1 against doc2
  for (const b1 of blocks1) {
    let bestMatchIdx = -1;
    let highestSim = 0;

    for (let j = 0; j < blocks2.length; j++) {
      if (matchedDoc2Indices.has(j)) continue;
      const b2 = blocks2[j];
      const sim = calculateJaccardSimilarity(b1.text, b2.text);

      if (sim > highestSim) {
        highestSim = sim;
        bestMatchIdx = j;
      }
    }

    if (bestMatchIdx !== -1 && highestSim >= 0.75) {
      // Unchanged or minor change
      matchedDoc2Indices.add(bestMatchIdx);
      const b2 = blocks2[bestMatchIdx];

      if (highestSim >= 0.98) {
        // Completely unchanged
        diffItems.push({
          id: `diff_${diffItems.length + 1}`,
          clauseTitle: b1.title,
          changeType: 'unchanged',
          doc1Text: b1.text,
          doc2Text: b2.text,
          doc1Page: b1.pageNumber,
          doc2Page: b2.pageNumber,
          significance: 'Editorial',
          substantiveSummary: 'Clause identical in both versions.',
          legalImpact: 'No changes detected.',
        });
      } else {
        // Modified
        const assessment = assessChangeSignificance(b1.text, b2.text, b1.title);
        diffItems.push({
          id: `diff_${diffItems.length + 1}`,
          clauseTitle: b1.title,
          changeType: 'modified',
          doc1Text: b1.text,
          doc2Text: b2.text,
          doc1Page: b1.pageNumber,
          doc2Page: b2.pageNumber,
          significance: assessment.significance,
          substantiveSummary: assessment.summary,
          legalImpact: assessment.legalImpact,
        });
      }
    } else if (bestMatchIdx !== -1 && highestSim >= 0.35) {
      // Substantially modified
      matchedDoc2Indices.add(bestMatchIdx);
      const b2 = blocks2[bestMatchIdx];
      const assessment = assessChangeSignificance(b1.text, b2.text, b1.title);

      diffItems.push({
        id: `diff_${diffItems.length + 1}`,
        clauseTitle: b1.title,
        changeType: 'modified',
        doc1Text: b1.text,
        doc2Text: b2.text,
        doc1Page: b1.pageNumber,
        doc2Page: b2.pageNumber,
        significance: assessment.significance,
        substantiveSummary: assessment.summary,
        legalImpact: assessment.legalImpact,
      });
    } else {
      // Removed from doc1
      diffItems.push({
        id: `diff_${diffItems.length + 1}`,
        clauseTitle: b1.title,
        changeType: 'removed',
        doc1Text: b1.text,
        doc1Page: b1.pageNumber,
        significance: /liability|indemnif|non-compete|termination/i.test(b1.text) ? 'Critical' : 'High',
        substantiveSummary: `Clause [${b1.title}] was deleted in Version 2.`,
        legalImpact: 'Eliminates protections or obligations established in Version 1.',
      });
    }
  }

  // Any unmatched blocks in doc2 are added clauses
  for (let j = 0; j < blocks2.length; j++) {
    if (!matchedDoc2Indices.has(j)) {
      const b2 = blocks2[j];
      diffItems.push({
        id: `diff_${diffItems.length + 1}`,
        clauseTitle: b2.title,
        changeType: 'added',
        doc2Text: b2.text,
        doc2Page: b2.pageNumber,
        significance: /liability|indemnif|non-compete|penalty|audit/i.test(b2.text) ? 'Critical' : 'Medium',
        substantiveSummary: `New clause [${b2.title}] introduced in Version 2.`,
        legalImpact: 'Adds new obligations or remedies not present in Version 1.',
      });
    }
  }

  // Calculate overall risk
  const criticalCount = diffItems.filter((d) => d.significance === 'Critical').length;
  const highCount = diffItems.filter((d) => d.significance === 'High').length;
  const removedCount = diffItems.filter((d) => d.changeType === 'removed').length;
  const addedCount = diffItems.filter((d) => d.changeType === 'added').length;

  let overallRiskChange: DocumentComparisonResult['overallRiskChange'] = 'Neutral';
  if (criticalCount > 0 || highCount > 2) {
    overallRiskChange = 'Increased';
  } else if (removedCount > addedCount) {
    overallRiskChange = 'Mixed';
  }

  const executiveSummary = `Comparison completed between [${doc1.name}] (v1) and [${doc2.name}] (v2). Detected ${diffItems.filter((d) => d.changeType !== 'unchanged').length} substantive clause changes: ${diffItems.filter((d) => d.changeType === 'added').length} added, ${diffItems.filter((d) => d.changeType === 'removed').length} deleted, and ${diffItems.filter((d) => d.changeType === 'modified').length} modified. Identified ${criticalCount} Critical and ${highCount} High-significance risk variances.`;

  return {
    doc1Id: doc1.id,
    doc2Id: doc2.id,
    doc1Name: doc1.name,
    doc2Name: doc2.name,
    executiveSummary,
    overallRiskChange,
    diffs: diffItems,
    timestamp: Date.now(),
  };
}
