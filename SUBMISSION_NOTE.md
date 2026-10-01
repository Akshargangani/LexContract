# Engineering Assignment Submission Note

**Candidate Submission — Legal Contract Analysis Platform (LexiContract AI)**

---

### 1. How Quote Verification Works, and Where It Could Fail
Our quote verification engine is built to guarantee that no AI hallucination is ever presented as a genuine contractual excerpt.

- **How it Works**:
  1. **Extraction**: The assistant's streaming answer is continuously parsed for quotation markers (`[Quote: "..."]`, blockquotes `> "..."`, and quoted strings).
  2. **Normalization**: Both candidate quotes and the extracted document text undergo whitespace, line-break, and unicode normalization (e.g. converting smart quotes `“”‘’` to standard quotes, em-dashes `—` to hyphens `-`, collapsing multi-spaces `\s+` to single spaces, and removing soft hyphens).
  3. **Multi-Stage Resolution**:
     - *Stage A (Page-level Exact Substring)*: Searches each page's normalized text for an exact substring match.
     - *Stage B (Cross-Page Boundary Scan)*: Searches across the full document text stream to capture quotes spanning page breaks.
     - *Stage C (Sliding-Window Fuzzy Match)*: Uses a token-level sliding window requiring $\ge 85\%$ ordered token agreement to handle minor OCR/hyphenation anomalies.
  4. **Independent Offset Calculation**: The engine locates the character start/end positions and page number entirely independently—it **never** trusts page numbers or offsets provided by the LLM.
  5. **Status & Interactivity**: Verified quotes are badged in green (`✓ Verified Passage`) with a 1-click jump that scrolls the Document Viewer directly to the paragraph and applies a glowing gold highlight. Quotes that fail verification are marked in red/amber (`⚠ Unverified Quote`) with a clear warning that the AI may have paraphrased or invented the passage.

- **Where It Could Fail**:
  - **Extreme Semantic Paraphrasing**: If the LLM completely rewrites a clause in its own words rather than quoting the document, the token overlap falls below 85% and the engine flags it as unverified (by design, to protect legal rigor).
  - **Complex Non-Linear Layouts**: Multi-column PDF documents or nested tables where text extraction weaves between columns can disrupt contiguous sentence token ordering.

---

### 2. How Large Documents (150+ Pages) are Handled
A 150-page contract cannot fit into a standard single LLM context window without truncation. To solve this without false claims:

1. **Semantic Page & Section Chunking**: Documents are indexed with sliding windows that preserve section titles, clause headings (e.g., *Section 7: Limitation of Liability*), and page boundaries.
2. **Hybrid Retrieval**: Queries are scored against page chunks using BM25 token relevance combined with legal keyword boosting.
3. **Coverage Transparency (The Golden Rule)**:
   - If an answer is generated from a subset of pages, the app explicitly displays a **Coverage Indicator**: e.g., `Coverage: 28% (42/150 pages scanned based on query relevance)`.
   - The app will **never** claim a clause does not exist based on a partial read.
4. **Full Document Sweeps**: When a user asks a global negative query (*"Is there an exclusivity clause anywhere in this agreement?"*), the system runs a multi-stage map-reduce sweep across all 150 pages before confirming the absence of the clause.

---

### 3. Part C High-Difficulty Challenge: Approach & Hardest Part
We tackled **both Part C challenges** to deliver an uncompromising, enterprise-grade solution:

- **Option 1 (Tracked-Change Redlining)**:
  - We implemented an OpenXML manipulation engine that directly inspects and edits `word/document.xml` in `.docx` files using `JSZip`.
  - When a user asks for a revision (e.g., *"Make the liability cap mutual and capped at $500,000"*), the engine wraps the deleted text in `<w:del>` and the inserted text in `<w:ins>` with author and ISO timestamp attributes.
  - The downloaded `.docx` file opens natively in Microsoft Word and LibreOffice with interactive tracked-change revision balloons that users can accept or reject individually.
  - **Hardest Part**: Preserving 100% of formatting, paragraph styles (`<w:pStyle>`), and table structures without corrupting the Word XML DOM when replacement text spans multiple internal run (`<w:r>`) nodes.

- **Option 2 (Agentic Document Research)**:
  - We implemented an autonomous agent loop with 4 dedicated tools: `search_document(query)`, `get_section(pageNumber)`, `list_clauses()`, and `cross_reference(term)`.
  - The UI streams a real-time animated execution feed showing each tool call, parameters, and results with a hard 6-round iteration cap and robust error recovery for malformed tool parameters.

---

### 4. What Would Be Built Next with More Time
1. **Vector & Graph RAG**: Integrating hybrid Vector + Knowledge Graph indexing (Neo4j / pgvector) to map cross-references between definitions, schedules, and master agreements automatically.
2. **Physical Scan OCR Engine**: Integrating Tesseract.js / AWS Textract for scanned physical contract PDFs with bounding-box coordinate highlighting.
3. **Contract Playbook Automation**: User-defined organizational playbooks (e.g., *"Flag any indemnity clause that lacks a reciprocal defense obligation"*).
4. **E-Signature & Export**: Direct integration with DocuSign / Adobe Sign API to export redlined agreements directly to signing workflows.
