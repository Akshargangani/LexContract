# ⚖️ LexiContract AI — Verified Legal Contract Intelligence

> **Enterprise Legal Contract Analysis Platform** built for high-stakes contract review, featuring real-time quote verification, interactive citation jump highlighting, semantic version comparison, OpenXML tracked-changes redlining, and autonomous agentic research.

---

## 🌟 Executive Overview & Key Highlights

LexiContract AI is built from the ground up to solve the most critical challenge in AI legal tech: **Hallucination Prevention and Verifiable Truth**.

When reviewing 100+ page contracts, an AI stating an obligation exists—or claiming a clause is absent—cannot be trusted without cryptographic-level citation proof. LexiContract AI enforces an independent verification engine: **every cited quote is cross-checked against the raw text layer before being marked as verified**.

### 🏆 Core Features Delivered (100% Complete)

| Feature | Category | Implementation Details |
| :--- | :--- | :--- |
| **Document Upload & Parsing** | Part A | Native support for `.pdf` and `.docx`. Real-time multi-step processing status. Gracefully detects scanned/empty documents. |
| **Streaming Chat & Abort** | Part A | Server-Sent Events (SSE) token streaming. Prominent **Stop Generating** button that preserves partial answers. |
| **Verified Quotes Engine** | Part A (Critical) | Independent token-level verification with whitespace, newline, and smart-quote normalization. Flags unverified quotes in red/amber. |
| **Large Documents (150+ pages)** | Part A | Sliding-window semantic retrieval with **transparent coverage tracking** (never claims absence without 100% scan). |
| **Citation Jump & Highlighting** | Part B | Clicking any verified quote badge scrolls the Document Viewer to the exact page and paragraph with a glowing pulse animation. |
| **Multi-Document Analysis** | Part B | Select multiple contracts (e.g. MSA + SOW); synthesizes comparative answers with document-tagged verified citations. |
| **Document Comparison (Diff)** | Part B | Semantic clause-level diff (not char diff). Categorizes changes into Critical, High, Medium, Low, and Editorial risk with substantive summaries. |
| **Tracked-Change Redlining** | Part C (Option 1) | Modifies `.docx` OpenXML directly (`<w:ins>` / `<w:del>`). Produces real Word files with native tracked changes you can accept/reject. |
| **Agentic Document Research** | Part C (Option 2) | Multi-round autonomous agent loop calling `search_document`, `get_section`, `list_clauses`, and `cross_reference` with live execution trace. |
| **PII Anonymization** | Bonus | Masks names, emails, phones, companies, and currencies (`[COMPANY_A]`) with a 100% reversible mapping table. |
| **Automated Clause Dashboard** | Bonus | Auto-extracts Termination, Limitation of Liability, Indemnity, Non-Compete, Governing Law, and rates risk exposure. |
| **Arabic Contract Support** | Bonus | Full Right-to-Left (RTL) layout support and Arabic contract text parsing. |
| **Zero-Config Demo Mode** | Resilience | Works 100% offline out-of-the-box with preloaded contracts or with custom OpenAI / Anthropic / Gemini API keys. |

---

## 🏗️ Architecture & Technical Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                         LexiContract AI Workspace                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│  Doc Library │            │  Doc Viewer  │            │  Chat Panel  │
│  & Ingestion │            │  (Citations) │            │  (Streaming) │
└──────┬───────┘            └──────┬───────┘            └──────┬───────┘
       │                           │                           │
       ▼                           ▼                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Core Processing Engines                       │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ 1. Quote Verifier        │ 2. Large Doc Indexer     │ 3. Agent Loop    │
│  - Token-level match     │  - Sliding window        │  - search_doc    │
│  - Whitespace normalizer │  - Semantic chunking     │  - get_section   │
│  - Cross-page resolver   │  - Coverage tracker      │  - list_clauses  │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ 4. OpenXML Redliner      │ 5. Clause Comparator     │ 6. Anonymizer    │
│  - <w:ins> / <w:del>     │  - Substantive diff      │  - PII masking   │
│  - Native Word revisions │  - Risk categorization   │  - Reversible map│
└──────────────────────────┴──────────────────────────┴──────────────────┘
```

---

## 🛠️ How to Run Locally

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 1. Installation
```bash
# Clone repository
git clone <your-repo-link>
cd hiring

# Install dependencies
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated End-to-End Verification Test Suite
```bash
npx tsx src/test/verify-all.ts
```
All 6 feature test suites will execute and log detailed verification diagnostics.

---

## 📝 Technical Report & Evaluation Notes

### 1. How Quote Verification Works, and Where It Could Fail
- **Algorithm**:
  1. The LLM output is parsed for citation tags (`[Quote: "..."]`, blockquotes `> "..."`, and quoted strings).
  2. The candidate quote and document text are normalized (smart quotes `“”‘’` to `""''`, em-dashes `—` to `-`, non-breaking spaces `\u00A0` to ` `, and multi-newlines to a single space).
  3. A two-stage scan is executed: (a) Exact normalized substring match within individual pages; (b) Sliding-window token match requiring $\ge 85\%$ ordered token agreement to accommodate OCR/hyphenation breaks.
  4. The engine locates the exact character start/end offsets and page number. It **never** trusts the page numbers reported by the LLM.
- **Where It Could Fail**:
  - **Aggressive Paraphrasing**: If an LLM restates an idea in completely different words without using the contract's actual phrases, the similarity drops below 85% and the quote is flagged as **Unverified**. This is intentional by design to protect legal accuracy.
  - **Complex Multi-Column Tables or OCR Artifacts**: Non-standard PDF tables where cell order is scrambled during text extraction can break contiguous sentence tokens.

### 2. How Large Documents (150+ Pages) are Handled
- **Chunking & Indexing**: Documents are split into semantic page-level and section-level sliding windows with overlap.
- **Hybrid Retrieval**: Top relevant sections are indexed based on keyword frequency, legal header boosting, and proximity.
- **Coverage Transparency**:
  - **Golden Rule**: If only 30 of 150 pages were indexed into the prompt context, the app displays an explicit coverage badge: `Coverage: 20% (30/150 pages scanned)`.
  - For negative proofs ("Does this contract have a non-compete clause anywhere?"), the system sweeps across all page chunks in a multi-pass reduce scan to guarantee 100% coverage before declaring absence.

### 3. Part C High-Difficulty Challenge: Tracked-Change Redlining & Agentic Research
- **We implemented BOTH options for complete rigor**:
  - **Option 1 (Tracked-Change Redlining)**: We parse the `.docx` OpenXML archive (`word/document.xml`) using `JSZip`, identify target paragraphs, and insert native `<w:ins>` and `<w:del>` XML tags with author timestamp metadata. When opened in Microsoft Word or LibreOffice, the file renders with interactive native revision bubbles that lawyers can accept or reject individually.
  - **Option 2 (Agentic Document Research)**: Instead of dumping raw text into a single prompt, the model is equipped with a real 4-tool execution loop (`search_document`, `get_section`, `list_clauses`, `cross_reference`). The UI streams an animated step-by-step reasoning trace with a hard iteration cap (max 6 rounds) and malformed parameter recovery.
- **Hardest Part**: Preserving 100% of OpenXML styles (fonts, numbering, table borders) when injecting tracked revisions across split run `<w:r>` tags in Microsoft Word.

### 4. What Would Be Built Next with More Time
- Integration with Vector Databases (pgvector / Pinecone) for multi-tenant 10,000+ contract enterprise repositories.
- Document-level OCR via Tesseract/AWS Textract for scanned physical contract PDFs.
- E-Signature integration (DocuSign / HelloSign API) for 1-click execution post-redline.

---

## 📄 License
MIT License. Built for Engineering Assignment evaluation.
