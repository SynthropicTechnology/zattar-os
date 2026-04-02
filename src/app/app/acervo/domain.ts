/**
 * Domain Layer for Acervo Feature
 * Business logic and domain rules
 */

import { z } from 'zod';
import { StatusProcesso } from '@/app/app/processos';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';

// Re-export timeline types for convenience
export type { TimelineItemEnriquecido };

/**
 * Estrutura da timeline armazenada em JSONB
 */
export interface TimelineJSONB {
  timeline: TimelineItemEnriquecido[];
  metadata: {
    totalDocumentos: number;
    totalMovimentos: number;
    totalDocumentosBaixados: number;
    capturadoEm: string; // ISO 8601
    schemaVersion: number;
  };
}

// ============================================================================
// Domain Types
// ============================================================================

export type OrigemAcervo = 'acervo_geral' | 'arquivado';
export type GrauAcervo = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

export interface Acervo {
  id: number;
  id_pje: number;
  advogado_id: number;
  origem: OrigemAcervo;
  trt: string;
  grau: GrauAcervo;
  numero_processo: string;
  numero: number;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  classe_judicial_id: number | null;
  segredo_justica: boolean;
  status: StatusProcesso; // Campo derivado de codigo_status_processo
  codigo_status_processo: string;
  prioridade_processual: number;
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
  data_autuacao: string;
  juizo_digital: boolean;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
  tem_associacao: boolean;
  responsavel_id: number | null;
  dados_anteriores: Record<string, unknown> | null;
  timeline_jsonb?: TimelineJSONB | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessoInstancia {
  id: number;
  origem: OrigemAcervo;
  trt: string;
  grau: GrauAcervo;
  numero_processo: string;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  data_autuacao: string;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
}

export interface ProcessoUnificado {
  numero_processo: string;
  trt: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  segredo_justica: boolean;
  responsavel_id: number | null;
  tem_associacao: boolean;
  instancias: ProcessoInstancia[];
  data_autuacao_mais_antiga: string;
  data_proxima_audiencia: string | null;
}

export interface AgrupamentoAcervo {
  grupo: string;
  quantidade: number;
  processos?: Acervo[];
}

// ============================================================================
// Service Params & Results
// ============================================================================

export type OrdenarPorAcervo =
  | 'data_autuacao'
  | 'data_arquivamento'
  | 'data_proxima_audiencia'
  | 'numero_processo'
  | 'nome_parte_autora'
  | 'nome_parte_re'
  | 'descricao_orgao_julgador'
  | 'classe_judicial'
  | 'created_at'
  | 'updated_at';

export type AgruparPorAcervo =
  | 'trt'
  | 'grau'
  | 'origem'
  | 'responsavel_id'
  | 'classe_judicial'
  | 'codigo_status_processo'
  | 'orgao_julgador'
  | 'mes_autuacao'
  | 'ano_autuacao';

export type OrdemAcervo = 'asc' | 'desc';

export interface ListarAcervoParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  origem?: OrigemAcervo;
  trt?: string;
  grau?: GrauAcervo;

  // Filtros de responsável
  responsavel_id?: number | 'null';
  sem_responsavel?: boolean;

  // Busca textual
  busca?: string;

  // Filtros específicos
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;

  // Filtros booleanos
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  tem_associacao?: boolean;
  tem_proxima_audiencia?: boolean;

  // Filtros de data
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;
  data_arquivamento_inicio?: string;
  data_arquivamento_fim?: string;
  data_proxima_audiencia_inicio?: string;
  data_proxima_audiencia_fim?: string;

  // Ordenação
  ordenar_por?: OrdenarPorAcervo;
  ordem?: OrdemAcervo;

  // Agrupamento
  agrupar_por?: AgruparPorAcervo;
  incluir_contagem?: boolean;

  // Unificação
  unified?: boolean;
}

export interface ListarAcervoResult {
  processos: Acervo[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface ListarAcervoAgrupadoResult {
  agrupamentos: AgrupamentoAcervo[];
  total: number;
}

export interface ListarAcervoUnificadoResult {
  processos: ProcessoUnificado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// ============================================================================
// Timeline Types (for CPF-based queries)
// ============================================================================

export interface ProcessoClienteCpfRow {
  cpf: string;
  cliente_nome: string;
  cliente_id: number;
  tipo_parte: string;
  polo: string;
  parte_principal: boolean;
  processo_id: number;
  id_pje: string;
  advogado_id: number;
  numero_processo: string;
  trt: string;
  grau: GrauAcervo;
  classe_judicial: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  descricao_orgao_julgador: string;
  codigo_status_processo: string;
  origem: OrigemAcervo;
  data_autuacao: string;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
  segredo_justica: boolean;
  timeline_jsonb: TimelineJSONB | null;
}

export interface ClienteRespostaIA {
  nome: string;
  cpf: string;
}

export interface ResumoProcessosIA {
  total_processos: number;
  com_audiencia_proxima: number;
}

export interface InstanciaProcessoIA {
  vara: string | undefined;
  data_inicio: string;
  proxima_audiencia: string | null;
}

export interface TimelineItemIA {
  data: string;
  evento: string;
  descricao: string;
  tem_documento: boolean;
}

export interface UltimaMovimentacaoIA {
  data: string;
  evento: string;
}

export type TimelineStatus = 'disponivel' | 'sincronizando' | 'indisponivel' | 'erro';

export interface ProcessoRespostaIA {
  numero: string;
  tipo: string;
  papel_cliente: string;
  parte_contraria: string;
  tribunal: string;
  sigilo: boolean;
  instancias: {
    primeiro_grau: InstanciaProcessoIA | null;
    segundo_grau: InstanciaProcessoIA | null;
  };
  timeline?: TimelineItemIA[];
  timeline_status: TimelineStatus;
  timeline_mensagem?: string;
  ultima_movimentacao?: UltimaMovimentacaoIA | null;
}

export interface ProcessosClienteCpfSuccessResponse {
  success: true;
  data: {
    cliente: ClienteRespostaIA;
    resumo: ResumoProcessosIA;
    processos: ProcessoRespostaIA[];
  };
}

export interface ProcessosClienteCpfErrorResponse {
  success: false;
  error: string;
}

export type ProcessosClienteCpfResponse =
  | ProcessosClienteCpfSuccessResponse
  | ProcessosClienteCpfErrorResponse;

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const listarAcervoParamsSchema = z.object({
  pagina: z.number().int().positive().optional(),
  limite: z.number().int().positive().max(2000).optional(),
  origem: z.enum(['acervo_geral', 'arquivado']).optional(),
  trt: z.string().optional(),
  grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
  responsavel_id: z.union([z.number(), z.literal('null')]).optional(),
  sem_responsavel: z.boolean().optional(),
  busca: z.string().optional(),
  numero_processo: z.string().optional(),
  nome_parte_autora: z.string().optional(),
  nome_parte_re: z.string().optional(),
  descricao_orgao_julgador: z.string().optional(),
  classe_judicial: z.string().optional(),
  codigo_status_processo: z.string().optional(),
  segredo_justica: z.boolean().optional(),
  juizo_digital: z.boolean().optional(),
  tem_associacao: z.boolean().optional(),
  tem_proxima_audiencia: z.boolean().optional(),
  data_autuacao_inicio: z.string().optional(),
  data_autuacao_fim: z.string().optional(),
  data_arquivamento_inicio: z.string().optional(),
  data_arquivamento_fim: z.string().optional(),
  data_proxima_audiencia_inicio: z.string().optional(),
  data_proxima_audiencia_fim: z.string().optional(),
  ordenar_por: z.enum([
    'data_autuacao',
    'data_arquivamento',
    'data_proxima_audiencia',
    'numero_processo',
    'nome_parte_autora',
    'nome_parte_re',
    'descricao_orgao_julgador',
    'classe_judicial',
    'created_at',
    'updated_at',
  ]).optional(),
  ordem: z.enum(['asc', 'desc']).optional(),
  agrupar_por: z.enum([
    'trt',
    'grau',
    'origem',
    'responsavel_id',
    'classe_judicial',
    'codigo_status_processo',
    'orgao_julgador',
    'mes_autuacao',
    'ano_autuacao',
  ]).optional(),
  incluir_contagem: z.boolean().optional(),
  unified: z.boolean().optional(),
});

export const atribuirResponsavelSchema = z.object({
  processoIds: z.array(z.number()).min(1),
  responsavelId: z.number().nullable(),
});

// ============================================================================
// Processos Cliente CPF Types
// ============================================================================

export interface InstanciaInfo {
  numero_processo: string;
  classe_judicial: string;
  orgao_julgador: string;
  data_autuacao?: string;
  valor_causa?: number;
  segredo_justica?: boolean;
}

export interface ProcessoClienteCPF {
  numero_processo: string;
  classe_judicial: string;
  tipo_parte: string;
  trt: string;
  grau: string;
  origem: string;
  segredo_justica: boolean;
  cpf?: string;
  cliente_nome?: string;

  // Consolidated data
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  data_autuacao?: string;
  codigo_status_processo?: string;
  status?: string;
  responsavel_id?: number;

  // Instances
  instancias: {
    primeiro_grau?: InstanciaInfo;
    segundo_grau?: InstanciaInfo;
    tst?: InstanciaInfo;
  };

  // Timeline
  timeline?: TimelineItemIA[];
  timeline_status?: TimelineStatus;
  timeline_ultimo_update?: string;

  // Internal flags
  tem_timeline?: boolean;
  tem_detalhes?: boolean;
}

export interface BuscarProcessosClienteCPFParams {
  cpf: string;
  timeline?: boolean;
  timelineMensagem?: string;
  timelineStatus?: TimelineStatus;
}

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Maps PJE status code to StatusProcesso enum
 */
export function mapearStatusProcesso(codigo: string | null | undefined): StatusProcesso {
  if (!codigo) return StatusProcesso.OUTRO;
  const codigoUpper = codigo.toUpperCase();

  if (codigoUpper.includes('ATIVO') || codigoUpper === 'A') return StatusProcesso.ATIVO;
  if (codigoUpper.includes('SUSPENSO') || codigoUpper === 'S') return StatusProcesso.SUSPENSO;
  if (codigoUpper.includes('ARQUIVADO') || codigoUpper === 'ARQ') return StatusProcesso.ARQUIVADO;
  if (codigoUpper.includes('EXTINTO') || codigoUpper === 'E') return StatusProcesso.EXTINTO;
  if (codigoUpper.includes('BAIXADO') || codigoUpper === 'B') return StatusProcesso.BAIXADO;
  if (codigoUpper.includes('PENDENTE') || codigoUpper === 'P') return StatusProcesso.PENDENTE;
  if (codigoUpper.includes('RECURSO') || codigoUpper === 'R') return StatusProcesso.EM_RECURSO;

  return StatusProcesso.OUTRO;
}

/**
 * Converts database record to Acervo domain object
 */
export function converterParaAcervo(data: Record<string, unknown>): Acervo {
  const codigoStatus = data.codigo_status_processo as string;
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    timeline_jsonb: (data.timeline_jsonb as TimelineJSONB | null) ?? null,
    origem: data.origem as 'acervo_geral' | 'arquivado',
    trt: data.trt as string,
    grau: data.grau as 'primeiro_grau' | 'segundo_grau',
    numero_processo: data.numero_processo as string,
    numero: data.numero as number,
    descricao_orgao_julgador: data.descricao_orgao_julgador as string,
    classe_judicial: data.classe_judicial as string,
    classe_judicial_id: (data.classe_judicial_id as number | null) ?? null,
    segredo_justica: data.segredo_justica as boolean,
    status: mapearStatusProcesso(codigoStatus),
    codigo_status_processo: codigoStatus,
    prioridade_processual: data.prioridade_processual as number,
    nome_parte_autora: data.nome_parte_autora as string,
    qtde_parte_autora: data.qtde_parte_autora as number,
    nome_parte_re: data.nome_parte_re as string,
    qtde_parte_re: data.qtde_parte_re as number,
    data_autuacao: data.data_autuacao as string,
    juizo_digital: data.juizo_digital as boolean,
    data_arquivamento: (data.data_arquivamento as string | null) ?? null,
    data_proxima_audiencia: (data.data_proxima_audiencia as string | null) ?? null,
    tem_associacao: data.tem_associacao as boolean,
    responsavel_id: (data.responsavel_id as number | null) ?? null,
    dados_anteriores: (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * TRT name mappings
 */
export const TRT_NOMES: Record<string, string> = {
  TRT1: 'TRT da 1ª Região (RJ)',
  TRT2: 'TRT da 2ª Região (SP Capital)',
  TRT3: 'TRT da 3ª Região (MG)',
  TRT4: 'TRT da 4ª Região (RS)',
  TRT5: 'TRT da 5ª Região (BA)',
  TRT6: 'TRT da 6ª Região (PE)',
  TRT7: 'TRT da 7ª Região (CE)',
  TRT8: 'TRT da 8ª Região (PA/AP)',
  TRT9: 'TRT da 9ª Região (PR)',
  TRT10: 'TRT da 10ª Região (DF/TO)',
  TRT11: 'TRT da 11ª Região (AM/RR)',
  TRT12: 'TRT da 12ª Região (SC)',
  TRT13: 'TRT da 13ª Região (PB)',
  TRT14: 'TRT da 14ª Região (RO/AC)',
  TRT15: 'TRT da 15ª Região (Campinas)',
  TRT16: 'TRT da 16ª Região (MA)',
  TRT17: 'TRT da 17ª Região (ES)',
  TRT18: 'TRT da 18ª Região (GO)',
  TRT19: 'TRT da 19ª Região (AL)',
  TRT20: 'TRT da 20ª Região (SE)',
  TRT21: 'TRT da 21ª Região (RN)',
  TRT22: 'TRT da 22ª Região (PI)',
  TRT23: 'TRT da 23ª Região (MT)',
  TRT24: 'TRT da 24ª Região (MS)',
};

/**
 * Tipo de parte name mappings
 */
export const TIPO_PARTE_NOMES: Record<string, string> = {
  AUTOR: 'Autor',
  REU: 'Réu',
  RECLAMANTE: 'Reclamante',
  RECLAMADO: 'Reclamado',
  EXEQUENTE: 'Exequente',
  EXECUTADO: 'Executado',
  EMBARGANTE: 'Embargante',
  EMBARGADO: 'Embargado',
  APELANTE: 'Apelante',
  APELADO: 'Apelado',
  AGRAVANTE: 'Agravante',
  AGRAVADO: 'Agravado',
  PERITO: 'Perito',
  MINISTERIO_PUBLICO: 'Ministério Público',
  ASSISTENTE: 'Assistente',
  TESTEMUNHA: 'Testemunha',
  CUSTOS_LEGIS: 'Custos Legis',
  AMICUS_CURIAE: 'Amicus Curiae',
  OUTRO: 'Outro',
};

/**
 * Classe judicial name mappings
 */
export const CLASSE_JUDICIAL_NOMES: Record<string, string> = {
  ATOrd: 'Ação Trabalhista Ordinária',
  ATSum: 'Ação Trabalhista Sumaríssima',
  AIRO: 'Ação de Inquérito para Apuração de Falta Grave',
  ACP: 'Ação Civil Pública',
  ACPCiv: 'Ação Civil Pública Cível',
  MS: 'Mandado de Segurança',
  MSCol: 'Mandado de Segurança Coletivo',
  RO: 'Recurso Ordinário',
  ROT: 'Recurso Ordinário Trabalhista',
  AIRR: 'Agravo de Instrumento em Recurso de Revista',
  RR: 'Recurso de Revista',
  Ag: 'Agravo',
  AP: 'Agravo de Petição',
  ED: 'Embargos de Declaração',
  ExFis: 'Execução Fiscal',
  ExTrab: 'Execução Trabalhista',
  CumSen: 'Cumprimento de Sentença',
};

// =============================================================================
// COLUMN SELECTION HELPERS (Disk I/O Optimization)
// =============================================================================

/**
 * Colunas básicas para listagem de acervo
 * Inclui todas as colunas requeridas por converterParaAcervo
 * Exclui timeline_jsonb que pode ser muito grande
 */
export function getAcervoColumnsBasic(): string {
  return `
    id,
    id_pje,
    advogado_id,
    numero_processo,
    numero,
    nome_parte_autora,
    qtde_parte_autora,
    nome_parte_re,
    qtde_parte_re,
    data_autuacao,
    codigo_status_processo,
    responsavel_id,
    data_proxima_audiencia,
    trt,
    grau,
    origem,
    classe_judicial,
    classe_judicial_id,
    descricao_orgao_julgador,
    segredo_justica,
    tem_associacao,
    juizo_digital,
    prioridade_processual,
    data_arquivamento,
    dados_anteriores,
    created_at,
    updated_at
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas completas incluindo timeline_jsonb
 * Usado apenas quando timeline é necessária
 */
export function getAcervoColumnsFull(): string {
  return `
    id,
    id_pje,
    advogado_id,
    origem,
    trt,
    grau,
    numero_processo,
    numero,
    descricao_orgao_julgador,
    classe_judicial,
    classe_judicial_id,
    segredo_justica,
    codigo_status_processo,
    prioridade_processual,
    nome_parte_autora,
    qtde_parte_autora,
    nome_parte_re,
    qtde_parte_re,
    data_autuacao,
    juizo_digital,
    data_arquivamento,
    data_proxima_audiencia,
    tem_associacao,
    responsavel_id,
    dados_anteriores,
    timeline_jsonb,
    created_at,
    updated_at
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas para queries de cliente por CPF (inclui timeline)
 */
export function getAcervoColumnsClienteCpf(): string {
  return `
    id,
    id_pje,
    advogado_id,
    numero_processo,
    trt,
    grau,
    classe_judicial,
    nome_parte_autora,
    nome_parte_re,
    descricao_orgao_julgador,
    codigo_status_processo,
    origem,
    data_autuacao,
    data_arquivamento,
    data_proxima_audiencia,
    segredo_justica,
    timeline_jsonb
  `.trim().replace(/\s+/g, ' ');
}
