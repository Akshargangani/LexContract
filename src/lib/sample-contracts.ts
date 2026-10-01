import { ContractDocument } from './types';
import { analyzeDocumentClauses } from './clause-analyzer';

export const SAMPLE_MSA_V1_TEXT = `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is made and entered into as of January 15, 2024 ("Effective Date"), by and between Acme Enterprise Solutions Inc., a Delaware corporation having its principal place of business at 100 Innovation Way, Wilmington, DE ("Client"), and Apex Cloud Technologies LLC, a California limited liability company having its principal place of business at 500 Silicon Vista, San Francisco, CA ("Provider").

RECITALS
WHEREAS, Provider possesses expertise in enterprise cloud infrastructure, software architecture, and managed IT services; and
WHEREAS, Client desires to retain Provider to perform professional engineering and consulting services as described in Statements of Work executed hereunder.

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

SECTION 1: SERVICES AND STATEMENTS OF WORK
1.1 Statements of Work. Provider shall provide the consulting, software engineering, and managed cloud services ("Services") specified in one or more Statements of Work ("SOW") executed by authorized representatives of both parties.
1.2 Performance Standards. Provider warrants that all Services shall be performed in a professional, diligent, and workmanlike manner in accordance with prevailing industry standards.
1.3 Acceptance. Client shall have thirty (30) business days following delivery of any milestone to review and evaluate deliverables. If no written rejection specifying deficiencies is delivered within said period, the deliverables shall be deemed accepted.

SECTION 2: COMPENSATION AND PAYMENT TERMS
2.1 Invoicing and Payment. Invoices shall be issued monthly in arrears. Client shall pay all undisputed invoice amounts within thirty (30) calendar days from receipt of invoice ("Net 30").
2.2 Late Payments. Undisputed amounts overdue by more than fifteen (15) days shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by law.
2.3 Taxes. Fees are exclusive of all applicable federal, state, local, sales, and value-added taxes, which shall be the sole responsibility of Client.

SECTION 3: CONFIDENTIALITY AND PROPRIETARY INFORMATION
3.1 Definition. "Confidential Information" means all non-public, proprietary information disclosed by either party ("Disclosing Party") to the other party ("Receiving Party"), whether orally, visually, or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.
3.2 Exclusions. Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was already known to Receiving Party prior to disclosure without confidentiality obligations; (c) is independently developed without reference to Disclosing Party's Confidential Information.
3.3 Protection Obligations. Receiving Party shall hold Confidential Information in strict confidence and exercise at least the degree of care it uses for its own confidential data, but no less than reasonable care. Obligations shall survive for a period of three (3) years following termination.

SECTION 4: INTELLECTUAL PROPERTY RIGHTS
4.1 Client IP. Client retains sole ownership of all pre-existing data, trademarks, customer information, and proprietary software provided to Provider.
4.2 Work Product. Upon full payment of all applicable fees, all custom software, scripts, and documentation developed specifically for Client under an SOW ("Deliverables") shall constitute "work made for hire" and belong exclusively to Client.
4.3 Provider Pre-existing IP. Provider retains exclusive ownership of all reusable frameworks, toolkits, generic code libraries, and background know-how.

SECTION 5: WARRANTIES AND DISCLAIMERS
5.1 Mutual Warranties. Each party represents and warrants that it has full power and authority to enter into this Agreement and that its execution does not violate any third-party agreements.
5.2 Service Warranty. Provider warrants that Services will conform materially to the specifications in the applicable SOW for ninety (90) days following acceptance.
5.3 Disclaimer. EXCEPT AS EXPRESSLY SET FORTH HEREIN, NEITHER PARTY MAKES ANY OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.

SECTION 6: INDEMNIFICATION
6.1 Provider Indemnity. Provider shall defend, indemnify, and hold harmless Client, its officers, directors, and employees from and against any third-party claims, damages, liabilities, and expenses (including reasonable attorneys' fees) arising out of or resulting from an allegation that the Deliverables infringe any valid United States patent, copyright, or trademark.
6.2 Client Indemnity. Client shall defend, indemnify, and hold harmless Provider from third-party claims arising from Client's misuse of deliverables or breach of applicable data privacy laws.
6.3 Indemnification Procedure. The indemnified party must give prompt written notice of any claim, allow the indemnifying party sole control of defense and settlement, and provide reasonable cooperation.

SECTION 7: LIMITATION OF LIABILITY
7.1 Consequential Damages Waiver. TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR REVENUE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
7.2 Aggregate Liability Cap. EXCEPT FOR INDEMNIFICATION OBLIGATIONS UNDER SECTION 6 AND BREACHES OF CONFIDENTIALITY UNDER SECTION 3, EACH PARTY'S TOTAL AGGREGATE LIABILITY ARISING UNDER OR RELATED TO THIS AGREEMENT SHALL BE LIMITED TO THE TOTAL FEES PAID OR PAYABLE BY CLIENT UNDER THE APPLICABLE SOW IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

SECTION 8: TERM AND TERMINATION
8.1 Term. This Agreement commences on the Effective Date and shall remain in effect for three (3) years unless earlier terminated in accordance with this Section.
8.2 Termination for Convenience. Either party may terminate this Agreement or any SOW for convenience upon sixty (60) calendar days' prior written notice to the other party.
8.3 Termination for Cause. Either party may terminate this Agreement immediately upon written notice if the other party: (a) materially breaches any provision and fails to cure such breach within thirty (30) days of written notice; or (b) becomes insolvent, files for bankruptcy, or undergoes liquidation.
8.4 Effect of Termination. Upon termination, Client shall pay Provider for all Services performed up to the termination date, and each party shall promptly return or certify destruction of Confidential Information.

SECTION 9: GENERAL PROVISIONS
9.1 Governing Law and Dispute Resolution. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of laws principles. Any legal suit or action arising out of this Agreement shall be instituted exclusively in the state or federal courts located in New Castle County, Delaware.
9.2 Force Majeure. Neither party shall be liable for delays or failures in performance resulting from acts of God, strikes, natural disasters, epidemics, war, acts of terrorism, or government embargoes.
9.3 Entire Agreement. This Agreement, together with all executed SOWs and Exhibits, constitutes the entire understanding between the parties and supersedes all prior agreements, representations, and negotiations.`;

export const SAMPLE_MSA_V2_TEXT = `MASTER SERVICES AGREEMENT (REVISED VERSION 2.0)

This Master Services Agreement ("Agreement") is made and entered into as of May 1, 2024 ("Effective Date"), by and between Acme Enterprise Solutions Inc., a Delaware corporation having its principal place of business at 100 Innovation Way, Wilmington, DE ("Client"), and Apex Cloud Technologies LLC, a California limited liability company having its principal place of business at 500 Silicon Vista, San Francisco, CA ("Provider").

RECITALS
WHEREAS, Provider possesses expertise in enterprise cloud infrastructure, software architecture, and managed IT services; and
WHEREAS, Client desires to retain Provider to perform professional engineering and consulting services as described in Statements of Work executed hereunder.

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

SECTION 1: SERVICES AND STATEMENTS OF WORK
1.1 Statements of Work. Provider shall provide the consulting, software engineering, and managed cloud services ("Services") specified in one or more Statements of Work ("SOW") executed by authorized representatives of both parties.
1.2 Performance Standards. Provider warrants that all Services shall be performed in a professional, diligent, and workmanlike manner in accordance with prevailing industry standards.
1.3 Acceptance. Client shall have ten (10) business days following delivery of any milestone to review and evaluate deliverables. If no written rejection specifying deficiencies is delivered within said period, the deliverables shall be deemed accepted.

SECTION 2: COMPENSATION AND PAYMENT TERMS
2.1 Invoicing and Payment. Invoices shall be issued monthly in advance. Client shall pay all invoice amounts within fifteen (15) calendar days from receipt of invoice ("Net 15").
2.2 Late Payments. Undisputed amounts overdue by more than five (5) days shall accrue interest at the rate of 3.0% per month or the maximum rate permitted by law.
2.3 Taxes. Fees are exclusive of all applicable federal, state, local, sales, and value-added taxes, which shall be the sole responsibility of Client.

SECTION 3: CONFIDENTIALITY AND PROPRIETARY INFORMATION
3.1 Definition. "Confidential Information" means all non-public, proprietary information disclosed by either party ("Disclosing Party") to the other party ("Receiving Party"), whether orally, visually, or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.
3.2 Exclusions. Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was already known to Receiving Party prior to disclosure without confidentiality obligations; (c) is independently developed without reference to Disclosing Party's Confidential Information.
3.3 Protection Obligations. Receiving Party shall hold Confidential Information in strict confidence and exercise at least the degree of care it uses for its own confidential data, but no less than reasonable care. Obligations shall survive indefinitely following termination.

SECTION 4: INTELLECTUAL PROPERTY RIGHTS
4.1 Client IP. Client retains sole ownership of all pre-existing data, trademarks, customer information, and proprietary software provided to Provider.
4.2 Work Product. All custom software, scripts, frameworks, and Deliverables developed under this Agreement shall be owned jointly by both Client and Provider, with Provider retaining unrestricted rights to license, commercialize, and reuse all underlying code.

SECTION 5: WARRANTIES AND DISCLAIMERS
5.1 Mutual Warranties. Each party represents and warrants that it has full power and authority to enter into this Agreement and that its execution does not violate any third-party agreements.
5.2 Service Warranty. Provider warrants that Services will conform materially to the specifications in the applicable SOW for thirty (30) days following acceptance.
5.3 Disclaimer. EXCEPT AS EXPRESSLY SET FORTH HEREIN, NEITHER PARTY MAKES ANY OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.

SECTION 6: INDEMNIFICATION
6.1 Provider Indemnity. Provider shall defend, indemnify, and hold harmless Client, its officers, directors, and employees from and against any third-party claims, damages, liabilities, and expenses arising out of gross negligence or willful misconduct, capped at $100,000.
6.2 Client Indemnity. Client shall defend, indemnify, and hold harmless Provider without limitation from any and all third-party claims arising out of the Deliverables, software deployment, or regulatory compliance failures.

SECTION 7: LIMITATION OF LIABILITY
7.1 Consequential Damages Waiver. NEITHER PARTY SHALL BE LIABLE FOR ANY CONSEQUENTIAL DAMAGES EXCEPT IN CASES OF GROSS NEGLIGENCE.
7.2 Aggregate Liability Cap. PROVIDER'S TOTAL AGGREGATE LIABILITY ARISING UNDER OR RELATED TO THIS AGREEMENT SHALL UNDER NO CIRCUMSTANCES EXCEED $50,000. CLIENT'S LIABILITY UNDER THIS AGREEMENT SHALL BE UNLIMITED.

SECTION 8: TERM AND TERMINATION
8.1 Term. This Agreement commences on the Effective Date and shall remain in effect for five (5) years.
8.2 Termination for Convenience. Client shall have NO right to terminate this Agreement for convenience. Provider may terminate this Agreement for convenience upon thirty (30) calendar days' prior written notice.
8.3 Termination for Cause. Either party may terminate this Agreement immediately upon written notice if the other party commits a material breach and fails to cure such breach within ten (10) days.

SECTION 9: RESTRICTIVE COVENANTS AND NON-COMPETITION
9.1 Non-Compete. During the Term of this Agreement and for a period of two (2) years thereafter, Client shall not, directly or indirectly, develop, market, or deploy any software platform competing with Provider's cloud automation software.
9.2 Non-Solicitation. Client shall not hire or solicit any employee or contractor of Provider for eighteen (18) months following termination.

SECTION 10: GENERAL PROVISIONS
10.1 Governing Law and Dispute Resolution. This Agreement shall be governed exclusively by the laws of England and Wales. All disputes shall be finally settled under the Rules of Arbitration of the London Court of International Arbitration (LCIA).
10.2 Force Majeure. Neither party shall be liable for delays or failures resulting from events beyond reasonable control.
10.3 Entire Agreement. This Agreement supersedes all prior negotiations and agreements.`;

export const SAMPLE_NDA_TEXT = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of March 10, 2024 ("Effective Date"), by and between Horizon BioTech Corp., a Massachusetts corporation ("Horizon"), and Genesis Health Systems Inc., a New York corporation ("Genesis").

1. Purpose. The parties wish to explore a potential strategic partnership involving biotechnology clinical trials and artificial intelligence diagnostic systems ("Permitted Purpose").

2. Confidential Information. "Confidential Information" refers to any proprietary, confidential, or non-public technical, clinical, financial, or commercial information disclosed by one party ("Disclosing Party") to the other party ("Receiving Party"), whether marked as confidential or disclosed under circumstances where confidentiality is reasonably understood.

3. Non-Disclosure and Use Restrictions.
(a) Receiving Party shall hold Disclosing Party's Confidential Information in strict confidence and shall not disclose it to any third party without prior written consent.
(b) Receiving Party shall restrict access solely to its employees, legal advisors, and financial consultants who need to know such information for the Permitted Purpose and who are bound by written obligations at least as restrictive as those herein.
(c) Receiving Party shall not use Confidential Information for any purpose other than the Permitted Purpose.

4. Exclusions. The obligations under this Agreement shall not apply to information that:
(a) is or becomes publicly available without breach of this Agreement;
(b) was in the rightful possession of Receiving Party prior to receipt from Disclosing Party;
(c) is lawfully disclosed to Receiving Party by a third party without confidentiality restrictions;
(d) is independently developed by Receiving Party without reference to or reliance on Confidential Information.

5. Compelled Disclosures. If Receiving Party is compelled by subpoena, court order, or regulatory agency to disclose Confidential Information, Receiving Party shall provide prompt written notice to Disclosing Party to enable Disclosing Party to seek a protective order.

6. Term and Survival. This Agreement shall govern disclosures made for a period of two (2) years from the Effective Date. The confidentiality and non-use obligations with respect to all disclosed Confidential Information shall survive for a period of five (5) years from the date of disclosure, except for trade secrets, which shall survive indefinitely.

7. Return of Materials. Upon written request of Disclosing Party, Receiving Party shall promptly return or destroy all documents, notes, prototypes, and electronic media containing Confidential Information, and certify such destruction in writing.

8. Injunctive Relief. The parties acknowledge that unauthorized disclosure of Confidential Information may cause irreparable harm for which monetary damages alone would be inadequate. Consequently, Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other available legal remedies.

9. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the Commonwealth of Massachusetts, without regard to its conflict of law principles.`;

export const SAMPLE_ARABIC_CONTRACT_TEXT = `عقد تقديم خدمات تقنية واتفاقية مستوى الخدمة (SLA)

تم إبرام هذه الاتفاقية في يوم الإثنين الموافق 1 فبراير 2024 بين كل من:
الطرف الأول: شركة الرواد للحلول السحابية ش.ذ.م.م (المزود)، ومقرها دبي، الإمارات العربية المتحدة.
الطرف الثاني: مؤسسة الأفق للاستشارات التقنية (العميل)، ومقرها أبوظبي، الإمارات العربية المتحدة.

المادة الأولى: نطاق الخدمات
يلتزم المزود بتقديم خدمات البنية التحتية السحابية والدعم الفني على مدار الساعة (24/7) بنسبة جاهزية لا تقل عن 99.9% شهرياً.

المادة الثانية: سرية المعلومات والبيانات
يتعهد الطرفان بالحفاظ على السرية التامة لكافة البيانات التقنية والمالية المتبادلة طوال مدة العقد ولمدة ثلاث (3) سنوات بعد انتهائه.

المادة الثالثة: حدود المسؤولية
تقتصر المسؤولية الإجمالية للمزود عن أي أضرار ناتجة عن هذا العقد على إجمالي المبالغ المدفوعة من العميل خلال الستة (6) أشهر السابقة لوقوع المطالبة، وبحد أقصى لا يتجاوز 500,000 درهم إماراتي (AED 500,000).

المادة الرابعة: القانون الواجب التطبيق والاختصاص القضائي
يخضع هذا العقد ويفسر وفقاً لقوانين دولة الإمارات العربية المتحدة المعمول بها في إمارة دبي، وتختص محاكم دبي حصرياً بالفصل في أي نزاع ينشأ عنه.`;

/**
 * Creates preloaded sample document objects ready for testing
 */
export function createSampleDocuments(): ContractDocument[] {
  // Helper to split into pages
  const createPages = (text: string, wordsPerPage = 350) => {
    const paragraphs = text.split(/\n\s*\n/);
    const pages = [];
    let currentText = '';
    let currentPageNum = 1;
    let runningCharOffset = 0;

    for (const para of paragraphs) {
      currentText += para + '\n\n';
      const words = currentText.split(/\s+/).length;

      if (words >= wordsPerPage || para.match(/^(section|article|clause|\d+\.)/i)) {
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
        text: currentText.trim() || text,
        charStart: runningCharOffset,
        charEnd: runningCharOffset + currentText.length,
      });
    }

    return pages;
  };

  const doc1Pages = createPages(SAMPLE_MSA_V1_TEXT);
  const doc1: ContractDocument = {
    id: 'sample_doc_msa_v1',
    name: 'Master_Services_Agreement_v1.docx',
    size: 48200,
    format: 'docx',
    uploadedAt: Date.now() - 3600000 * 24,
    rawText: SAMPLE_MSA_V1_TEXT,
    pages: doc1Pages,
    pageCount: doc1Pages.length,
    htmlContent: `<div class="legal-contract">${SAMPLE_MSA_V1_TEXT.split('\n\n').map(p => `<p class="mb-4">${p}</p>`).join('')}</div>`,
    isScannedOrUnreadable: false,
    isRTL: false,
  };
  doc1.detectedClauses = analyzeDocumentClauses(doc1);

  const doc2Pages = createPages(SAMPLE_MSA_V2_TEXT);
  const doc2: ContractDocument = {
    id: 'sample_doc_msa_v2',
    name: 'Master_Services_Agreement_v2_Revision.docx',
    size: 51400,
    format: 'docx',
    uploadedAt: Date.now() - 3600000 * 12,
    rawText: SAMPLE_MSA_V2_TEXT,
    pages: doc2Pages,
    pageCount: doc2Pages.length,
    htmlContent: `<div class="legal-contract">${SAMPLE_MSA_V2_TEXT.split('\n\n').map(p => `<p class="mb-4">${p}</p>`).join('')}</div>`,
    isScannedOrUnreadable: false,
    isRTL: false,
  };
  doc2.detectedClauses = analyzeDocumentClauses(doc2);

  const doc3Pages = createPages(SAMPLE_NDA_TEXT);
  const doc3: ContractDocument = {
    id: 'sample_doc_nda',
    name: 'Mutual_Non_Disclosure_Agreement.pdf',
    size: 64100,
    format: 'pdf',
    uploadedAt: Date.now() - 3600000 * 4,
    rawText: SAMPLE_NDA_TEXT,
    pages: doc3Pages,
    pageCount: doc3Pages.length,
    htmlContent: `<div class="legal-contract">${SAMPLE_NDA_TEXT.split('\n\n').map(p => `<p class="mb-4">${p}</p>`).join('')}</div>`,
    isScannedOrUnreadable: false,
    isRTL: false,
  };
  doc3.detectedClauses = analyzeDocumentClauses(doc3);

  const arabicPages = createPages(SAMPLE_ARABIC_CONTRACT_TEXT);
  const doc4: ContractDocument = {
    id: 'sample_doc_arabic',
    name: 'Cloud_SLA_Agreement_Arabic_UAE.pdf',
    size: 42000,
    format: 'pdf',
    uploadedAt: Date.now() - 3600000 * 2,
    rawText: SAMPLE_ARABIC_CONTRACT_TEXT,
    pages: arabicPages,
    pageCount: arabicPages.length,
    htmlContent: `<div class="legal-contract rtl" dir="rtl">${SAMPLE_ARABIC_CONTRACT_TEXT.split('\n\n').map(p => `<p class="mb-4">${p}</p>`).join('')}</div>`,
    isScannedOrUnreadable: false,
    isRTL: true,
  };
  doc4.detectedClauses = analyzeDocumentClauses(doc4);

  return [doc1, doc2, doc3, doc4];
}
