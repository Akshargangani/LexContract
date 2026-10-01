import * as mammoth from 'mammoth';
import { ContractDocument, DocumentFormat, DocumentPage } from './types';

/**
 * Detects if text is predominantly Arabic / Right-to-Left
 */
export function isArabicOrRTL(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const sample = text.substring(0, 1000);
  const arabicMatches = sample.match(arabicRegex) || [];
  return arabicMatches.length > sample.length * 0.15;
}

/**
 * Parses a DOCX ArrayBuffer into structured pages and HTML
 */
export async function extractDocxContent(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<ContractDocument> {
  // 1. Extract raw text
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = textResult.value.trim();

  // 2. Extract HTML representation for rich formatted rendering
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = htmlResult.value;

  // Check if unreadable or empty
  const isScannedOrUnreadable = rawText.length < 15;

  // Approximate pages (for DOCX, divide by ~350 words or logical heading breaks)
  const paragraphs = rawText.split(/\n\s*\n/);
  const pages: DocumentPage[] = [];

  let currentText = '';
  let currentPageNum = 1;
  let runningCharOffset = 0;
  const wordsPerPage = 350;

  for (const para of paragraphs) {
    currentText += para + '\n\n';
    const words = currentText.split(/\s+/).length;

    if (words >= wordsPerPage || para.match(/^(section|article|clause|schedule|\d+\.)/i)) {
      const charStart = runningCharOffset;
      const charEnd = runningCharOffset + currentText.length;
      pages.push({
        pageNumber: currentPageNum++,
        text: currentText.trim(),
        charStart,
        charEnd,
      });
      runningCharOffset = charEnd;
      currentText = '';
    }
  }

  if (currentText.trim().length > 0 || pages.length === 0) {
    pages.push({
      pageNumber: currentPageNum,
      text: currentText.trim() || rawText,
      charStart: runningCharOffset,
      charEnd: runningCharOffset + currentText.length,
    });
  }

  // Convert buffer to base64 for tracked-changes XML manipulation
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const rawBufferBase64 = btoa(binary);

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    size: fileSize,
    format: 'docx',
    uploadedAt: Date.now(),
    rawText,
    pages,
    pageCount: Math.max(1, pages.length),
    htmlContent,
    isScannedOrUnreadable,
    rawBufferBase64,
    isRTL: isArabicOrRTL(rawText),
  };
}

/**
 * Pure JavaScript PDF Stream Text Extractor
 * Extracts readable strings from PDF BT/ET text operators and /Page objects
 */
export async function extractPdfContent(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<ContractDocument> {
  const uint8 = new Uint8Array(arrayBuffer);
  let pdfString = '';
  
  // Convert binary to string safely in chunks
  const chunkSize = 65536;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    pdfString += String.fromCharCode.apply(
      null,
      Array.from(uint8.subarray(i, Math.min(i + chunkSize, uint8.length)))
    );
  }

  const pages: DocumentPage[] = [];
  let rawText = '';
  let isScannedOrUnreadable = false;

  try {
    // Extract text chunks from PDF operators (Tj, TJ, text inside parens)
    const textChunks: string[] = [];

    // Match TJ arrays: [(text1) 20 (text2)] TJ
    const tjArrayRegex = /\[((?:\([^)]*\)|-?\d+|[<\s\w>])+?)\]\s*TJ/g;
    let match: RegExpExecArray | null;

    while ((match = tjArrayRegex.exec(pdfString)) !== null) {
      const arrayContent = match[1];
      const stringMatches = arrayContent.match(/\(([^)]*)\)/g);
      if (stringMatches) {
        const extracted = stringMatches.map((s) => s.slice(1, -1)).join('');
        if (extracted.trim().length > 0) {
          textChunks.push(extracted);
        }
      }
    }

    // Match single Tj: (text) Tj
    const tjSingleRegex = /\(([^)]+)\)\s*Tj/g;
    while ((match = tjSingleRegex.exec(pdfString)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        textChunks.push(match[1]);
      }
    }

    if (textChunks.length === 0) {
      // Look for plain ASCII text blocks within the PDF stream
      const textMatches = pdfString.match(/BT[\s\S]*?ET/g);
      if (textMatches) {
        for (const block of textMatches) {
          const words = block.match(/\(([^)]+)\)/g);
          if (words) {
            textChunks.push(words.map((w) => w.slice(1, -1)).join(' '));
          }
        }
      }
    }

    const combinedText = textChunks.join(' ').replace(/\s+/g, ' ').trim();

    // Check if scanned / unreadable (< 30 characters of extracted text)
    if (combinedText.length < 30) {
      isScannedOrUnreadable = true;
    }

    // Divide into approximate pages
    const paragraphs = (combinedText.length > 0 ? combinedText : 'No digital text could be extracted from this PDF. It may be a scanned image.').split(/\.\s+/);
    let currentPageNum = 1;
    let runningCharOffset = 0;
    let currentText = '';

    for (let i = 0; i < paragraphs.length; i++) {
      currentText += (currentText ? '. ' : '') + paragraphs[i];
      if (currentText.split(/\s+/).length >= 350 || i === paragraphs.length - 1) {
        const charStart = runningCharOffset;
        const charEnd = runningCharOffset + currentText.length;
        pages.push({
          pageNumber: currentPageNum++,
          text: currentText.trim(),
          charStart,
          charEnd,
        });
        rawText += (rawText ? '\n\n' : '') + currentText.trim();
        runningCharOffset = charEnd;
        currentText = '';
      }
    }

    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        text: combinedText || 'Unreadable PDF',
        charStart: 0,
        charEnd: (combinedText || 'Unreadable PDF').length,
      });
      rawText = combinedText || 'Unreadable PDF';
    }
  } catch {
    isScannedOrUnreadable = true;
    pages.push({
      pageNumber: 1,
      text: 'Scanned document or unreadable text.',
      charStart: 0,
      charEnd: 36,
    });
    rawText = 'Scanned document or unreadable text.';
  }

  // Base64 storage
  let binary = '';
  for (let i = 0; i < Math.min(uint8.byteLength, 1000000); i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const rawBufferBase64 = btoa(binary);

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    size: fileSize,
    format: 'pdf',
    uploadedAt: Date.now(),
    rawText,
    pages,
    pageCount: Math.max(1, pages.length),
    isScannedOrUnreadable,
    rawBufferBase64,
    isRTL: isArabicOrRTL(rawText),
  };
}

/**
 * Universal file processor: accepts File object from browser input or drag-drop
 */
export async function processUploadedFile(file: File): Promise<ContractDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension !== 'pdf' && extension !== 'docx') {
    throw new Error(`Unsupported file type: .${extension}. Only PDF and DOCX documents are supported.`);
  }

  const arrayBuffer = await file.arrayBuffer();

  if (extension === 'pdf') {
    return await extractPdfContent(arrayBuffer, file.name, file.size);
  } else {
    return await extractDocxContent(arrayBuffer, file.name, file.size);
  }
}
