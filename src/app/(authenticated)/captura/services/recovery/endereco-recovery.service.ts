/**
 * Serviço de Recuperação de Endereços
 *
 * PROPÓSITO:
 * Re-persiste endereços que falharam durante a captura original,
 * usando os dados brutos salvos em logs brutos (Postgres).
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { upsertEnderecoPorIdPje } from '@/app/(authenticated)/enderecos';

type UpsertEnderecoPorIdPjeParams = Parameters<typeof upsertEnderecoPorIdPje>[0];
import { withRetry } from '@/lib/utils/retry';
import type { EntidadeTipoEndereco, SituacaoEndereco } from '@/app/(authenticated)/enderecos/types';
import { buscarLogPorRawLogId } from './captura-recovery.service';
import { analisarDocumento } from './recovery-analysis.service';
import type {
  ReprocessarParams,
  ReprocessarResult,
  ResultadoDocumento,
  ResultadoElemento,
  EnderecoPJEPayload,
  PartePJEPayload,
  ElementoRecuperavel,
} from './types';

// ============================================================================
// Constantes
// ============================================================================

const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 500,
  maxDelay: 5000,
};

// ============================================================================
// Funções de Re-Processamento
// ============================================================================

/**
 * Re-processa elementos de múltiplos logs brutos
 *
 * @param params - Parâmetros de re-processamento
 * @returns Resultado completo do re-processamento
 */
export async function reprocessarElementos(
  params: ReprocessarParams
): Promise<ReprocessarResult> {
  const inicio = performance.now();
  const {
    rawLogIds,
    tiposElementos = ['endereco'],
    filtros = { apenasGaps: true, forcarAtualizacao: false },
  } = params;

  const documentos: ResultadoDocumento[] = [];
  let totalElementos = 0;
  let totalSucessos = 0;
  let totalErros = 0;

  for (const rawLogId of rawLogIds) {
    const resultadoDoc = await reprocessarDocumento(rawLogId, tiposElementos, filtros);
    documentos.push(resultadoDoc);

    totalElementos += resultadoDoc.totalProcessados;
    totalSucessos += resultadoDoc.totalSucessos;
    totalErros += resultadoDoc.totalErros;
  }

  return {
    sucesso: totalErros === 0,
    totalDocumentos: rawLogIds.length,
    totalElementos,
    totalSucessos,
    totalErros,
    documentos,
    duracaoMs: Math.round(performance.now() - inicio),
  };
}

/**
 * Re-processa elementos de um único log bruto
 */
async function reprocessarDocumento(
  rawLogId: string,
  tiposElementos: string[],
  filtros: { apenasGaps?: boolean; forcarAtualizacao?: boolean }
): Promise<ResultadoDocumento> {
  const inicio = performance.now();
  const elementos: ResultadoElemento[] = [];

  const documento = await buscarLogPorRawLogId(rawLogId);

  if (!documento || !(documento as any).payload_bruto) {
    return {
      rawLogId,
      numeroProcesso: 'N/A',
      sucesso: false,
      totalProcessados: 0,
      totalSucessos: 0,
      totalErros: 1,
      elementos: [
        {
          tipo: 'endereco',
          identificador: 'N/A',
          nome: 'N/A',
          sucesso: false,
          acao: 'erro',
          erro: documento
            ? 'Payload bruto não disponível'
            : 'Documento não encontrado',
        },
      ],
      duracaoMs: Math.round(performance.now() - inicio),
    };
  }

  // Analisar documento para identificar gaps
  const analise = await analisarDocumento(documento);

  // Processar endereços se solicitado
  if (tiposElementos.includes('endereco')) {
    const elementosEndereco = filtros.apenasGaps
      ? analise.gaps.enderecosFaltantes
      : await extrairTodosEnderecos((documento as any).payload_bruto);

    for (const elemento of elementosEndereco) {
      const resultado = await reprocessarEndereco(
        elemento,
        filtros.forcarAtualizacao ?? false
      );
      elementos.push(resultado);
    }
  }

  // Calcular totais
  const totalProcessados = elementos.length;
  const totalSucessos = elementos.filter((e) => e.sucesso).length;
  const totalErros = elementos.filter((e) => !e.sucesso).length;

  return {
    rawLogId,
    numeroProcesso: analise.processo.numeroProcesso,
    sucesso: totalErros === 0,
    totalProcessados,
    totalSucessos,
    totalErros,
    elementos,
    duracaoMs: Math.round(performance.now() - inicio),
  };
}

/**
 * Re-processa um endereço individual
 */
async function reprocessarEndereco(
  elemento: ElementoRecuperavel,
  forcarAtualizacao: boolean
): Promise<ResultadoElemento> {
  const { identificador, nome, dadosBrutos, contexto } = elemento;

  // Verificar se temos contexto necessário
  if (!contexto?.entidadeId || !contexto?.entidadeTipo) {
    return {
      tipo: 'endereco',
      identificador,
      nome,
      sucesso: false,
      acao: 'erro',
      erro: 'Contexto de entidade não disponível (entidadeId ou entidadeTipo)',
    };
  }

  const enderecoPJE = dadosBrutos as unknown as EnderecoPJEPayload;

  // Verificar se endereço já existe (se não forçar atualização)
  if (!forcarAtualizacao) {
    const existe = await verificarEnderecoExistente(
      contexto.entidadeTipo as EntidadeTipoEndereco,
      contexto.entidadeId,
      enderecoPJE
    );

    if (existe) {
      return {
        tipo: 'endereco',
        identificador,
        nome,
        sucesso: true,
        acao: 'ignorado',
        registroId: existe.id,
      };
    }
  }

  // Montar parâmetros de upsert
  const upsertParams = montarParametrosEndereco(
    enderecoPJE,
    contexto.entidadeTipo as EntidadeTipoEndereco,
    contexto.entidadeId
  );

  try {
    // Executar upsert com retry
    const resultado = await withRetry(
      () => upsertEnderecoPorIdPje(upsertParams),
      RETRY_CONFIG
    );

    if (resultado.success && resultado.data) {
      // Vincular endereço à entidade
      await vincularEnderecoEntidade(
        contexto.entidadeTipo as EntidadeTipoEndereco,
        contexto.entidadeId,
        resultado.data.id
      );

      return {
        tipo: 'endereco',
        identificador,
        nome,
        sucesso: true,
        acao: forcarAtualizacao ? 'atualizado' : 'criado',
        registroId: resultado.data.id,
      };
    }

    return {
      tipo: 'endereco',
      identificador,
      nome,
      sucesso: false,
      acao: 'erro',
      erro: resultado.success ? 'Erro desconhecido no upsert' : resultado.error.message,
    };
  } catch (error) {
    return {
      tipo: 'endereco',
      identificador,
      nome,
      sucesso: false,
      acao: 'erro',
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Verifica se endereço já existe no banco
 */
async function verificarEnderecoExistente(
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number,
  enderecoPJE: EnderecoPJEPayload
): Promise<{ id: number } | null> {
  const supabase = createServiceClient();

  // Tentar buscar por id_pje primeiro
  if (enderecoPJE.id) {
    const { data } = await supabase
      .from('enderecos')
      .select('id')
      .eq('id_pje', enderecoPJE.id)
      .eq('entidade_tipo', entidadeTipo)
      .eq('entidade_id', entidadeId)
      .eq('ativo', true)
      .maybeSingle();

    if (data) {
      return { id: data.id };
    }
  }

  return null;
}

/**
 * Monta parâmetros para upsert de endereço
 */
function montarParametrosEndereco(
  enderecoPJE: EnderecoPJEPayload,
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number
): UpsertEnderecoPorIdPjeParams {
  return {
    id_pje: Number(enderecoPJE.id ?? 0),
    entidade_tipo: entidadeTipo,
    entidade_id: entidadeId,
    logradouro: enderecoPJE.logradouro ? String(enderecoPJE.logradouro) : undefined,
    numero: enderecoPJE.numero ? String(enderecoPJE.numero) : undefined,
    complemento: enderecoPJE.complemento ? String(enderecoPJE.complemento) : undefined,
    bairro: enderecoPJE.bairro ? String(enderecoPJE.bairro) : undefined,
    cep: enderecoPJE.nroCep ? String(enderecoPJE.nroCep) : undefined,
    id_municipio_pje: enderecoPJE.idMunicipio ? Number(enderecoPJE.idMunicipio) : undefined,
    municipio: enderecoPJE.municipio ? String(enderecoPJE.municipio) : undefined,
    municipio_ibge: enderecoPJE.municipioIbge ? String(enderecoPJE.municipioIbge) : undefined,
    estado_id_pje: enderecoPJE.estado?.id ? Number(enderecoPJE.estado.id) : undefined,
    estado_sigla: enderecoPJE.estado?.sigla ? String(enderecoPJE.estado.sigla) : undefined,
    estado_descricao: enderecoPJE.estado?.descricao
      ? String(enderecoPJE.estado.descricao)
      : undefined,
    estado: enderecoPJE.estado?.sigla ? String(enderecoPJE.estado.sigla) : undefined,
    pais_id_pje: enderecoPJE.pais?.id ? Number(enderecoPJE.pais.id) : undefined,
    pais_codigo: enderecoPJE.pais?.codigo ? String(enderecoPJE.pais.codigo) : undefined,
    pais_descricao: enderecoPJE.pais?.descricao ? String(enderecoPJE.pais.descricao) : undefined,
    pais: enderecoPJE.pais?.descricao ? String(enderecoPJE.pais.descricao) : undefined,
    classificacoes_endereco: enderecoPJE.classificacoesEndereco ?? undefined,
    correspondencia:
      enderecoPJE.correspondencia !== undefined
        ? Boolean(enderecoPJE.correspondencia)
        : undefined,
    situacao: (enderecoPJE.situacao as SituacaoEndereco) ?? undefined,
    id_usuario_cadastrador_pje: enderecoPJE.idUsuarioCadastrador
      ? Number(enderecoPJE.idUsuarioCadastrador)
      : undefined,
    data_alteracao_pje: enderecoPJE.dtAlteracao ? String(enderecoPJE.dtAlteracao) : undefined,
    dados_pje_completo: enderecoPJE as unknown as Record<string, unknown>,
  };
}

/**
 * Vincula endereço à entidade (atualiza FK endereco_id)
 */
async function vincularEnderecoEntidade(
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number,
  enderecoId: number
): Promise<void> {
  const supabase = createServiceClient();

  let tabela: string;
  switch (entidadeTipo) {
    case 'cliente':
      tabela = 'clientes';
      break;
    case 'parte_contraria':
      tabela = 'partes_contrarias';
      break;
    case 'terceiro':
      tabela = 'terceiros';
      break;
    default:
      return;
  }

  await supabase.from(tabela).update({ endereco_id: enderecoId }).eq('id', entidadeId);
}

/**
 * Extrai todos os endereços do payload bruto (não apenas gaps)
 * Busca o entidadeId correspondente no PostgreSQL
 */
async function extrairTodosEnderecos(payload: unknown): Promise<ElementoRecuperavel[]> {
  const elementos: ElementoRecuperavel[] = [];
  const supabase = createServiceClient();

  const partes = extrairPartes(payload);

  for (const parte of partes) {
    if (parte.dadosCompletos?.endereco) {
      const entidadeTipo = identificarTipoEntidade(parte);

      // Buscar entidadeId no banco se a parte tiver documento
      let entidadeId: number | undefined;
      let erro: string | undefined;

      if (parte.numeroDocumento) {
        const entidadeInfo = await buscarEntidadePorDocumento(
          supabase,
          entidadeTipo,
          parte.numeroDocumento
        );

        if (entidadeInfo) {
          entidadeId = entidadeInfo.id;
        } else {
          erro = 'Parte principal não existe no banco';
        }
      } else {
        erro = 'Parte sem documento (CPF/CNPJ)';
      }

      elementos.push({
        tipo: 'endereco',
        identificador: String(parte.dadosCompletos.endereco.id ?? parte.numeroDocumento ?? 'N/A'),
        nome: `Endereço de ${parte.nome ?? 'N/A'}`,
        dadosBrutos: parte.dadosCompletos.endereco as unknown as Record<string, unknown>,
        statusPersistencia: entidadeId ? 'pendente' : 'erro',
        contexto: {
          entidadeTipo,
          entidadeId,
        },
        erro,
      });
    }
  }

  return elementos;
}

/**
 * Busca entidade por documento (CPF/CNPJ)
 */
async function buscarEntidadePorDocumento(
  supabase: ReturnType<typeof createServiceClient>,
  tipo: EntidadeTipoEndereco,
  documento: string
): Promise<{ id: number } | null> {
  const documentoLimpo = documento.replace(/\D/g, '');
  const isCpf = documentoLimpo.length === 11;
  const campo = isCpf ? 'cpf' : 'cnpj';

  let tabela: string;
  switch (tipo) {
    case 'cliente':
      tabela = 'clientes';
      break;
    case 'parte_contraria':
      tabela = 'partes_contrarias';
      break;
    case 'terceiro':
      tabela = 'terceiros';
      break;
    default:
      return null;
  }

  const { data, error } = await supabase
    .from(tabela)
    .select('id')
    .eq(campo, documentoLimpo)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { id: data.id };
}

/**
 * Extrai partes do payload
 */
function extrairPartes(payload: unknown): PartePJEPayload[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as PartePJEPayload[];
  }

  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.partes)) {
    return obj.partes as PartePJEPayload[];
  }
  if (Array.isArray(obj.data)) {
    return obj.data as PartePJEPayload[];
  }
  if (Array.isArray(obj.content)) {
    return obj.content as PartePJEPayload[];
  }

  return [];
}

/**
 * Identifica tipo de entidade baseado no polo
 */
function identificarTipoEntidade(parte: PartePJEPayload): EntidadeTipoEndereco {
  const polo = parte.polo?.toUpperCase();

  if (polo === 'AT' || polo === 'ATIVO') {
    return 'cliente';
  }
  if (polo === 'PA' || polo === 'PASSIVO') {
    return 'parte_contraria';
  }

  return 'parte_contraria';
}

// ============================================================================
// Funções de Recuperação Específicas
// ============================================================================

/**
 * Re-processa endereços de uma captura específica (por captura_log_id)
 *
 * @param capturaLogId - ID do log no PostgreSQL
 * @param filtros - Opções de filtro
 * @returns Resultado do re-processamento
 */
export async function reprocessarEnderecosPorCapturaLogId(
  capturaLogId: number,
  filtros?: { apenasGaps?: boolean; forcarAtualizacao?: boolean }
): Promise<ReprocessarResult> {
  // Buscar todos os logs brutos dessa captura
  const { buscarLogsPorCapturaLogId } = await import('./captura-recovery.service');
  const documentos = await buscarLogsPorCapturaLogId(capturaLogId);

  if (documentos.length === 0) {
    return {
      sucesso: false,
      totalDocumentos: 0,
      totalElementos: 0,
      totalSucessos: 0,
      totalErros: 1,
      documentos: [],
      duracaoMs: 0,
    };
  }

  const rawLogIds = documentos.map((d: any) => d.raw_log_id as string);

  return reprocessarElementos({
    rawLogIds,
    tiposElementos: ['endereco'],
    filtros: filtros ?? { apenasGaps: true, forcarAtualizacao: false },
  });
}

/**
 * Re-processa endereço individual por identificadores
 *
 * @param rawLogId - ID do log bruto
 * @param entidadeTipo - Tipo da entidade
 * @param entidadeId - ID da entidade
 * @param idPjeEndereco - ID do endereço no PJE
 * @returns Resultado do re-processamento
 */
export async function reprocessarEnderecoIndividual(
  rawLogId: string,
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number,
  idPjeEndereco?: number
): Promise<ResultadoElemento> {
  const documento = await buscarLogPorRawLogId(rawLogId);

  if (!documento || !(documento as any).payload_bruto) {
    return {
      tipo: 'endereco',
      identificador: String(idPjeEndereco ?? 'N/A'),
      nome: 'N/A',
      sucesso: false,
      acao: 'erro',
      erro: 'Documento ou payload não encontrado',
    };
  }

  // Buscar endereço específico no payload
  const partes = extrairPartes((documento as any).payload_bruto);
  let enderecoEncontrado: EnderecoPJEPayload | null = null;

  for (const parte of partes) {
    if (parte.dadosCompletos?.endereco) {
      const endereco = parte.dadosCompletos.endereco as EnderecoPJEPayload;
      if (idPjeEndereco && endereco.id === idPjeEndereco) {
        enderecoEncontrado = endereco;
        break;
      }
    }
  }

  if (!enderecoEncontrado) {
    return {
      tipo: 'endereco',
      identificador: String(idPjeEndereco ?? 'N/A'),
      nome: 'N/A',
      sucesso: false,
      acao: 'erro',
      erro: 'Endereço não encontrado no payload',
    };
  }

  const elemento: ElementoRecuperavel = {
    tipo: 'endereco',
    identificador: String(enderecoEncontrado.id ?? 'N/A'),
    nome: `Endereço (id_pje: ${enderecoEncontrado.id})`,
    dadosBrutos: enderecoEncontrado as unknown as Record<string, unknown>,
    statusPersistencia: 'pendente',
    contexto: {
      entidadeId,
      entidadeTipo,
    },
  };

  return reprocessarEndereco(elemento, true);
}

