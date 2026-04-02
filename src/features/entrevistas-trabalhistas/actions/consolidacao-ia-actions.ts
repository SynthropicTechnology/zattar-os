'use server';

import { DifyService } from '@/lib/dify';
import { findAnexos } from '../repository';
import type { RespostasEntrevista } from '../domain';

export interface ConsolidacaoIAResult {
  success: boolean;
  relatoConsolidado?: string;
  inconsistencias?: string[];
  error?: string;
}

function gerarFallbackLocal(respostas: RespostasEntrevista): ConsolidacaoIAResult {
  const inconsistencias: string[] = [];

  if (!respostas.vinculo?.remuneracao_mensal && !respostas.contrato_pj?.remuneracao_liquida_mensal) {
    inconsistencias.push('Nao foi informada remuneracao mensal para subsidiar calculos de verbas.');
  }

  if (!respostas.ruptura?.motivo && !respostas.desligamento_plataforma?.forma_desligamento) {
    inconsistencias.push('Nao ha definicao clara da forma de desligamento/ruptura da relacao de trabalho.');
  }

  const relatoConsolidado = [
    'Relato consolidado (fallback local):',
    '',
    `Trilha: ${
      respostas.vinculo || respostas.jornada || respostas.ruptura
        ? 'Trabalhista classico'
        : respostas.controle_algoritmico || respostas.dependencia_economica
          ? 'Gig economy'
          : 'Pejotizacao'
    }`,
    '',
    'Dados estruturados foram consolidados para revisao juridica. Em caso de configuracao de IA indisponivel, esta sintese local e gerada para nao interromper o fluxo operacional.',
  ].join('\n');

  return {
    success: true,
    relatoConsolidado,
    inconsistencias,
  };
}

export async function consolidarEntrevistaIAAction(
  entrevistaId: number,
  respostas: RespostasEntrevista,
): Promise<ConsolidacaoIAResult> {
  try {
    const anexosResult = await findAnexos(entrevistaId);
    const anexos = anexosResult.success ? anexosResult.data : [];

    const promptJuridico = [
      'Voce e um assistente juridico especializado em Direito do Trabalho brasileiro.',
      'Consolide em relato unico e cronologico os fatos da entrevista.',
      'Sempre referencie evidencias com origem explicita (modulo, tipo_anexo, arquivo_url).',
      'Aponte inconsistencias e lacunas probatorias relevantes para peticao inicial trabalhista.',
      'Retorne JSON com as chaves: relato_consolidado (string), inconsistencias (array de strings).',
    ].join(' ');

    try {
      const service = await DifyService.createAsync('entrevista-trabalhista');
      const iaResult = await service.executarWorkflowCompleto({
        inputs: {
          instrucoes: promptJuridico,
          entrevista_id: entrevistaId,
          respostas,
          anexos,
        },
      }, 'entrevista-trabalhista');

      if (iaResult.isOk()) {
        const outputs = iaResult.value.outputs;
        const relatoConsolidado = typeof outputs.relato_consolidado === 'string'
          ? outputs.relato_consolidado
          : JSON.stringify(outputs, null, 2);

        const inconsistencias = Array.isArray(outputs.inconsistencias)
          ? outputs.inconsistencias.map((item) => String(item))
          : [];

        return {
          success: true,
          relatoConsolidado,
          inconsistencias,
        };
      }
    } catch {
      // Dify may be unavailable in the current environment.
    }

    return gerarFallbackLocal(respostas);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consolidar entrevista com IA',
    };
  }
}
