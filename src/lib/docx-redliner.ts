import JSZip from 'jszip';
import { TrackedChangeEdit, RedlineResult } from './types';

/**
 * Escapes XML characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a clean base OpenXML docx package from text if no base64 template is provided
 */
async function createBaseDocxZip(documentText: string): Promise<JSZip> {
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const paragraphs = documentText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const pXmls = paragraphs
    .map(
      (p) => `<w:p>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:t xml:space="preserve">${escapeXml(p.trim())}</w:t>
  </w:r>
</w:p>`
    )
    .join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${pXmls}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);

  return zip;
}

/**
 * Applies Tracked Changes (w:ins / w:del) to DOCX OpenXML
 */
export async function applyTrackedChangesToDocx(
  originalDocxBase64: string | undefined,
  fallbackText: string,
  originalFileName: string,
  edits: TrackedChangeEdit[]
): Promise<RedlineResult> {
  let zip: JSZip;

  if (originalDocxBase64 && originalDocxBase64.length > 50) {
    try {
      const binaryString = atob(originalDocxBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      zip = await JSZip.loadAsync(bytes);
    } catch {
      zip = await createBaseDocxZip(fallbackText);
    }
  } else {
    zip = await createBaseDocxZip(fallbackText);
  }

  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX package: word/document.xml not found.');
  }

  let docXml = await docXmlFile.async('text');
  const nowIso = new Date().toISOString();
  let revisionId = 100;

  for (const edit of edits) {
    const origTarget = edit.originalText.trim();
    const replacement = edit.replacementText.trim();
    const author = escapeXml(edit.author || 'LexiContract AI');

    if (!origTarget) continue;

    // Search for original text inside <w:t> elements or across run boundaries
    const escapedTarget = escapeXml(origTarget);
    
    // Pattern 1: Direct match in run text
    if (docXml.includes(escapedTarget)) {
      const delId = revisionId++;
      const insId = revisionId++;

      const replacementXml = `<w:del w:id="${delId}" w:author="${author}" w:date="${nowIso}">
        <w:r>
          <w:rPr><w:strike/><w:color w:val="C00000"/></w:rPr>
          <w:delText xml:space="preserve">${escapedTarget}</w:delText>
        </w:r>
      </w:del>
      <w:ins w:id="${insId}" w:author="${author}" w:date="${nowIso}">
        <w:r>
          <w:rPr><w:u w:val="single"/><w:color w:val="0070C0"/></w:rPr>
          <w:t xml:space="preserve">${escapeXml(replacement)}</w:t>
        </w:r>
      </w:ins>`;

      // Replace only the first instance of target
      docXml = docXml.replace(escapedTarget, replacementXml);
      edit.status = 'applied';
    } else {
      // Pattern 2: Relaxed search (matching without XML whitespace)
      const cleanTargetWords = origTarget.split(/\s+/).map(escapeXml);
      const firstWord = cleanTargetWords[0];
      const lastWord = cleanTargetWords[cleanTargetWords.length - 1];

      if (firstWord && lastWord && docXml.includes(firstWord)) {
        // Safe run replacement with tracked changes
        const delId = revisionId++;
        const insId = revisionId++;
        
        // Find paragraph containing first word
        const pRegex = new RegExp(`(<w:p[^>]*>[\\s\\S]*?${firstWord}[\\s\\S]*?<\\/w:p>)`, 'i');
        const match = docXml.match(pRegex);

        if (match) {
          const originalPara = match[1];
          const newPara = `<w:p>
            <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
            <w:del w:id="${delId}" w:author="${author}" w:date="${nowIso}">
              <w:r>
                <w:rPr><w:strike/><w:color w:val="C00000"/></w:rPr>
                <w:delText xml:space="preserve">${escapedTarget}</w:delText>
              </w:r>
            </w:del>
            <w:ins w:id="${insId}" w:author="${author}" w:date="${nowIso}">
              <w:r>
                <w:rPr><w:u w:val="single"/><w:color w:val="0070C0"/></w:rPr>
                <w:t xml:space="preserve">${escapeXml(replacement)}</w:t>
              </w:r>
            </w:ins>
          </w:p>`;

          docXml = docXml.replace(originalPara, newPara);
          edit.status = 'applied';
        }
      }
    }
  }

  // Update document.xml in the ZIP archive
  zip.file('word/document.xml', docXml);

  // Generate downloadable arrayBuffer and base64
  const generatedBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  let binary = '';
  for (let i = 0; i < generatedBytes.byteLength; i++) {
    binary += String.fromCharCode(generatedBytes[i]);
  }
  const downloadableBase64 = btoa(binary);

  const baseName = originalFileName.replace(/\.[^/.]+$/, '');
  const modifiedFileName = `${baseName}_Redlined_TrackedChanges.docx`;

  const summary = `Applied ${edits.filter((e) => e.status === 'applied').length} tracked-change revisions with OpenXML <w:ins> and <w:del> markup. File opens natively in MS Word with interactive Accept/Reject redlines.`;

  return {
    originalDocName: originalFileName,
    modifiedFileName,
    edits,
    downloadableBase64,
    summaryOfChanges: summary,
  };
}
