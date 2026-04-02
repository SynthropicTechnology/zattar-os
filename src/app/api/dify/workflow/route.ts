import { NextRequest, NextResponse } from 'next/server';
import { createDifyServiceForUser, createDifyServiceForApp } from '@/lib/dify/factory';
import { executarWorkflowSchema } from '@/lib/dify';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();

        const payload = {
            ...json,
            inputs: json.inputs || {},
            user: json.user || 'anonymous-user',
        };

        // Validar apenas inputs por enquanto, pois o schema pode não esperar user ali dentro
        const schemaValidation = executarWorkflowSchema.safeParse({
            inputs: payload.inputs,
            files: payload.files
        });

        if (!schemaValidation.success) {
            return NextResponse.json(
                { error: 'Parâmetros inválidos', details: schemaValidation.error.format() },
                { status: 400 }
            );
        }

        const { user } = payload;
        const userId = user || 'anonymous-user';
        const appId = json.app_id as string | undefined;

        const service = appId
            ? await createDifyServiceForApp(appId)
            : await createDifyServiceForUser(userId);

        const result = await service.executarWorkflowStream({
            inputs: payload.inputs,
            files: payload.files,
        }, userId);

        if (result.isErr()) {
            console.error('[API Dify Workflow] Erro no service:', result.error);
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
        console.error('[API Dify Workflow] Erro não tratado:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: 'Erro interno ao processar workflow', details: message },
            { status: 500 }
        );
    }
}
