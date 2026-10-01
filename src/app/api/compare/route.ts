import { NextRequest, NextResponse } from 'next/server';
import { ContractDocument } from '@/lib/types';
import { compareContracts } from '@/lib/document-diff';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doc1, doc2 } = body as {
      doc1: ContractDocument;
      doc2: ContractDocument;
    };

    if (!doc1 || !doc2) {
      return NextResponse.json({ error: 'Two contract documents are required for comparison.' }, { status: 400 });
    }

    const result = compareContracts(doc1, doc2);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Comparison failed' }, { status: 500 });
  }
}
