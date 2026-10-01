import { NextRequest, NextResponse } from 'next/server';
import { TrackedChangeEdit } from '@/lib/types';
import { applyTrackedChangesToDocx } from '@/lib/docx-redliner';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalDocxBase64, fallbackText, originalFileName, edits } = body as {
      originalDocxBase64?: string;
      fallbackText: string;
      originalFileName: string;
      edits: TrackedChangeEdit[];
    };

    if (!edits || edits.length === 0) {
      return NextResponse.json({ error: 'At least one edit instruction is required.' }, { status: 400 });
    }

    const result = await applyTrackedChangesToDocx(
      originalDocxBase64,
      fallbackText,
      originalFileName || 'Contract.docx',
      edits
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Redlining failed' }, { status: 500 });
  }
}
