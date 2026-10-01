import { NextRequest, NextResponse } from 'next/server';
import { ContractDocument, LLMConfig } from '@/lib/types';
import { streamMockLegalResponse, retrieveRelevantContractContext } from '@/lib/llm-client';
import { extractQuoteCandidates, verifyAllQuotes } from '@/lib/quote-verifier';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, documents, config } = body as {
      question: string;
      documents: ContractDocument[];
      config?: LLMConfig;
    };

    if (!question || !documents || documents.length === 0) {
      return NextResponse.json({ error: 'Question and at least one document are required.' }, { status: 400 });
    }

    // Retrieve context and calculate coverage
    const retrieval = retrieveRelevantContractContext(question, documents);

    // Setup Server-Sent Events stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      let accumulatedText = '';

      try {
        // Send initial coverage metadata
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'coverage',
              coveragePercent: retrieval.coveragePercent,
              coverageNote: retrieval.coverageNote,
              totalPages: retrieval.totalPages,
            })}\n\n`
          )
        );

        // Check if user provided an OpenAI/Anthropic/Gemini API key in config
        if (config?.apiKey && config?.provider === 'openai') {
          // OpenAI Direct Streaming
          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model || 'gpt-4o-mini',
              stream: true,
              messages: [
                {
                  role: 'system',
                  content: `You are an expert Legal Contract Analyst. Answer user questions STRICTLY using facts and text in the provided contract context.
CRITICAL RULES:
1. Every answer must be backed by exact quotes using the syntax: [Quote: "exact quote from document"]
2. If multi-document, specify: [Doc: <doc_name>, Quote: "exact quote"]
3. If the answer or clause does not exist in the context, explicitly state that the clause is not present in the document. NEVER invent or extrapolate missing clauses.

CONTEXT:
${retrieval.contextText}`,
                },
                {
                  role: 'user',
                  content: question,
                },
              ],
            }),
          });

          if (!openAiRes.ok || !openAiRes.body) {
            throw new Error(`OpenAI API error: ${openAiRes.statusText}`);
          }

          const reader = openAiRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    accumulatedText += delta;
                    await writer.write(
                      encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: delta })}\n\n`)
                    );
                  }
                } catch {}
              }
            }
          }
        } else {
          // Use our high-precision Legal Mock Streamer
          await streamMockLegalResponse(question, documents, async (chunk) => {
            accumulatedText += chunk;
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`)
            );
          });
        }

        // Post-generation quote verification
        const candidates = extractQuoteCandidates(accumulatedText);
        const verifiedQuotes = verifyAllQuotes(candidates, documents);

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'verification',
              quotes: verifiedQuotes,
            })}\n\n`
          )
        );

        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err: any) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message || 'Stream error' })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
