'use server';

import { DifyService } from '@/lib/dify';
import { findById, findAnexos } from '../repository';
import { createServiceClient } from '@/lib/supabase/service-client';

export interface IntegracaoPeticaoResult {
  success: boolean;
  message: string;
  workflowRunId?: string;
  payload?: Record<string, unknown>;
}

type RelacaoAssistenteTipoRow = {
  assistente?: { dify_app_id?: string | null; ativo?: boolean | null; nome?: string | null };
  tipo_expediente?: { tipo_expediente?: string | null };
};

function normalizarTexto(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function resolverAppIdAssistentePeticaoInicial(): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('assistentes_tipos_expedientes')
    .select(`
      assistente:assistentes!assistente_id(dify_app_id, ativo, nome),
      tipo_expediente:tipos_expedientes!tipo_expediente_id(tipo_expediente)
    `)
    .eq('ativo', true);

  if (error) {
    throw new Error(`Erro ao resolver assistente para peticao inicial: ${error.message}`);
  }

  const relacoes = (data ?? []) as RelacaoAssistenteTipoRow[];

  const candidatosPeticao = relacoes.filter((item) => {
    const tipo = normalizarTexto(item.tipo_expediente?.tipo_expediente);
    return (
      tipo === 'peticao_inicial' ||
      tipo === 'peticao inicial' ||
      tipo.includes('peticao inicial')
    );
  });

  const comDifyAtivo = candidatosPeticao.find(
    (item) => item.assistente?.ativo !== false && Boolean(item.assistente?.dify_app_id),
  );

  if (comDifyAtivo?.assistente?.dify_app_id) {
    return comDifyAtivo.assistente.dify_app_id;
  }

  // Fallback: qualquer assistente Dify ativo configurado por tipo de expediente.
  const fallback = relacoes.find(
    (item) => item.assistente?.ativo !== false && Boolean(item.assistente?.dify_app_id),
  );

  return fallback?.assistente?.dify_app_id ?? null;
}

export async function enviarParaIntegracaoPeticaoAction(
  entrevistaId: number,
): Promise<IntegracaoPeticaoResult> {
  try {
    const entrevistaResult = await findById(entrevistaId);
    if (!entrevistaResult.success || !entrevistaResult.data) {
      return {
        success: false,
        message: 'Entrevista nao encontrada para integracao.',
      };
    }

    const anexosResult = await findAnexos(entrevistaId);
    const anexos = anexosResult.success ? anexosResult.data : [];

    const entrevista = entrevistaResult.data;
    const payload = {
      entrevista_id: entrevista.id,
      contrato_id: entrevista.contratoId,
      tipo_litigio: entrevista.tipoLitigio,
      respostas: entrevista.respostas,
      anexos,
      consolidacao_final: entrevista.respostas.consolidacao_final ?? {},
      instrucao_juridica:
        'Gerar base estruturada para peticao inicial trabalhista, citando provas por referencia de anexo e destacando riscos/inconsistencias remanescentes.',
    };

    const appId = await resolverAppIdAssistentePeticaoInicial();
    if (!appId) {
      return {
        success: true,
        message:
          'Integracao preparada, mas nao foi encontrado assistente Dify ativo vinculado aos tipos de expediente. Payload pronto para uso manual.',
        payload,
      };
    }

    const service = await DifyService.createAsync('entrevista-trabalhista', appId);
    const result = await service.executarWorkflowCompleto({
      inputs: payload,
    }, 'entrevista-trabalhista');

    if (result.isErr()) {
      return {
        success: false,
        message: `Falha na integracao com assistente: ${result.error.message}`,
      };
    }

    return {
      success: true,
      message: 'Conteudo enviado para o assistente de peticao inicial com sucesso.',
      workflowRunId: result.value.workflowRunId,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao enviar para integracao de peticao',
    };
  }
}
