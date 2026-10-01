import { NextRequest, NextResponse } from 'next/server';
import { ContractDocument } from '@/lib/types';
import { runAgenticResearchLoop } from '@/lib/agentic-research';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, documents } = body as {
      question: string;
      documents: ContractDocument[];
    };

    if (!question || !documents || documents.length === 0) {
      return NextResponse.json({ error: 'Question and documents are required.' }, { status: 400 });
    }

    const result = await runAgenticResearchLoop(question, documents);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Agent execution failed' }, { status: 500 });
  }
}
