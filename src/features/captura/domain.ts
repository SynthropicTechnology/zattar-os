/**
 * CAPTURA DOMAIN - Entidades e Interfaces
 *
 * Consolida types e domain da feature captura.
 */

import type { TipoAcessoTribunal } from "./types/trt-types";
import type { GrauProcesso } from "@/app/app/partes";
import type {
  CodigoTRT,
  GrauTRT,
  FiltroPrazoPendentes,
} from "./types/trt-types";
import type { GrauCredencial } from "@/app/app/advogados";

export type { CodigoTRT, GrauTRT, FiltroPrazoPendentes };

// =============================================================================
// CONVERTER FUNCTIONS
// =============================================================================

/**
 * Converte GrauCredencial ('1' | '2') para GrauTRT ('primeiro_grau' | 'segundo_grau')
 */
export function grauCredencialToGrauTRT(grau: GrauCredencial): GrauTRT {
  return grau === '1' ? 'primeiro_grau' : 'segundo_grau';
}

/**
 * Converte GrauTRT para GrauCredencial
 */
export function grauTRTToCredencial(grau: GrauTRT): GrauCredencial {
  if (grau === 'primeiro_grau') return '1';
  if (grau === 'segundo_grau') return '2';
  // Default to segundo_grau if tribunal_superior
  return '2';
}

// =============================================================================
// INTERFACES GENÉRICAS DO DOMÍNIO
// =============================================================================

/**
 * Credenciais de acesso a um tribunal
 */
export interface Credencial {
  cpf: string;
  senha: string;
}

/**
 * Timeouts customizados para um tribunal específico
 */
export interface CustomTimeouts {
  login?: number; // Timeout para login SSO (ms)
  redirect?: number; // Timeout para redirects (ms)
  networkIdle?: number; // Timeout para página estabilizar (ms)
  api?: number; // Timeout para chamadas de API (ms)
}

/**
 * Configuração de um tribunal vinda do banco (tribunais_config)
 */
export interface ConfigTribunal {
  tribunalId: string;
  sistema: string; // 'PJE', 'ESAJ', 'EPROC', 'PROJUDI'
  tipoAcesso: TipoAcessoTribunal;
  loginUrl: string;
  baseUrl: string;
  apiUrl: string;
  customTimeouts?: CustomTimeouts;
  // Metadados adicionais (opcionais, preenchidos pela factory)
  tribunalCodigo?: string;
  tribunalNome?: string;
}

/**
 * Processo capturado (formato genérico)
 */
export interface ProcessoCapturado {
  idPje: number;
  numeroProcesso: string;
  classeJudicial: string;
  orgaoJulgador: string;
  parteAutora: string;
  parteRe: string;
  dataAutuacao: string;
  status: string;
  // Campos adicionais podem ser incluídos conforme necessário
}

/**
 * Audiência capturada
 */
export interface AudienciaCapturada {
  idProcesso: number;
  numeroProcesso: string;
  dataAudiencia: string;
  tipoAudiencia: string;
  situacao: string;
  sala?: string;
}

/**
 * Movimentação capturada (timeline)
 */
export interface MovimentacaoCapturada {
  idProcesso: number;
  numeroProcesso: string;
  dataMovimentacao: string;
  tipoMovimentacao: string;
  descricao: string;
  dadosCompletos?: Record<string, unknown>;
}

/**
 * Período para buscar audiências
 */
export interface PeriodoAudiencias {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
}

/**
 * Parâmetros para buscar processos
 */
export interface BuscarProcessosParams {
  tipo: TipoCaptura;
  periodo?: PeriodoAudiencias;
  filtros?: Record<string, unknown>;
}

/**
 * Resultado de uma captura
 */
export interface ResultadoCaptura {
  processos: ProcessoCapturado[];
  audiencias?: AudienciaCapturada[];
  movimentacoes?: MovimentacaoCapturada[];
  metadados: {
    tribunal: string;
    sistema: string;
    grau: GrauProcesso;
    dataCaptura: string;
    duracaoMs: number;
  };
}

/**
 * Sistema judicial suportado
 */
export type SistemaJudicialSuportado = "PJE" | "ESAJ" | "EPROC" | "PROJUDI";

// =============================================================================
// TIPOS DE CAPTURA E STATUS (DA ANTIGA Types.ts)
// =============================================================================

// Tipo de captura (Consolidado: Inclui tipos do domain e do types antigo)
export type TipoCaptura =
  | "acervo_geral"
  | "arquivados"
  | "audiencias" // Generico usada em CapturaLog
  | "pendentes"
  | "partes"
  | "combinada"
  | "audiencias_designadas"
  | "audiencias_realizadas"
  | "audiencias_canceladas"
  | "expedientes_no_prazo"
  | "expedientes_sem_prazo"
  | "pericias"
  | "timeline";

export type StatusCaptura = "pending" | "in_progress" | "completed" | "failed";

export interface CapturaLog {
  id: number;
  tipo_captura: TipoCaptura;
  advogado_id: number | null;
  credencial_ids: number[];
  status: StatusCaptura;
  iniciado_em: string;
  concluido_em: string | null;
  erro: string | null;
  dados_adicionais?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface ListarCapturasLogParams {
  pagina?: number;
  limite?: number;
  tipo_captura?: string;
  advogado_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface ListarCapturasLogResult {
  capturas: CapturaLog[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Resposta padrão da API de captura
 */
export interface CapturaApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: "pending" | "in_progress" | "completed" | "failed";
  capture_id?: number;
}

/**
 * Credencial disponível para captura
 */
export interface CredencialDisponivel {
  id: number;
  advogado_id: number;
  advogado_nome: string;
  advogado_cpf: string;
  advogado_oabs: Array<{ numero: string; uf: string }>;
  tribunal: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Resposta da API de credenciais
 */
export interface CredenciaisApiResponse {
  success: boolean;
  data?: {
    credenciais: CredencialDisponivel[];
    tribunais_disponiveis: CodigoTRT[];
    graus_disponiveis: GrauTRT[];
  };
  error?: string;
}

/**
 * Resultado de captura de acervo geral
 */
export interface AcervoGeralResult {
  processos?: unknown[];
  total?: number;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
  };
}

/**
 * Resultado de captura de processos arquivados
 */
export interface ArquivadosResult {
  processos?: unknown[];
  total?: number;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
  };
}

/**
 * Resultado de captura de audiências
 */
export interface AudienciasResult {
  audiencias?: unknown[];
  total?: number;
  dataInicio?: string;
  dataFim?: string;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
    orgaosJulgadoresCriados?: number;
  };
}

export interface StartCaptureData {
  credenciais_processadas: number;
  message: string;
}

/**
 * Resultado de captura de pendências de manifestação
 */
export interface PendentesResult {
  processos?: unknown[];
  total?: number;
  filtroPrazo?: FiltroPrazoPendentes;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
  };
}

/**
 * Resultado de captura de partes
 */
export interface CapturaPartesResult {
  total_processos: number;
  total_partes: number;
  clientes: number;
  partes_contrarias: number;
  terceiros: number;
  representantes: number;
  vinculos: number;
  erros: Array<{ processo_id: number; numero_processo: string; erro: string }>;
  duracao_ms: number;
}

/**
 * Parâmetros base para captura (novo formato)
 */
export interface BaseCapturaParams {
  advogado_id: number;
  credencial_ids: number[];
}

/**
 * Parâmetros para captura de partes
 */
export interface CapturaPartesParams extends BaseCapturaParams {
  processo_ids?: number[];
  trts?: CodigoTRT[];
  graus?: GrauTRT[];
  numero_processo?: string;
  numeros_processo?: string[];
}

export type StatusAudiencia = 'M' | 'C' | 'F';

export interface AudienciasParams extends BaseCapturaParams {
  dataInicio?: string;
  dataFim?: string;
  statusAudiencias: StatusAudiencia[];
}

/**
 * Parâmetros para captura de perícias
 */
export interface PericiasParams extends BaseCapturaParams {
  situacoes?: ('S' | 'L' | 'C' | 'F' | 'P' | 'R')[];
}

/**
 * Parâmetros para captura de pendências
 */
export interface PendentesParams extends BaseCapturaParams {
  filtroPrazo?: FiltroPrazoPendentes;
  filtrosPrazo?: FiltroPrazoPendentes[];
}

/**
 * Filtro para documentos da timeline
 */
export interface FiltroDocumentosTimeline {
  apenasAssinados?: boolean;
  apenasNaoSigilosos?: boolean;
  tipos?: string[];
  dataInicial?: string;
  dataFinal?: string;
}

/**
 * Parâmetros para captura de timeline
 */
export interface TimelineParams {
  processoId: number;
  trtCodigo: CodigoTRT;
  grau: GrauTRT;
  advogadoId: number;
  baixarDocumentos?: boolean;
  filtroDocumentos?: FiltroDocumentosTimeline;
}

/**
 * Resultado de captura de timeline
 */
export interface TimelineResult {
  timeline?: unknown[];
  totalItens?: number;
  totalDocumentos?: number;
  totalMovimentos?: number;
  documentosBaixados?: Array<{
    detalhes: unknown;
    pdfTamanho?: number;
    erro?: string;
  }>;
  totalBaixadosSucesso?: number;
  totalErros?: number;
}

// ============================================================================
// Recovery Types - Recuperacao a partir de logs brutos
// ============================================================================

/**
 * Parametros para listar logs de recovery
 */
export interface ListarRecoveryLogsParams {
  capturaLogId?: number;
  tipoCaptura?: string;
  status?: "success" | "error";
  trt?: CodigoTRT;
  grau?: GrauTRT;
  advogadoId?: number;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  limite?: number;
  incluirEstatisticas?: boolean;
}

/**
 * Log de recovery (sumario)
 */
export interface RecoveryLogSumario {
  rawLogId: string;
  capturaLogId: number;
  tipoCaptura: string;
  status: "success" | "error";
  trt: string;
  grau: string;
  advogadoId: number;
  criadoEm: string;
  numeroProcesso?: string;
  processoIdPje?: number;
  erro?: string | null;
}

/**
 * Resposta da listagem de logs de recovery
 */
export interface ListarRecoveryLogsResponse {
  success: boolean;
  data?: {
    logs: RecoveryLogSumario[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
  estatisticas?: {
    contadores: { success: number; error: number; total: number };
    porTrt: Array<{
      trt: string;
      total: number;
      success: number;
      error: number;
    }>;
    gaps: {
      totalLogs: number;
      logsComGaps: number;
      resumoGaps: { enderecos: number; partes: number; representantes: number };
    };
  };
  error?: string;
}

/**
 * Elemento recuperavel (gap identificado)
 */
export interface ElementoRecuperavel {
  tipo: "endereco" | "parte" | "representante" | "cadastro_pje";
  identificador: string;
  nome: string;
  dadosBrutos: Record<string, unknown>;
  statusPersistencia: "pendente" | "existente" | "faltando" | "erro";
  erro?: string;
  contexto?: {
    entidadeId?: number;
    entidadeTipo?: string;
    enderecoId?: number;
  };
}

/**
 * Analise de gaps de uma captura
 */
export interface RecoveryAnalise {
  processo: {
    id: number | null;
    idPje: number;
    numeroProcesso: string;
    trt: string;
    grau: string;
  };
  totais: {
    partes: number;
    partesPersistidas: number;
    enderecosEsperados: number;
    enderecosPersistidos: number;
    representantes: number;
    representantesPersistidos: number;
  };
  gaps: {
    enderecosFaltantes: ElementoRecuperavel[];
    partesFaltantes: ElementoRecuperavel[];
    representantesFaltantes: ElementoRecuperavel[];
  };
  payloadDisponivel: boolean;
  erroOriginal?: string | null;
}

/**
 * Resposta da analise de recovery
 */
export interface RecoveryAnaliseResponse {
  success: boolean;
  data?: {
    log: {
      rawLogId: string;
      capturaLogId: number;
      tipoCaptura: string;
      status: string;
      trt: string;
      grau: string;
      advogadoId: number;
      criadoEm: string;
      erro?: string | null;
      requisicao?: Record<string, unknown>;
      resultadoProcessado?: Record<string, unknown>;
    };
    payloadDisponivel: boolean;
    analise?: RecoveryAnalise;
    payloadBruto?: unknown;
  };
  error?: string;
}

/**
 * Parametros para re-processamento
 */
export interface ReprocessarParams {
  rawLogIds?: string[];
  capturaLogId?: number;
  tiposElementos?: Array<
    "endereco" | "parte" | "representante" | "cadastro_pje"
  >;
  filtros?: {
    apenasGaps?: boolean;
    forcarAtualizacao?: boolean;
  };
}

/**
 * Resultado de elemento re-processado
 */
export interface ResultadoElemento {
  tipo: string;
  identificador: string;
  nome: string;
  sucesso: boolean;
  acao: "criado" | "atualizado" | "ignorado" | "erro";
  erro?: string;
  registroId?: number;
}

/**
 * Resultado de documento re-processado
 */
export interface ResultadoDocumento {
  rawLogId: string;
  numeroProcesso: string;
  sucesso: boolean;
  totalProcessados: number;
  totalSucessos: number;
  totalErros: number;
  elementos: ResultadoElemento[];
  duracaoMs: number;
  erro?: string;
}

/**
 * Resultado completo do re-processamento
 */
export interface ReprocessarResult {
  sucesso: boolean;
  totalDocumentos: number;
  totalElementos: number;
  totalSucessos: number;
  totalErros: number;
  documentos: ResultadoDocumento[];
  duracaoMs: number;
  erro?: string;
}

/**
 * Resposta do re-processamento
 */
export interface ReprocessarResponse {
  success: boolean;
  data?: ReprocessarResult;
  error?: string;
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Mapeia tipoAcesso para GrauProcesso
 *
 * Centraliza a lógica de conversão entre tipo_acesso_tribunal e grau_processo
 * para manter consistência entre níveis lógicos.
 *
 * @param tipoAcesso - Tipo de acesso ao tribunal
 * @returns Grau do processo correspondente
 */
export function mapearTipoAcessoParaGrau(
  tipoAcesso: TipoAcessoTribunal
): GrauProcesso {
  switch (tipoAcesso) {
    case "primeiro_grau":
      return "primeiro_grau";
    case "segundo_grau":
      return "segundo_grau";
    case "unificado":
      // Para acesso unificado, usar primeiro_grau como padrão
      // O sistema PJE permite navegar entre graus após autenticação
      return "primeiro_grau";
    case "unico":
      // Para acesso único (tribunais superiores), usar tribunal_superior
      return "tribunal_superior";
    default:
      // Fallback seguro
      return "primeiro_grau";
  }
}

/**
 * Mapeia tipoCaptura para origem do processo
 *
 * Determina a origem do processo no acervo baseado no tipo de captura.
 *
 * @param tipoCaptura - Tipo de captura executada
 * @returns Origem do processo no acervo
 */
export function mapearTipoCapturaParaOrigem(
  tipoCaptura: TipoCaptura
): "acervo_geral" | "arquivado" {
  switch (tipoCaptura) {
    case "acervo_geral":
      return "acervo_geral";
    case "arquivados":
      return "arquivado";
    case "audiencias_designadas":
    case "audiencias_realizadas":
    case "audiencias_canceladas":
    case "expedientes_no_prazo":
    case "expedientes_sem_prazo":
      // Todos os outros tipos de captura são considerados acervo geral
      return "acervo_geral";
    default:
      return "acervo_geral";
  }
}
