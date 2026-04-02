import { NextRequest, NextResponse } from 'next/server';
import { createDifyServiceForUser, createDifyServiceForApp } from '@/lib/dify/factory';
import { enviarMensagemSchema } from '@/lib/dify';

// Definir runtime como edge para melhor performance em streaming se suportado pela infra
// Se houver dependências Node.js específicas no service, remover essa linha
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    // O schema espera 'user' como string obrigatória, mas no frontend as vezes o user vem do contexto de auth
    // Vamos garantir que ele exista ou usar um fallback
    const payload = {
      ...json,
      user: json.user || 'anonymous-user',
    };

    const parseResult = enviarMensagemSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { query, inputs, conversation_id, user } = parseResult.data;

    const userId = user || 'anonymous-user';
    const appId = json.app_id as string | undefined;

    // Inicializa o serviço (por app específico ou pelo usuário)
    const service = appId
      ? await createDifyServiceForApp(appId)
      : await createDifyServiceForUser(userId);

    // Chama o método de stream do service
    const result = await service.enviarMensagemStream({
      query,
      inputs,
      conversation_id,
    }, userId);

    if (result.isErr()) {
      console.error('[API Dify] Erro no service:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const stream = result.value;

    // Cancelar o stream upstream se o cliente desconectar
    req.signal.addEventListener('abort', () => {
      try {
        stream.cancel();
      } catch {
        // Stream já foi fechado
      }
    });

    // Retorna o stream como resposta SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('[API Dify] Erro não tratado:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro interno ao processar chat', details: message },
      { status: 500 }
    );
  }
}
