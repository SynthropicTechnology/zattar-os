/**
 * API de Recuperação de Capturas - Detalhe
 * GET: Buscar log bruto específico por rawLogId com análise de gaps
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { buscarLogPorRawLogId } from '@/app/(authenticated)/captura/services/recovery/captura-recovery.service';
import { analisarCaptura } from '@/app/(authenticated)/captura/services/recovery/recovery-analysis.service';

type RouteParams = {
  params: Promise<{
    rawLogId: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { rawLogId } = await params;
    if (!rawLogId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'rawLogId é obrigatório' } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const incluirPayload = searchParams.get('incluir_payload') === 'true';
    const analisarGaps = searchParams.get('analisar_gaps') !== 'false'; // default: true

    const documento = await buscarLogPorRawLogId(rawLogId);
    if (!documento) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Log não encontrado' } },
        { status: 404 }
      );
    }

    const logInfo = {
      rawLogId: (documento as any).raw_log_id,
      capturaLogId: (documento as any).captura_log_id,
      tipoCaptura: (documento as any).tipo_captura,
      status: (documento as any).status,
      trt: (documento as any).trt,
      grau: (documento as any).grau,
      advogadoId: (documento as any).advogado_id,
      credencialId: (documento as any).credencial_id,
      criadoEm: (documento as any).criado_em,
      atualizadoEm: (documento as any).atualizado_em,
      requisicao: (documento as any).requisicao,
      resultadoProcessado: (documento as any).resultado_processado,
      logs: (documento as any).logs,
      erro: (documento as any).erro,
    };

    let analise = null;
    if (analisarGaps) {
      analise = await analisarCaptura(rawLogId);
    }

    const response: Record<string, unknown> = {
      success: true,
      data: {
        log: logInfo,
        payloadDisponivel:
          (documento as any).payload_bruto !== null &&
          (documento as any).payload_bruto !== undefined,
      },
    };

    if (analise) {
      response.data = {
        ...(response.data as object),
        analise: {
          processo: analise.processo,
          totais: analise.totais,
          gaps: analise.gaps,
          payloadDisponivel: analise.payloadDisponivel,
          erroOriginal: analise.erroOriginal,
        },
      };
    }

    if (incluirPayload && (documento as any).payload_bruto) {
      response.data = {
        ...(response.data as object),
        payloadBruto: (documento as any).payload_bruto,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar log de recovery:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: erroMsg } },
      { status: 500 }
    );
  }
}


