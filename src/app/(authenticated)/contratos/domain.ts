/**
 * CONTRATOS FEATURE - Tipos e Schemas de Validação
 *
 * Módulo para gerenciamento de contratos jurídicos.
 * Mapeia todos os campos da tabela contratos do banco de dados.
 *
 * CONVENÇÕES:
 * - Prefixar schemas de criação com "create" (ex: createContratoSchema)
 * - Prefixar schemas de atualização com "update" (ex: updateContratoSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 */

import { z } from 'zod';

// =============================================================================
// TIPOS BASE (ENUMS)
// =============================================================================

/**
 * Tipos de segmentos disponíveis no sistema
 */
export type SegmentoTipo =
  | 'trabalhista'
  | 'civil'
  | 'previdenciario'
  | 'criminal'
  | 'empresarial'
  | 'administrativo';

/**
 * Tipo de contrato jurídico
 */
export type TipoContrato =
  | 'ajuizamento'
  | 'defesa'
  | 'ato_processual'
  | 'assessoria'
  | 'consultoria'
  | 'extrajudicial'
  | 'parecer';

/**
 * Tipo de cobrança do contrato
 */
export type TipoCobranca = 'pro_exito' | 'pro_labore';

/**
 * Status do contrato
 */
export type StatusContrato =
  | 'em_contratacao'
  | 'contratado'
  | 'distribuido'
  | 'desistencia';

/**
 * Papel/qualificação contratual do cliente (imutável)
 */
export type PapelContratual = 'autora' | 're';

/**
 * Tipo de entidade na relação de partes do contrato
 */
export type TipoEntidadeContrato = 'cliente' | 'parte_contraria';

// =============================================================================
// INTERFACES AUXILIARES
// =============================================================================

export interface ContratoParte {
  id: number;
  contratoId: number;
  tipoEntidade: TipoEntidadeContrato;
  entidadeId: number;
  papelContratual: PapelContratual;
  ordem: number;
  nomeSnapshot: string | null;
  cpfCnpjSnapshot: string | null;
  createdAt: string;
}

export interface ContratoStatusHistorico {
  id: number;
  contratoId: number;
  fromStatus: StatusContrato | null;
  toStatus: StatusContrato;
  changedAt: string;
  changedBy: number | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ContratoProcessoVinculo {
  id: number;
  contratoId: number;
  processoId: number;
  createdAt: string;
  processo: {
    id: number;
    numeroProcesso: string | null;
    trt: string | null;
    grau: string | null;
    dataAutuacao: string | null;
  } | null;
}

// =============================================================================
// ENTIDADE PRINCIPAL: Contrato
// =============================================================================

/**
 * Contrato jurídico - mapeamento completo da tabela contratos
 *
 * Campos obrigatórios:
 * - id, segmentoId, tipoContrato, tipoCobranca, clienteId, poloCliente
 * - qtdeParteAutora, qtdeParteRe, status, dataContratacao
 * - createdAt, updatedAt
 *
 * Campos opcionais (nullable):
 * - parteContrariaId, parteAutora, parteRe, dataAssinatura
 * - dataDistribuicao, dataDesistencia, responsavelId, createdBy
 * - observacoes, dadosAnteriores
 */
export interface Contrato {
  id: number;
  segmentoId: number | null;
  tipoContrato: TipoContrato;
  tipoCobranca: TipoCobranca;
  clienteId: number;
  papelClienteNoContrato: PapelContratual;
  status: StatusContrato;
  cadastradoEm: string;
  responsavelId: number | null;
  createdBy: number | null;
  observacoes: string | null;
  documentos: string | null;
  dadosAnteriores: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  /** Estágio do pipeline ao qual este contrato pertence (nullable) */
  estagioId: number | null;

  partes: ContratoParte[];
  statusHistorico: ContratoStatusHistorico[];
  processos: ContratoProcessoVinculo[];
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Schema de tipo de contrato
 */
export const tipoContratoSchema = z.enum([
  'ajuizamento',
  'defesa',
  'ato_processual',
  'assessoria',
  'consultoria',
  'extrajudicial',
  'parecer',
]);

/**
 * Schema de tipo de cobrança
 */
export const tipoCobrancaSchema = z.enum(['pro_exito', 'pro_labore']);

/**
 * Schema de status do contrato
 */
export const statusContratoSchema = z.enum([
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia',
]);

export const papelContratualSchema = z.enum(['autora', 're']);

export const tipoEntidadeContratoSchema = z.enum(['cliente', 'parte_contraria']);

export const contratoParteInputSchema = z.object({
  tipoEntidade: tipoEntidadeContratoSchema,
  entidadeId: z.number().int().positive('ID da entidade deve ser positivo'),
  papelContratual: papelContratualSchema,
  ordem: z.number().int().min(0).optional().default(0),
});

/**
 * Schema para criação de contrato
 *
 * Campos obrigatórios:
 * - segmentoId, tipoContrato, tipoCobranca, clienteId, poloCliente
 *
 * Campos opcionais com defaults:
 * - status: default 'em_contratacao'
 * - dataContratacao: default data atual
 * - qtdeParteAutora, qtdeParteRe: default 1
 */
export const createContratoSchema = z.object({
  // Campos obrigatórios
  segmentoId: z.number().int().positive('ID do segmento deve ser positivo').nullable().optional(),
  tipoContrato: tipoContratoSchema,
  tipoCobranca: tipoCobrancaSchema,
  clienteId: z.number().int().positive('ID do cliente deve ser positivo'),
  papelClienteNoContrato: papelContratualSchema,

  // Campos opcionais
  status: statusContratoSchema.optional().default('em_contratacao'),
  cadastradoEm: z.string().optional(),
  responsavelId: z.number().int().positive('ID do responsável deve ser positivo').nullable().optional(),
  createdBy: z.number().int().positive('ID do criador deve ser positivo').nullable().optional(),
  observacoes: z.string().max(5000, 'Observações muito longas').nullable().optional(),

  // Partes do contrato (modelo relacional)
  partes: z.array(contratoParteInputSchema).optional().default([]),
});

/**
 * Schema para atualização de contrato
 * Todos os campos são opcionais (partial update)
 */
export const updateContratoSchema = z.object({
  segmentoId: z.number().int().positive('ID do segmento deve ser positivo').nullable().optional(),
  tipoContrato: tipoContratoSchema.optional(),
  tipoCobranca: tipoCobrancaSchema.optional(),
  clienteId: z.number().int().positive('ID do cliente deve ser positivo').optional(),
  papelClienteNoContrato: papelContratualSchema.optional(),
  status: statusContratoSchema.optional(),
  cadastradoEm: z.string().nullable().optional(),
  responsavelId: z.number().int().positive('ID do responsável deve ser positivo').nullable().optional(),
  observacoes: z.string().max(5000, 'Observações muito longas').nullable().optional(),

  // Partes do contrato (modelo relacional)
  partes: z.array(contratoParteInputSchema).optional(),
});

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreateContratoInput = z.infer<typeof createContratoSchema>;
export type UpdateContratoInput = z.infer<typeof updateContratoSchema>;

// =============================================================================
// PARÂMETROS DE LISTAGEM
// =============================================================================

/**
 * Campos para ordenação de contratos
 */
export type ContratoSortBy =
  | 'id'
  | 'cadastrado_em'
  | 'status'
  | 'segmento_id'
  | 'tipo_contrato'
  | 'created_at'
  | 'updated_at';

/**
 * Ordem de ordenação
 */
export type Ordem = 'asc' | 'desc';

/**
 * Parâmetros para listar contratos
 */
export interface ListarContratosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em observações
  segmentoId?: number;
  tipoContrato?: TipoContrato;
  tipoCobranca?: TipoCobranca;
  status?: StatusContrato;
  clienteId?: number;
  responsavelId?: number;
  /**
   * Filtro opcional por período (aplicado em `created_at`)
   * Aceita ISO ou YYYY-MM-DD
   */
  dataInicio?: string;
  /**
   * Filtro opcional por período (aplicado em `created_at`)
   * Aceita ISO ou YYYY-MM-DD
   */
  dataFim?: string;
  ordenarPor?: ContratoSortBy;
  ordem?: Ordem;
}

// =============================================================================
// CONSTANTES (LABELS)
// =============================================================================


/**
 * Labels para exibição dos tipos de contrato
 */
export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  ajuizamento: 'Ajuizamento',
  defesa: 'Defesa',
  ato_processual: 'Ato Processual',
  assessoria: 'Assessoria',
  consultoria: 'Consultoria',
  extrajudicial: 'Extrajudicial',
  parecer: 'Parecer',
};

/**
 * Labels para exibição dos tipos de cobrança
 */
export const TIPO_COBRANCA_LABELS: Record<TipoCobranca, string> = {
  pro_exito: 'Pró-Êxito',
  pro_labore: 'Pró-Labore',
};

/**
 * Labels para exibição dos status
 */
export const STATUS_CONTRATO_LABELS: Record<StatusContrato, string> = {
  em_contratacao: 'Em Contratação',
  contratado: 'Contratado',
  distribuido: 'Distribuído',
  desistencia: 'Desistência',
};

/**
 * Labels para exibição dos tipos de segmentos
 */
export const SEGMENTO_TIPO_LABELS: Record<SegmentoTipo, string> = {
  trabalhista: 'Trabalhista',
  civil: 'Civil',
  previdenciario: 'Previdenciário',
  criminal: 'Criminal',
  empresarial: 'Empresarial',
  administrativo: 'Administrativo',
};

export const PAPEL_CONTRATUAL_LABELS: Record<PapelContratual, string> = {
  autora: 'Autora',
  re: 'Ré',
};

// =============================================================================
// STATS (DASHBOARD)
// =============================================================================

export interface ContratosStatsData {
  total: number;
  porStatus: Record<string, { count: number }>;
  novosMes: number;
  taxaConversao: number;
  trendMensal: number[];
  emCarteira?: number;
  ticketMedio?: number;
}

// =============================================================================
// NOTA: Tipos auxiliares (API Response, Filtros, PaginationInfo, ClienteInfo)
// foram movidos para ./types.ts para separação de concerns.
// Importe-os de '@/app/(authenticated)/contratos/types' ou '@/app/(authenticated)/contratos'
// =============================================================================
