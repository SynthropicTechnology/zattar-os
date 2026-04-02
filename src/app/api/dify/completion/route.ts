import { NextRequest, NextResponse } from 'next/server';
import { createDifyServiceForUser, createDifyServiceForApp } from '@/lib/dify/factory';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();

        const inputs = json.inputs || {};
        const user = json.user || 'anonymous-user';
        const appId = json.app_id as string | undefined;

        if (!inputs || Object.keys(inputs).length === 0) {
            return NextResponse.json(
                { error: 'Inputs são obrigatórios para completion' },
                { status: 400 }
            );
        }

        const service = appId
            ? await createDifyServiceForApp(appId)
            : await createDifyServiceForUser(user);

        const result = await service.completarStream({ inputs }, user);

        if (result.isErr()) {
            console.error('[API Dify Completion] Erro no service:', result.error);
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

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: unknown) {
        console.error('[API Dify Completion] Erro não tratado:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: 'Erro interno ao processar completion', details: message },
            { status: 500 }
        );
    }
}
