/**
 * API de Elementos de Recovery
 *
 * GET /api/captura/recovery/[rawLogId]/elementos
 *
 * Retorna elementos capturados no payload bruto, com status de persistência.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  extrairTodosElementos,
  extrairElementosPorTipo,
} from '@/app/(authenticated)/captura/services/recovery/recovery-analysis.service';
import { buscarLogPorRawLogId } from '@/app/(authenticated)/captura/services/recovery/captura-recovery.service';

interface RouteParams {
  params: Promise<{
    rawLogId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: { message: 'Não autorizado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { rawLogId } = await params;
    if (!rawLogId) {
      return NextResponse.json(
        { success: false, error: { message: 'rawLogId é obrigatório', code: 'INVALID_PARAMS' } },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filtro = searchParams.get('filtro') || 'todos';
    const modo = searchParams.get('modo') || 'generico';

    const documento = await buscarLogPorRawLogId(rawLogId);
    if (!documento) {
      return NextResponse.json(
        { success: false, error: { message: 'Log não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const logInfo = {
      rawLogId,
      capturaLogId: (documento as any).captura_log_id,
      tipoCaptura: (documento as any).tipo_captura,
      status: (documento as any).status,
      trt: (documento as any).trt,
      grau: (documento as any).grau,
      advogadoId: (documento as any).advogado_id,
      criadoEm: (documento as any).criado_em,
      erro: (documento as any).erro,
    };

    if (!(documento as any).payload_bruto) {
      return NextResponse.json(
        {
          success: true,
          data: {
            log: logInfo,
            payloadDisponivel: false,
            suportaRepersistencia: false,
            filtroAplicado: filtro,
            elementos: modo === 'partes'
              ? {
                  partes: [],
                  enderecos: [],
                  representantes: [],
                  totais: {
                    partes: 0,
                    partesExistentes: 0,
                    partesFaltantes: 0,
                    enderecos: 0,
                    enderecosExistentes: 0,
                    enderecosFaltantes: 0,
                    representantes: 0,
                    representantesExistentes: 0,
                    representantesFaltantes: 0,
                  },
                }
              : [],
            totais: modo === 'partes'
              ? undefined
              : { total: 0, existentes: 0, faltantes: 0, filtrados: 0 },
          },
        },
        { status: 200 }
      );
    }

    if (modo === 'generico') {
      const resultado = await extrairElementosPorTipo(rawLogId);
      if (!resultado) {
        return NextResponse.json(
          { success: false, error: { message: 'Erro ao extrair elementos', code: 'EXTRACTION_ERROR' } },
          { status: 500 }
        );
      }

      let elementosFiltered = resultado.elementos;
      if (filtro === 'faltantes') {
        elementosFiltered = resultado.elementos.filter((e) => e.statusPersistencia === 'faltando');
      } else if (filtro === 'existentes') {
        elementosFiltered = resultado.elementos.filter((e) => e.statusPersistencia === 'existente');
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            log: logInfo,
            payloadDisponivel: true,
            filtroAplicado: filtro,
            suportaRepersistencia: resultado.suportaRepersistencia,
            mensagem: resultado.mensagem,
            elementos: elementosFiltered,
            totais: {
              total: resultado.totais.total,
              existentes: resultado.totais.existentes,
              faltantes: resultado.totais.faltantes,
              filtrados: elementosFiltered.length,
            },
          },
        },
        { status: 200 }
      );
    }

    const elementos = await extrairTodosElementos(rawLogId);
    if (!elementos) {
      return NextResponse.json(
        { success: false, error: { message: 'Erro ao extrair elementos', code: 'EXTRACTION_ERROR' } },
        { status: 500 }
      );
    }

    let partesFiltered = elementos.partes;
    let enderecosFiltered = elementos.enderecos;
    let representantesFiltered = elementos.representantes;

    if (filtro === 'faltantes') {
      partesFiltered = elementos.partes.filter((e) => e.statusPersistencia === 'faltando');
      enderecosFiltered = elementos.enderecos.filter((e) => e.statusPersistencia === 'faltando');
      representantesFiltered = elementos.representantes.filter((e) => e.statusPersistencia === 'faltando');
    } else if (filtro === 'existentes') {
      partesFiltered = elementos.partes.filter((e) => e.statusPersistencia === 'existente');
      enderecosFiltered = elementos.enderecos.filter((e) => e.statusPersistencia === 'existente');
      representantesFiltered = elementos.representantes.filter((e) => e.statusPersistencia === 'existente');
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          log: logInfo,
          payloadDisponivel: true,
          filtroAplicado: filtro,
          suportaRepersistencia: (documento as any).tipo_captura === 'partes',
          elementos: {
            partes: partesFiltered,
            enderecos: enderecosFiltered,
            representantes: representantesFiltered,
            totais: elementos.totais,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Recovery Elementos] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erro interno do servidor',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }
}


