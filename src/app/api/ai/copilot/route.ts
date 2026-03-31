/**
 * @swagger
 * /api/ai/copilot:
 *   post:
 *     summary: Endpoint de copiloto AI
 *     description: Gera texto usando modelo de linguagem AI para assistência
 *     tags:
 *       - AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: API key do gateway AI (opcional se configurada no servidor)
 *               model:
 *                 type: string
 *                 default: google/gemini-3.1-flash-lite-preview
 *                 description: Modelo de linguagem a ser usado
 *               prompt:
 *                 type: string
 *                 description: Prompt para geração de texto
 *               system:
 *                 type: string
 *                 description: Prompt de sistema
 *     responses:
 *       200:
 *         description: Texto gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: API key ausente
 *       408:
 *         description: Requisição cancelada (timeout)
 *       500:
 *         description: Erro ao processar requisição AI
 */

import type { NextRequest } from 'next/server';

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const {
    apiKey: key,
    model = 'google/gemini-3.1-flash-lite-preview',
    prompt,
    system,
  } = await req.json();

  const apiKey = key || process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing ai gateway API key.' },
      { status: 401 }
    );
  }

  try {
    const openrouter = createOpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const result = await generateText({
      abortSignal: req.signal,
      maxOutputTokens: 50,
      model: openrouter(model),
      prompt,
      system,
      temperature: 0.7,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(null, { status: 408 });
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
