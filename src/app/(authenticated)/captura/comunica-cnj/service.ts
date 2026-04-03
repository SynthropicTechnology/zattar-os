/**
 * COMUNICA CNJ SERVICE - Camada de Lógica de Negócio
 */

import 'server-only';

import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import { getComunicaCNJClient } from './cnj-client';
import * as repository from './repository';
// Note: importing from core/expedientes/service might need to be migrated later if expedientes becomes a feature
import { criarExpediente } from '@/app/(authenticated)/expedientes/service';
import { createServiceClient } from '@/lib/supabase/service-client';

import type {
  ComunicacaoItem,
  ConsultarComunicacoesParams,
  ConsultaResult,
  SincronizarParams,
  SincronizacaoResult,
  SincronizacaoStats,
  TribunalInfo,
  RateLimitStatus,
  InserirComunicacaoParams,
  MatchParams,
  GrauTribunal,
  ComunicacaoDestinatario,
  PartesExtraidas,
  ListarComunicacoesParams,
  ComunicacaoCNJ,
} from './domain';

import { OrigemExpediente, CodigoTribunal } from '@/app/(authenticated)/expedientes';

import {
  consultarComunicacoesSchema,
  sincronizarComunicacoesSchema,
  vincularExpedienteSchema,
  listarComunicacoesCapturadasSchema,
} from './domain';

// =============================================================================
// UTILITÁRIOS
// =============================================================================

export function inferirGrau(
  nomeOrgao: string,
  siglaTribunal: string
): GrauTribunal {
  const orgaoLower = (nomeOrgao || '').toLowerCase();
  const siglaUpper = (siglaTribunal || '').toUpperCase();

  if (siglaUpper === 'TST' || orgaoLower.includes('ministro')) {
    return 'tribunal_superior';
  }

  if (
    orgaoLower.includes('turma') ||
    orgaoLower.includes('gabinete') ||
    orgaoLower.includes('segundo grau') ||
    orgaoLower.includes('sejusc segundo') ||
    orgaoLower.includes('seção') ||
    orgaoLower.includes('sdc') ||
    orgaoLower.includes('sdi')
  ) {
    return 'segundo_grau';
  }

  return 'primeiro_grau';
}

export function normalizarNumeroProcesso(numeroProcesso: string): string {
  if (!numeroProcesso) return '';
  return numeroProcesso.replace(/[^0-9]/g, '');
}

export function extrairPartes(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): PartesExtraidas {
  if (!destinatarios || !Array.isArray(destinatarios)) {
    return { poloAtivo: [], poloPassivo: [] };
  }

  const poloAtivo: string[] = [];
  const poloPassivo: string[] = [];

  for (const dest of destinatarios) {
    if (!dest.nome) continue;

    if (dest.polo === 'A') {
      poloAtivo.push(dest.nome);
    } else if (dest.polo === 'P') {
      poloPassivo.push(dest.nome);
    }
  }

  return { poloAtivo, poloPassivo };
}

export function obterNomeParteAutora(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): string {
  const { poloAtivo } = extrairPartes(destinatarios);
  return poloAtivo[0] || 'Não especificado';
}

export function obterNomeParteRe(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): string {
  const { poloPassivo } = extrairPartes(destinatarios);
  return poloPassivo[0] || 'Não especificado';
}

function contarPartes(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): { qtdePoloAtivo: number; qtdePoloPassivo: number } {
  const { poloAtivo, poloPassivo } = extrairPartes(destinatarios);
  return {
    qtdePoloAtivo: poloAtivo.length || 1,
    qtdePoloPassivo: poloPassivo.length || 1,
  };
}

// =============================================================================
// SERVIÇOS DE CONSULTA (sem persistência)
// =============================================================================

export async function buscarComunicacoes(
  params: ConsultarComunicacoesParams
): Promise<Result<ConsultaResult>> {
  const validation = consultarComunicacoesSchema.safeParse(params);
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'Parâmetros de consulta inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  try {
    const client = getComunicaCNJClient();
    const { data, rateLimit } = await client.consultarComunicacoes(
      validation.data
    );

    return ok({
      comunicacoes: data.comunicacoes,
      paginacao: data.paginacao,
      rateLimit,
    });
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        error instanceof Error ? error.message : 'Erro ao consultar comunicações.',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export function obterStatusRateLimit(): RateLimitStatus {
  const client = getComunicaCNJClient();
  return client.getRateLimitStatus();
}

export async function obterCertidao(hash: string): Promise<Result<Buffer>> {
  if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
    return err(
      appError('VALIDATION_ERROR', 'Hash inválido.')
    );
  }

  try {
    const client = getComunicaCNJClient();
    const pdfBuffer = await client.obterCertidao(hash);
    return ok(pdfBuffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao obter certidão.';
    
    if (errorMessage.includes('não encontrada') || errorMessage.includes('404')) {
      return err(
        appError('NOT_FOUND', 'Certidão não encontrada.')
      );
    }

    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        errorMessage,
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function listarTribunaisDisponiveis(): Promise<Result<TribunalInfo[]>> {
  try {
    const client = getComunicaCNJClient();
    const tribunais = await client.listarTribunais();
    return ok(tribunais);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        error instanceof Error ? error.message : 'Erro ao listar tribunais.',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// SERVIÇOS DE LISTAGEM (com persistência)
// =============================================================================

export async function listarComunicacoesCapturadas(
  params: ListarComunicacoesParams
): Promise<Result<PaginatedResponse<ComunicacaoCNJ>>> {
  const validation = listarComunicacoesCapturadasSchema.safeParse(params);
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'Parâmetros de listagem inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  try {
    const result = await repository.findAllComunicacoes(validation.data);
    
    if (!result.success) {
      return err(
        appError(
          'DATABASE_ERROR',
          result.error.message || 'Erro ao listar comunicações capturadas.',
          result.error.details
        )
      );
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        error instanceof Error ? error.message : 'Erro ao listar comunicações capturadas.',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO (com persistência)
// =============================================================================

export async function sincronizarComunicacoes(
  params: SincronizarParams
): Promise<Result<SincronizacaoResult>> {
  const validation = sincronizarComunicacoesSchema.safeParse(params);
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'Parâmetros de sincronização inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  const stats: SincronizacaoStats = {
    total: 0,
    novos: 0,
    duplicados: 0,
    vinculados: 0,
    expedientesCriados: 0,
    erros: 0,
  };
  const errors: string[] = [];

  try {
    const client = getComunicaCNJClient();
    let pagina = 1;
    let temMaisPaginas = true;

    while (temMaisPaginas) {
      const consultaResult = await client.consultarComunicacoes({
        numeroOab: validation.data.numeroOab,
        ufOab: validation.data.ufOab,
        siglaTribunal: validation.data.siglaTribunal,
        dataInicio: validation.data.dataInicio,
        dataFim: validation.data.dataFim,
        pagina,
        itensPorPagina: 100,
      });

      stats.total += consultaResult.data.comunicacoes.length;

      for (const comunicacao of consultaResult.data.comunicacoes) {
        try {
          const resultado = await processarComunicacao(
            comunicacao,
            validation.data.advogadoId
          );

          switch (resultado.status) {
            case 'novo':
              stats.novos++;
              if (resultado.expedienteCriado) {
                stats.expedientesCriados++;
              }
              if (resultado.vinculado) {
                stats.vinculados++;
              }
              break;
            case 'duplicado':
              stats.duplicados++;
              break;
            case 'erro':
              stats.erros++;
              if (resultado.erro) {
                errors.push(resultado.erro);
              }
              break;
          }
        } catch (error) {
          stats.erros++;
          const msg =
            error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`Erro ao processar comunicação ${comunicacao.hash}: ${msg}`);
          console.error(
            '[comunica-cnj-service] Erro ao processar comunicação:',
            error
          );
        }
      }

      temMaisPaginas = pagina < consultaResult.data.paginacao.totalPaginas;
      pagina++;
    }

    return ok({
      success: true,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[comunica-cnj-service] Erro na sincronização:', error);

    return ok({
      success: false,
      stats,
      errors: [msg, ...errors],
    });
  }
}

// =============================================================================
// PROCESSAMENTO INDIVIDUAL
// =============================================================================

interface ProcessamentoResult {
  status: 'novo' | 'duplicado' | 'erro';
  vinculado?: boolean;
  expedienteCriado?: boolean;
  erro?: string;
}

async function processarComunicacao(
  comunicacao: ComunicacaoItem,
  advogadoId?: number
): Promise<ProcessamentoResult> {
  const existenteResult = await repository.findComunicacaoByHash(comunicacao.hash);
  if (!existenteResult.success) {
    return { status: 'erro', erro: existenteResult.error.message };
  }
  if (existenteResult.data) {
    return { status: 'duplicado' };
  }

  const grau = inferirGrau(comunicacao.nomeOrgao, comunicacao.siglaTribunal);
  const numeroProcesso = normalizarNumeroProcesso(comunicacao.numeroProcesso);

  const matchParams: MatchParams = {
    numeroProcesso,
    trt: comunicacao.siglaTribunal,
    grau,
    dataDisponibilizacao: comunicacao.dataDisponibilizacao,
  };

  const expedienteResult = await repository.findExpedienteCorrespondente(matchParams);
  if (!expedienteResult.success) {
    return { status: 'erro', erro: expedienteResult.error.message };
  }

  let expedienteId = expedienteResult.data;
  let expedienteCriado = false;

  if (!expedienteId) {
    const criarResult = await criarExpedienteFromComunicacao(comunicacao, grau);
    if (!criarResult.success) {
      return { status: 'erro', erro: criarResult.error.message };
    }
    expedienteId = criarResult.data;
    expedienteCriado = true;
  }

  const dadosComunicacao: InserirComunicacaoParams = {
    idCnj: comunicacao.id,
    hash: comunicacao.hash,
    numeroComunicacao: comunicacao.numeroComunicacao,
    numeroProcesso,
    numeroProcessoMascara: comunicacao.numeroProcessoComMascara,
    siglaTribunal: comunicacao.siglaTribunal,
    orgaoId: comunicacao.idOrgao,
    nomeOrgao: comunicacao.nomeOrgao,
    tipoComunicacao: comunicacao.tipoComunicacao,
    tipoDocumento: comunicacao.tipoDocumento,
    nomeClasse: comunicacao.nomeClasse,
    codigoClasse: comunicacao.codigoClasse,
    meio: comunicacao.meio,
    meioCompleto: comunicacao.meioCompleto,
    texto: comunicacao.texto,
    link: comunicacao.link,
    dataDisponibilizacao: comunicacao.dataDisponibilizacao,
    ativo: comunicacao.ativo,
    status: comunicacao.status,
    motivoCancelamento: comunicacao.motivoCancelamento ?? null,
    dataCancelamento: comunicacao.dataCancelamento ?? null,
    destinatarios: comunicacao.destinatarios,
    destinatariosAdvogados: comunicacao.destinatarioAdvogados,
    expedienteId,
    advogadoId: advogadoId ?? undefined,
    metadados: comunicacao as unknown as Record<string, unknown>,
  };

  const inserirResult = await repository.saveComunicacao(dadosComunicacao);
  if (!inserirResult.success) {
    return { status: 'erro', erro: inserirResult.error.message };
  }

  if (!inserirResult.data) {
    return { status: 'duplicado' };
  }

  return {
    status: 'novo',
    vinculado: expedienteId !== null,
    expedienteCriado,
  };
}

// =============================================================================
// CRIAÇÃO DE EXPEDIENTE
// =============================================================================

async function buscarDataAutuacaoDoAcervo(
  numeroProcesso: string,
  siglaTribunal: string,
  grau: GrauTribunal
): Promise<{ dataAutuacao: string; processoId: number } | null> {
  const db = createServiceClient();

  const { data: processoGrauExato } = await db
    .from('acervo')
    .select('id, data_autuacao')
    .eq('numero_processo', numeroProcesso)
    .eq('trt', siglaTribunal)
    .eq('grau', grau)
    .limit(1)
    .single();

  if (processoGrauExato?.data_autuacao) {
    return {
      dataAutuacao: processoGrauExato.data_autuacao,
      processoId: processoGrauExato.id,
    };
  }

  if (grau !== 'primeiro_grau') {
    const { data: processoPrimeiroGrau } = await db
      .from('acervo')
      .select('id, data_autuacao')
      .eq('numero_processo', numeroProcesso)
      .eq('trt', siglaTribunal)
      .eq('grau', 'primeiro_grau')
      .limit(1)
      .single();

    if (processoPrimeiroGrau?.data_autuacao) {
      return {
        dataAutuacao: processoPrimeiroGrau.data_autuacao,
        processoId: processoPrimeiroGrau.id,
      };
    }
  }

  const { data: processoQualquer } = await db
    .from('acervo')
    .select('id, data_autuacao')
    .eq('numero_processo', numeroProcesso)
    .eq('trt', siglaTribunal)
    .order('data_autuacao', { ascending: true })
    .limit(1)
    .single();

  if (processoQualquer?.data_autuacao) {
    return {
      dataAutuacao: processoQualquer.data_autuacao,
      processoId: processoQualquer.id,
    };
  }

  return null;
}

async function criarExpedienteFromComunicacao(
  comunicacao: ComunicacaoItem,
  grau: GrauTribunal
): Promise<Result<number>> {
  const numeroProcesso = normalizarNumeroProcesso(comunicacao.numeroProcesso);
  const nomeParteAutora = obterNomeParteAutora(comunicacao.destinatarios);
  const nomeParteRe = obterNomeParteRe(comunicacao.destinatarios);
  const { qtdePoloAtivo, qtdePoloPassivo } = contarPartes(comunicacao.destinatarios);

  const dadosAcervo = await buscarDataAutuacaoDoAcervo(
    numeroProcesso,
    comunicacao.siglaTribunal,
    grau
  );

  const idPje = -Date.now();

  const expedienteData = {
    idPje,
    advogadoId: undefined,
    processoId: dadosAcervo?.processoId ?? undefined,
    trt: comunicacao.siglaTribunal as CodigoTribunal,
    grau: grau as unknown as import('@/app/(authenticated)/expedientes/domain').GrauTribunal,
    numeroProcesso,
    descricaoOrgaoJulgador: comunicacao.nomeOrgao || 'Não especificado',
    classeJudicial: comunicacao.nomeClasse || 'Não especificado',
    numero: '0',
    segredoJustica: false,
    codigoStatusProcesso: 'DISTRIBUIDO',
    prioridadeProcessual: false,
    nomeParteAutora,
    qtdeParteAutora: qtdePoloAtivo,
    nomeParteRe,
    qtdeParteRe: qtdePoloPassivo,
    dataAutuacao: dadosAcervo?.dataAutuacao ?? undefined,
    juizoDigital: false,
    dataArquivamento: undefined,
    idDocumento: undefined,
    dataCienciaParte: comunicacao.dataDisponibilizacao,
    dataPrazoLegalParte: comunicacao.dataDisponibilizacao,
    dataCriacaoExpediente: comunicacao.dataDisponibilizacao,
    prazoVencido: false,
    siglaOrgaoJulgador: undefined,
    dadosAnteriores: undefined,
    responsavelId: undefined,
    baixadoEm: undefined,
    protocoloId: undefined,
    justificativaBaixa: undefined,
    tipoExpedienteId: undefined,
    descricaoArquivos: comunicacao.tipoComunicacao || 'Comunicação CNJ',
    arquivoNome: undefined,
    arquivoUrl: undefined,
    arquivoBucket: undefined,
    arquivoKey: undefined,
    observacoes: undefined,
    origem: OrigemExpediente.COMUNICA_CNJ,
  };

  // WARNING: criarExpediente imported from core/expedientes/service might work, but it might use older db client
  const criarResult = await criarExpediente(expedienteData);
  if (!criarResult.success) {
    return err(criarResult.error);
  }

  return ok(criarResult.data.id);
}

export async function vincularComunicacaoAExpediente(
  comunicacaoId: number,
  expedienteId: number
): Promise<Result<void>> {
  const validation = vincularExpedienteSchema.safeParse({
    comunicacaoId,
    expedienteId,
  });
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'IDs inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  const comunicacaoResult = await repository.findComunicacaoById(comunicacaoId);
  if (!comunicacaoResult.success) {
    return err(comunicacaoResult.error);
  }
  if (!comunicacaoResult.data) {
    return err(appError('NOT_FOUND', 'Comunicação não encontrada.'));
  }

  // Using dynamic import or direct import depending on how we handle expedientes
  // Since we are inside feature, we should ideally use feature-to-feature communication or core.
  const { findExpedienteById } = await import('@/app/(authenticated)/expedientes/repository'); 
  const expedienteResult = await findExpedienteById(expedienteId);
  if (!expedienteResult.success) {
    return err(expedienteResult.error);
  }
  if (!expedienteResult.data) {
    return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  }

  const vincularResult = await repository.vincularExpediente(
    comunicacaoId,
    expedienteId
  );
  if (!vincularResult.success) {
    return err(vincularResult.error);
  }

  return ok(undefined);
}
