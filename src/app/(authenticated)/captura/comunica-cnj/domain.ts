/**
 * COMUNICA CNJ DOMAIN - Tipos e Validações
 */

import { z } from 'zod';

export type MeioComunicacao = 'E' | 'D';

export const MEIO_COMUNICACAO_LABELS: Record<MeioComunicacao, string> = {
  E: 'Edital',
  D: 'Diário Eletrônico',
};

export type GrauTribunal = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

export const GRAU_TRIBUNAL_LABELS: Record<GrauTribunal, string> = {
  primeiro_grau: 'Primeiro Grau',
  segundo_grau: 'Segundo Grau',
  tribunal_superior: 'Tribunal Superior',
};

export type StatusComunicacao = 'P' | 'C' | 'X';

// API PARAMS & RESPONSE

export interface ComunicacaoAPIParams {
  siglaTribunal?: string;
  texto?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  numeroOab?: string;
  ufOab?: string;
  numeroProcesso?: string;
  numeroComunicacao?: number;
  dataInicio?: string;
  dataFim?: string;
  meio?: MeioComunicacao;
  orgaoId?: number;
  pagina?: number;
  itensPorPagina?: number;
}

export interface ComunicacaoDestinatario {
  nome: string;
  comunicacao_id: number;
  polo: 'A' | 'P';
}

export interface ComunicacaoDestinatarioAdvogado {
  id: number;
  comunicacao_id: number;
  advogado_id: number;
  created_at: string;
  updated_at: string;
  advogado: {
    id: number;
    nome: string;
    numero_oab: string;
    uf_oab: string;
  };
}

export interface ComunicacaoItemRaw {
  id: number;
  hash: string;
  numero_processo: string;
  numeroprocessocommascara?: string;
  siglaTribunal: string;
  nomeClasse?: string;
  codigoClasse?: string;
  tipoComunicacao?: string;
  tipoDocumento?: string;
  numeroComunicacao?: number;
  texto?: string;
  link?: string;
  nomeOrgao?: string;
  idOrgao?: number;
  data_disponibilizacao: string;
  datadisponibilizacao?: string;
  meio: MeioComunicacao;
  meiocompleto?: string;
  ativo: boolean;
  status?: string;
  motivo_cancelamento?: string | null;
  data_cancelamento?: string | null;
  destinatarios?: ComunicacaoDestinatario[];
  destinatarioadvogados?: ComunicacaoDestinatarioAdvogado[];
}

export interface ComunicacaoItem {
  id: number;
  hash: string;
  numeroProcesso: string;
  numeroProcessoComMascara: string;
  siglaTribunal: string;
  nomeClasse: string;
  codigoClasse: string;
  tipoComunicacao: string;
  tipoDocumento: string;
  numeroComunicacao: number;
  texto: string;
  link: string;
  nomeOrgao: string;
  idOrgao: number;
  dataDisponibilizacao: string;
  dataDisponibilizacaoFormatada: string;
  dataCancelamento?: string | null;
  meio: MeioComunicacao;
  meioCompleto: string;
  ativo: boolean;
  status: string;
  motivoCancelamento?: string | null;
  destinatarios: ComunicacaoDestinatario[];
  destinatarioAdvogados: ComunicacaoDestinatarioAdvogado[];
  partesAutoras?: string[];
  partesReus?: string[];
  advogados?: string[];
  advogadosOab?: string[];
}

export interface ComunicacaoAPIResponseRaw {
  status: string;
  message: string;
  count: number;
  items: ComunicacaoItemRaw[];
}

export interface ComunicacaoPaginationMetadata {
  pagina: number;
  itensPorPagina: number;
  total: number;
  totalPaginas: number;
}

export interface ComunicacaoAPIResponse {
  comunicacoes: ComunicacaoItem[];
  paginacao: ComunicacaoPaginationMetadata;
}

export interface TribunalInstituicao {
  sigla: string;
  nome: string;
  dataUltimoEnvio?: string;
  active?: boolean;
}

export interface TribunalUFResponse {
  uf: string;
  nomeEstado: string;
  instituicoes: TribunalInstituicao[];
}

export interface TribunalInfo {
  id: string;
  nome: string;
  sigla: string;
  jurisdicao: string;
  ultimaAtualizacao?: string;
}

export interface CadernoMetadataAPI {
  sigla_tribunal?: string;
  sigla?: string;
  tribunal?: string;
  meio: MeioComunicacao;
  data: string;
  total_comunicacoes?: number;
  totalComunicacoes?: number;
  url: string;
  expires_at?: string;
  expiresAt?: string;
}

export interface CadernoMetadata {
  tribunal: string;
  sigla: string;
  meio: MeioComunicacao;
  data: string;
  totalComunicacoes: number;
  url: string;
  expiresAt: string;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetAt?: Date;
}

// DATABASE ENTITY

export interface ComunicacaoCNJ {
  id: number;
  idCnj: number;
  hash: string;
  numeroComunicacao: number | null;
  numeroProcesso: string;
  numeroProcessoMascara: string | null;
  siglaTribunal: string;
  orgaoId: number | null;
  nomeOrgao: string | null;
  tipoComunicacao: string | null;
  tipoDocumento: string | null;
  nomeClasse: string | null;
  codigoClasse: string | null;
  meio: MeioComunicacao;
  meioCompleto: string | null;
  texto: string | null;
  link: string | null;
  dataDisponibilizacao: string;
  ativo: boolean;
  status: string | null;
  motivoCancelamento: string | null;
  dataCancelamento: string | null;
  destinatarios: ComunicacaoDestinatario[] | null;
  destinatariosAdvogados: ComunicacaoDestinatarioAdvogado[] | null;
  expedienteId: number | null;
  advogadoId: number | null;
  metadados: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface InserirComunicacaoParams {
  idCnj: number;
  hash: string;
  numeroComunicacao?: number | null;
  numeroProcesso: string;
  numeroProcessoMascara?: string | null;
  siglaTribunal: string;
  orgaoId?: number | null;
  nomeOrgao?: string | null;
  tipoComunicacao?: string | null;
  tipoDocumento?: string | null;
  nomeClasse?: string | null;
  codigoClasse?: string | null;
  meio: MeioComunicacao;
  meioCompleto?: string | null;
  texto?: string | null;
  link?: string | null;
  dataDisponibilizacao: string;
  ativo?: boolean;
  status?: string | null;
  motivoCancelamento?: string | null;
  dataCancelamento?: string | null;
  destinatarios?: ComunicacaoDestinatario[] | null;
  destinatariosAdvogados?: ComunicacaoDestinatarioAdvogado[] | null;
  expedienteId?: number | null;
  advogadoId?: number | null;
  metadados?: Record<string, unknown> | null;
}

export interface ComunicacaoProcessual {
  id: number;
  hash: string;
  numeroProcesso: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  dataDisponibilizacao: string;
  meio: MeioComunicacao;
  ativo: boolean;
  texto: string;
  destinatarios: ComunicacaoDestinatario[];
}

export interface CriarExpedienteFromCNJParams {
  numeroProcesso: string;
  trt: string;
  grau: GrauTribunal;
  dataCriacaoExpediente: string;
  nomeParteAutora: string;
  qtdeParteAutora: number;
  nomeParteRe: string;
  qtdeParteRe: number;
  descricaoOrgaoJulgador: string;
  classeJudicial: string;
  codigoClasse?: string;
  advogadoId?: number | null;
}

export interface PartesExtraidas {
  poloAtivo: string[];
  poloPassivo: string[];
}

export interface SincronizarParams {
  advogadoId?: number;
  numeroOab?: string;
  ufOab?: string;
  siglaTribunal?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface SincronizacaoStats {
  total: number;
  novos: number;
  duplicados: number;
  vinculados: number;
  expedientesCriados: number;
  erros: number;
}

export interface SincronizacaoResult {
  success: boolean;
  stats: SincronizacaoStats;
  errors?: string[];
}

export interface ConsultaResult {
  comunicacoes: ComunicacaoItem[];
  paginacao: ComunicacaoPaginationMetadata;
  rateLimit: RateLimitStatus;
}

export interface ListarComunicacoesParams {
  numeroProcesso?: string;
  siglaTribunal?: string;
  dataInicio?: string;
  dataFim?: string;
  advogadoId?: number;
  expedienteId?: number;
  semExpediente?: boolean;
  page?: number;
  limit?: number;
}

export interface ConsultarComunicacoesParams {
  siglaTribunal?: string;
  texto?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  numeroOab?: string;
  ufOab?: string;
  numeroProcesso?: string;
  numeroComunicacao?: number;
  dataInicio?: string;
  dataFim?: string;
  meio?: MeioComunicacao;
  orgaoId?: number;
  pagina?: number;
  itensPorPagina?: number;
}

export interface MatchParams {
  numeroProcesso: string;
  trt: string;
  grau: GrauTribunal;
  dataDisponibilizacao: string;
}

export interface BatchResult {
  inseridas: number;
  duplicadas: number;
  erros: number;
}

export interface ComunicaCNJClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
}

// VALIDATION SCHEMAS

export const consultarComunicacoesSchema = z.object({
  siglaTribunal: z.string().optional(),
  texto: z.string().optional(),
  nomeParte: z.string().optional(),
  nomeAdvogado: z.string().optional(),
  numeroOab: z.string().optional(),
  ufOab: z.string().optional(),
  numeroProcesso: z.string().optional(),
  numeroComunicacao: z.number().int().positive().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meio: z.enum(['E', 'D']).optional(),
  orgaoId: z.number().int().positive().optional(),
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.literal(5).or(z.literal(100)).default(100),
}).refine(
  (data) => {
    const hasFilter = !!(
      data.siglaTribunal ||
      data.texto ||
      data.nomeParte ||
      data.nomeAdvogado ||
      data.numeroOab ||
      data.numeroProcesso ||
      data.numeroComunicacao ||
      data.orgaoId ||
      data.dataInicio ||
      data.dataFim ||
      data.meio
    );
    return hasFilter || data.itensPorPagina <= 5;
  },
  {
    message: 'Pelo menos um filtro deve ser preenchido ou itensPorPagina deve ser <= 5',
  }
).refine(
  (data) => {
    if (data.dataInicio && data.dataFim) {
      return new Date(data.dataInicio) <= new Date(data.dataFim);
    }
    return true;
  },
  {
    message: 'dataInicio deve ser anterior a dataFim',
  }
);

export const sincronizarComunicacoesSchema = z.object({
  advogadoId: z.number().int().positive().optional(),
  numeroOab: z.string().optional(),
  ufOab: z.string().optional(),
  siglaTribunal: z.string().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => {
    const hasOab = !!(data.numeroOab && data.ufOab);
    const hasTribunalData = !!(data.siglaTribunal && data.dataInicio);
    return hasOab || hasTribunalData;
  },
  {
    message: 'Deve fornecer OAB (numeroOab + ufOab) ou tribunal com data (siglaTribunal + dataInicio)',
  }
);

export const vincularExpedienteSchema = z.object({
  comunicacaoId: z.number().int().positive(),
  expedienteId: z.number().int().positive(),
});

export const listarComunicacoesCapturadasSchema = z.object({
  numeroProcesso: z.string().optional(),
  siglaTribunal: z.string().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  advogadoId: z.number().int().positive().optional(),
  expedienteId: z.number().int().positive().optional(),
  semExpediente: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
}).refine(
  (data) => {
    if (data.dataInicio && data.dataFim) {
      return new Date(data.dataInicio) <= new Date(data.dataFim);
    }
    return true;
  },
  {
    message: 'dataInicio deve ser anterior a dataFim',
  }
);

// ===== GAZETTE FUSION TYPES =====

export type StatusVinculacao = 'vinculado' | 'pendente' | 'orfao' | 'irrelevante';

export interface GazetteMetrics {
  publicacoesHoje: number;
  vinculados: number;
  totalCapturadas: number;
  pendentes: number;
  prazosCriticos: number;
  orfaos: number;
  orfaosComSugestao: number;
  taxaVinculacao: number;
}

export interface SparklinePoint {
  date: string;
  count: number;
}

export interface GazetteFilters {
  fonte?: string[];
  tipo?: string[];
  periodo?: { inicio: string; fim: string };
  advogadoId?: number;
  meio?: MeioComunicacao | null;
  status?: StatusVinculacao[];
  processo?: string;
  parte?: string;
  texto?: string;
}

export interface GazetteView {
  id: number;
  nome: string;
  icone: string;
  filtros: GazetteFilters;
  colunas: string[];
  sort: { campo: string; direcao: 'asc' | 'desc' };
  densidade: 'compacto' | 'padrao' | 'confortavel';
  modoVisualizacao: 'tabela' | 'cards';
  visibilidade: 'pessoal' | 'equipe';
  criadoPor: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLogEntry {
  id: number;
  tipo: 'automatica' | 'manual';
  status: 'sucesso' | 'erro' | 'em_andamento';
  totalProcessados: number;
  novos: number;
  duplicados: number;
  vinculadosAuto: number;
  orfaos: number;
  erros: Array<{ mensagem: string; processo?: string }>;
  parametros: Record<string, unknown>;
  duracaoMs: number | null;
  executadoPor: number;
  createdAt: string;
}

export interface MatchSugestao {
  expedienteId: number;
  expedienteNumero: string;
  processoNumero: string;
  partes: string;
  vara: string;
  grau: string;
  status: string;
  criadoEm: string;
  confianca: number;
  criterios: MatchCriterio[];
}

export interface MatchCriterio {
  campo: string;
  match: boolean;
  detalhe: string;
}

export interface ComunicacaoResumo {
  id: number;
  comunicacaoId: number;
  resumo: string;
  tags: Array<{ tipo: 'prazo' | 'valor' | 'acao' | 'parte'; texto: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface GazetteInsight {
  tipo: 'padrao' | 'atencao' | 'relatorio';
  titulo: string;
  descricao: string;
  linkFiltro?: GazetteFilters;
}

export interface ComunicacaoCNJEnriquecida extends ComunicacaoCNJ {
  statusVinculacao: StatusVinculacao;
  diasParaPrazo: number | null;
  resumoAI?: ComunicacaoResumo;
  matchSugestao?: MatchSugestao;
  partesAutor: string[];
  partesReu: string[];
}

// Gazette Fusion Zod Schemas

export const salvarViewSchema = z.object({
  nome: z.string().min(1).max(100),
  icone: z.string().default('bookmark'),
  filtros: z.record(z.unknown()).default({}),
  colunas: z.array(z.string()).default([]),
  sort: z.object({
    campo: z.string(),
    direcao: z.enum(['asc', 'desc']),
  }).default({ campo: 'data_disponibilizacao', direcao: 'desc' }),
  densidade: z.enum(['compacto', 'padrao', 'confortavel']).default('padrao'),
  modoVisualizacao: z.enum(['tabela', 'cards']).default('tabela'),
  visibilidade: z.enum(['pessoal', 'equipe']).default('pessoal'),
});

export const buscarMatchSchema = z.object({
  comunicacaoId: z.number().int().positive(),
});

export const aceitarMatchBatchSchema = z.object({
  confiancaMinima: z.number().min(0).max(100).default(85),
});

export type SalvarViewInput = z.infer<typeof salvarViewSchema>;
