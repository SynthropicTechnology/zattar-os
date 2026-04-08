import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import type { MultimodalRequest, MultimodalResponse } from '@/components/layout/pedrinho-agent/types'

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY

export async function POST(req: NextRequest): Promise<NextResponse<MultimodalResponse>> {
  if (!apiKey) {
    return NextResponse.json(
      { content: '', error: 'API key não configurada' },
      { status: 503 }
    )
  }

  try {
    const body = (await req.json()) as MultimodalRequest
    const { text, attachments } = body

    if (!attachments?.length && !text) {
      return NextResponse.json(
        { content: '', error: 'Nenhum conteúdo enviado' },
        { status: 400 }
      )
    }

    // Build multipart content for AI SDK
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentParts: any[] = []

    if (text) {
      contentParts.push({ type: 'text', text })
    }

    for (const attachment of attachments) {
      const buffer = Buffer.from(attachment.data, 'base64')

      if (attachment.mediaType.startsWith('image/')) {
        contentParts.push({
          type: 'image',
          image: buffer,
        })
      } else {
        contentParts.push({
          type: 'file',
          data: buffer,
          mediaType: attachment.mediaType,
        })
      }
    }

    const model = google('gemini-2.5-flash')

    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Você é o Pedrinho, assistente jurídico da Synthropic. Responda em português brasileiro. ' +
            'Quando receber arquivos, analise seu conteúdo em detalhes. ' +
            'Quando receber áudio, transcreva e responda ao que foi dito. ' +
            'Quando receber imagens, descreva e analise o conteúdo.',
        },
        {
          role: 'user',
          content: contentParts,
        },
      ],
      maxOutputTokens: 4096,
    })

    return NextResponse.json({ content: result.text })
  } catch (error) {
    console.error('[Pedrinho Multimodal] Error:', error)
    return NextResponse.json(
      { content: '', error: 'Erro ao processar mensagem multimodal' },
      { status: 500 }
    )
  }
}
