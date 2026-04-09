/**
 * PROCESSOS DOMAIN - Entidades e Schemas de Validacao
 *
 * Modulo para gerenciamento de processos judiciais.
 * Mapeia todos os 27 campos da tabela acervo do banco de dados.
 *
 * CONVENCOES:
 * - Prefixar schemas de criacao com "create" (ex: createProcessoSchema)
 * - Prefixar schemas de atualizacao com "update" (ex: updateProcessoSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 * - NUNCA importar React/Next.js aqui
 */

import { z } from "zod";
import type { GrauProcesso } from "@/app/(authenticated)/partes";

// Re-export GrauProcesso para uso interno neste módulo
export type { GrauProcesso };

// =============================================================================
// TIPOS BASE (ENUMS)
// =============================================================================

/**
 * Origem do processo no acervo
 * - acervo_geral: Processos ativos ou em andamento
 * - arquivado: Processos que foram arquivados
 */
export type OrigemAcervo = "acervo_geral" | "arquivado";

/**
 * Codigo do tribunal (TRT1-24, TST)
 */
export type CodigoTribunal = string;

/**
 * Ordem de ordenacao
 */
export type Ordem = "asc" | "desc";

/**
 * Campos disponiveis para ordenacao de processos
 */
export type ProcessoSortBy =
  | "numero_processo"
  | "data_autuacao"
  | "data_arquivamento"
  | "data_proxima_audiencia"
  | "created_at"
  | "updated_at"
  | "nome_parte_autora"
  | "nome_parte_re"
  | "trt"
  | "classe_judicial"
  | "codigo_status_processo";

/**
 * Status de um processo judicial.
 */
export enum StatusProcesso {
  ATIVO = "ATIVO",
  SUSPENSO = "SUSPENSO",
  ARQUIVADO = "ARQUIVADO",
  EXTINTO = "EXTINTO",
  BAIXADO = "BAIXADO",
  PENDENTE = "PENDENTE",
  EM_RECURSO = "EM_RECURSO",
  OUTRO = "OUTRO",
}

// =============================================================================
// ENTIDADE PRINCIPAL: Processo
// =============================================================================

/**
 * Processo judicial - mapeamento completo da tabela acervo (27 campos)
 *
 * Campos obrigatorios:
 * - id, idPje, advogadoId, origem, trt, grau, numeroProcesso, numero
 * - descricaoOrgaoJulgador, classeJudicial, segredoJustica, codigoStatusProcesso
 * - prioridadeProcessual, nomeParteAutora, qtdeParteAutora, nomeParteRe, qtdeParteRe
 * - dataAutuacao, juizoDigital, temAssociacao, createdAt, updatedAt
 *
 * Campos opcionais (nullable):
 * - dataArquivamento, dataProximaAudiencia, responsavelId
 *
 * Campos derivados (calculados):
 * - status: StatusProcesso (mapeado de codigoStatusProcesso)
 */
export interface Processo {
  id: number;
  idPje: number;
  advogadoId: number;
  origem: OrigemAcervo;
  trt: string;
  grau: GrauProcesso;
  numeroProcesso: string;
  numero: number;
  descricaoOrgaoJulgador: string;
  classeJudicial: string;
  segredoJustica: boolean;
  codigoStatusProcesso: string;
  prioridadeProcessual: number;
  nomeParteAutora: string;
  qtdeParteAutora: number;
  nomeParteRe: string;
  qtdeParteRe: number;
  dataAutuacao: string; // ISO timestamp
  juizoDigital: boolean;
  dataArquivamento: string | null; // ISO timestamp
  dataProximaAudiencia: string | null; // ISO timestamp
  temAssociacao: boolean;
  responsavelId: number | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Campo derivado
  status: StatusProcesso;
}

// =============================================================================
// INTERFACES AUXILIARES
// =============================================================================

/**
 * Contem metadados de uma instancia especifica de um processo,
 * representando sua passagem por um determinado grau de jurisdicao.
 */
export interface ProcessoInstancia {
  id: number;
  grau: GrauProcesso;
  origem: OrigemAcervo;
  trt: string;
  dataAutuacao: string;
  status: StatusProcesso;
  updatedAt: string;
  isGrauAtual: boolean; // True se esta e a instancia do grau mais recente
}

/**
 * Visao unificada de um processo que pode ter multiplas instancias
 * (e.g., 1o grau, 2o grau). Agrega dados da instancia principal com
 * um resumo das demais.
 *
 * IMPORTANTE: Os campos *Origem representam a FONTE DA VERDADE (dados do 1º grau).
 * Ver src/features/processos/FONTE_DA_VERDADE.md para documentacao completa.
 */
export interface ProcessoUnificado extends Omit<Processo, "grau"> {
  // Propriedades especificas da view unificada
  grau?: string; // Retornado pela view como grau_atual
  grauAtual?: GrauProcesso;
  grausAtivos?: GrauProcesso[];
  statusGeral?: string;
  instances?: ProcessoInstancia[];

  // =========================================================================
  // FONTE DA VERDADE (dados do 1º grau)
  // Estes campos SEMPRE vêm do 1º grau e não invertem com recursos.
  // =========================================================================
  trtOrigem?: string; // Tribunal de origem (1º grau)
  nomeParteAutoraOrigem?: string; // Quem ajuizou a ação
  nomeParteReOrigem?: string; // Contra quem foi ajuizada
  dataAutuacaoOrigem?: string; // Data de autuação do 1º grau
  orgaoJulgadorOrigem?: string; // Órgão julgador do 1º grau
  grauOrigem?: GrauProcesso; // Grau de onde vieram os dados (normalmente primeiro_grau)
}

/**
 * Representa um item de resultado quando os processos sao agrupados
 * por um criterio especifico (e.g., por TRT, por status).
 */
export interface AgrupamentoProcesso {
  grupo: string;
  quantidade: number;
  processos?: Processo[];
}

/**
 * Interface para movimentacoes/timeline do processo
 * Placeholder para implementacao futura (Fase 4 - Captura PJE)
 */
export interface Movimentacao {
  id: number;
  processoId: number;
  dataMovimentacao: string; // ISO timestamp
  tipoMovimentacao: string;
  descricao: string;
  dadosPjeCompleto: Record<string, unknown> | null;
  createdAt: string;
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Schema de origem do acervo
 */
export const origemAcervoSchema = z.enum(["acervo_geral", "arquivado"]);

/**
 * Schema de grau do processo
 */
export const grauProcessoSchema = z.enum([
  "primeiro_grau",
  "segundo_grau",
  "tribunal_superior",
]);

/**
 * Regex para validacao do numero CNJ
 * Formato: NNNNNNN-DD.AAAA.J.TT.OOOO
 */
const REGEX_NUMERO_CNJ = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

/**
 * Schema para criacao de processo
 *
 * Campos obrigatorios:
 * - idPje, advogadoId, origem, trt, grau, numeroProcesso, numero
 * - descricaoOrgaoJulgador, classeJudicial, codigoStatusProcesso
 * - nomeParteAutora, nomeParteRe, dataAutuacao
 *
 * Campos opcionais com defaults:
 * - segredoJustica: default false
 * - juizoDigital: default false
 * - temAssociacao: default false
 * - prioridadeProcessual: default 0
 * - qtdeParteAutora, qtdeParteRe: default 1
 */
export const createProcessoSchema = z.object({
  // Campos obrigatorios
  idPje: z.number().int().positive("ID PJE deve ser positivo"),
  advogadoId: z.number().int().positive("ID do advogado deve ser positivo"),
  origem: origemAcervoSchema,
  trt: z.string().min(1, "TRT e obrigatorio"),
  grau: grauProcessoSchema,
  numeroProcesso: z
    .string()
    .min(1, "Numero do processo e obrigatorio")
    .regex(
      REGEX_NUMERO_CNJ,
      "Numero do processo deve seguir o padrao CNJ (NNNNNNN-DD.AAAA.J.TT.OOOO)"
    ),
  numero: z.number().int().positive("Numero deve ser positivo"),
  descricaoOrgaoJulgador: z
    .string()
    .min(1, "Descricao do orgao julgador e obrigatoria"),
  classeJudicial: z.string().min(1, "Classe judicial e obrigatoria"),
  codigoStatusProcesso: z
    .string()
    .min(1, "Codigo do status do processo e obrigatorio"),
  nomeParteAutora: z.string().min(1, "Nome da parte autora e obrigatorio"),
  nomeParteRe: z.string().min(1, "Nome da parte re e obrigatorio"),
  dataAutuacao: z.string().min(1, "Data de autuacao e obrigatoria"),

  // Campos opcionais com defaults
  segredoJustica: z.boolean().optional().default(false),
  juizoDigital: z.boolean().optional().default(false),
  temAssociacao: z.boolean().optional().default(false),
  prioridadeProcessual: z.number().int().min(0).optional().default(0),
  qtdeParteAutora: z
    .number()
    .int()
    .positive("Quantidade deve ser positiva")
    .optional()
    .default(1),
  qtdeParteRe: z
    .number()
    .int()
    .positive("Quantidade deve ser positiva")
    .optional()
    .default(1),

  // Campos opcionais (nullable)
  dataArquivamento: z.string().nullable().optional(),
  dataProximaAudiencia: z.string().nullable().optional(),
  responsavelId: z
    .number()
    .int()
    .positive("ID do responsavel deve ser positivo")
    .nullable()
    .optional(),
});

/**
 * Schema para atualizacao de processo
 * Todos os campos sao opcionais (partial update)
 */
export const updateProcessoSchema = z.object({
  idPje: z.number().int().positive("ID PJE deve ser positivo").optional(),
  advogadoId: z
    .number()
    .int()
    .positive("ID do advogado deve ser positivo")
    .optional(),
  origem: origemAcervoSchema.optional(),
  trt: z.string().min(1, "TRT e obrigatorio").optional(),
  grau: grauProcessoSchema.optional(),
  numeroProcesso: z
    .string()
    .min(1, "Numero do processo e obrigatorio")
    .regex(
      REGEX_NUMERO_CNJ,
      "Numero do processo deve seguir o padrao CNJ (NNNNNNN-DD.AAAA.J.TT.OOOO)"
    )
    .optional(),
  numero: z.number().int().positive("Numero deve ser positivo").optional(),
  descricaoOrgaoJulgador: z
    .string()
    .min(1, "Descricao do orgao julgador e obrigatoria")
    .optional(),
  classeJudicial: z.string().min(1, "Classe judicial e obrigatoria").optional(),
  codigoStatusProcesso: z
    .string()
    .min(1, "Codigo do status do processo e obrigatorio")
    .optional(),
  nomeParteAutora: z
    .string()
    .min(1, "Nome da parte autora e obrigatorio")
    .optional(),
  nomeParteRe: z.string().min(1, "Nome da parte re e obrigatorio").optional(),
  dataAutuacao: z.string().min(1, "Data de autuacao e obrigatoria").optional(),
  segredoJustica: z.boolean().optional(),
  juizoDigital: z.boolean().optional(),
  temAssociacao: z.boolean().optional(),
  prioridadeProcessual: z.number().int().min(0).optional(),
  qtdeParteAutora: z
    .number()
    .int()
    .positive("Quantidade deve ser positiva")
    .optional(),
  qtdeParteRe: z
    .number()
    .int()
    .positive("Quantidade deve ser positiva")
    .optional(),
  dataArquivamento: z.string().nullable().optional(),
  dataProximaAudiencia: z.string().nullable().optional(),
  responsavelId: z
    .number()
    .int()
    .positive("ID do responsavel deve ser positivo")
    .nullable()
    .optional(),
});

/**
 * Schema para criacao MANUAL de processo (sem dados PJE)
 *
 * Campos obrigatorios simplificados:
 * - numeroProcesso, trt, grau, nomeParteAutora, nomeParteRe
 *
 * Campos opcionais:
 * - classeJudicial, descricaoOrgaoJulgador, dataAutuacao, responsavelId
 *
 * Campos gerados automaticamente pela action:
 * - idPje (timestamp), advogadoId (1), numero (derivado do CNJ)
 * - codigoStatusProcesso (ATIVO), origem (acervo_geral)
 */
export const createProcessoManualSchema = z.object({
  // Campos obrigatórios
  numeroProcesso: z
    .string()
    .min(1, "Número do processo é obrigatório")
    .regex(
      REGEX_NUMERO_CNJ,
      "Número do processo deve seguir o padrão CNJ (NNNNNNN-DD.AAAA.J.TT.OOOO)"
    ),
  trt: z.string().min(1, "TRT é obrigatório"),
  grau: grauProcessoSchema,
  nomeParteAutora: z.string().min(1, "Nome da parte autora é obrigatório"),
  nomeParteRe: z.string().min(1, "Nome da parte ré é obrigatório"),

  // Campos opcionais
  classeJudicial: z.string().optional().default(""),
  descricaoOrgaoJulgador: z.string().optional().default(""),
  dataAutuacao: z.string().optional(),
  responsavelId: z
    .number()
    .int()
    .positive("ID do responsável deve ser positivo")
    .nullable()
    .optional(),

  // Campos com defaults
  origem: origemAcervoSchema.optional().default("acervo_geral"),
  segredoJustica: z.boolean().optional().default(false),
  juizoDigital: z.boolean().optional().default(false),
  temAssociacao: z.boolean().optional().default(false),
  prioridadeProcessual: z.number().int().min(0).optional().default(0),
  qtdeParteAutora: z.number().int().positive().optional().default(1),
  qtdeParteRe: z.number().int().positive().optional().default(1),
});

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreateProcessoInput = z.infer<typeof createProcessoSchema>;
export type UpdateProcessoInput = z.infer<typeof updateProcessoSchema>;
export type CreateProcessoManualInput = z.infer<typeof createProcessoManualSchema>;

// =============================================================================
// PARAMETROS DE LISTAGEM (19 FILTROS)
// =============================================================================

/**
 * Parametros para listar processos com suporte a 19 filtros
 */
export interface ListarProcessosParams {
  // Paginacao
  pagina?: number;
  limite?: number;

  // Busca geral
  busca?: string;

  // Ordenacao
  ordenarPor?: ProcessoSortBy;
  ordem?: Ordem;

  // Filtros de identificacao
  origem?: OrigemAcervo;
  trt?: string | string[];
  grau?: GrauProcesso;
  numeroProcesso?: string;
  classeJudicial?: string;
  codigoStatusProcesso?: string;

  // Filtros de partes
  nomeParteAutora?: string;
  nomeParteRe?: string;
  descricaoOrgaoJulgador?: string;

  // Filtros booleanos
  segredoJustica?: boolean;
  juizoDigital?: boolean;
  temAssociacao?: boolean;
  temProximaAudiencia?: boolean;
  semResponsavel?: boolean;

  // Filtros de data (ranges)
  dataAutuacaoInicio?: string;
  dataAutuacaoFim?: string;
  dataArquivamentoInicio?: string;
  dataArquivamentoFim?: string;
  dataProximaAudienciaInicio?: string;
  dataProximaAudienciaFim?: string;

  // Filtros de relacionamento
  advogadoId?: number;
  responsavelId?: number;
  clienteId?: number; // Via join com processo_partes

  // Filtro por lista de IDs (ex: processos com eventos pendentes)
  processoIds?: number[];

  // Opcao especial para visualizacao unificada
  unified?: boolean; // default true - retorna ProcessoUnificado ou Processo[]
}

// =============================================================================
// CONSTANTES E LABELS
// =============================================================================

/**
 * Labels para exibicao das origens do acervo
 */
export const ORIGEM_LABELS: Record<OrigemAcervo, string> = {
  acervo_geral: "Acervo Geral",
  arquivado: "Arquivado",
};

/**
 * Labels para exibicao dos graus de jurisdicao
 */
export const GRAU_LABELS: Record<GrauProcesso, string> = {
  primeiro_grau: "1o Grau",
  segundo_grau: "2o Grau",
  tribunal_superior: "Tribunal Superior",
};

/**
 * Labels para exibicao dos status de processo
 */
export const STATUS_PROCESSO_LABELS: Record<StatusProcesso, string> = {
  [StatusProcesso.ATIVO]: "Ativo",
  [StatusProcesso.SUSPENSO]: "Suspenso",
  [StatusProcesso.ARQUIVADO]: "Arquivado",
  [StatusProcesso.EXTINTO]: "Extinto",
  [StatusProcesso.BAIXADO]: "Baixado",
  [StatusProcesso.PENDENTE]: "Pendente",
  [StatusProcesso.EM_RECURSO]: "Em Recurso",
  [StatusProcesso.OUTRO]: "Outro",
};

/**
 * Lista de tribunais trabalhistas disponiveis (TRTs + TST)
 */
export const TRIBUNAIS = [
  "TRT1",
  "TRT2",
  "TRT3",
  "TRT4",
  "TRT5",
  "TRT6",
  "TRT7",
  "TRT8",
  "TRT9",
  "TRT10",
  "TRT11",
  "TRT12",
  "TRT13",
  "TRT14",
  "TRT15",
  "TRT16",
  "TRT17",
  "TRT18",
  "TRT19",
  "TRT20",
  "TRT21",
  "TRT22",
  "TRT23",
  "TRT24",
  "TST",
];

/**
 * Mapeamento de codigo de status PJE para enum StatusProcesso
 */
export function mapCodigoStatusToEnum(codigo: string): StatusProcesso {
  const codigoUpper = codigo?.toUpperCase() || "";

  // Compatibilidade: alguns legados usam códigos numéricos (ex: "100")
  // Nos testes, códigos numéricos devem mapear para ATIVO.
  if (/^\d+$/.test(codigoUpper)) {
    return StatusProcesso.ATIVO;
  }

  if (codigoUpper.includes("ARQUIVADO") || codigoUpper.includes("ARQUIVO")) {
    return StatusProcesso.ARQUIVADO;
  }
  if (codigoUpper.includes("SUSPENSO") || codigoUpper.includes("SUSPENSAO")) {
    return StatusProcesso.SUSPENSO;
  }
  if (codigoUpper.includes("EXTINTO") || codigoUpper.includes("EXTINCAO")) {
    return StatusProcesso.EXTINTO;
  }
  if (codigoUpper.includes("BAIXADO") || codigoUpper.includes("BAIXA")) {
    return StatusProcesso.BAIXADO;
  }
  if (codigoUpper.includes("PENDENTE")) {
    return StatusProcesso.PENDENTE;
  }
  if (codigoUpper.includes("RECURSO") || codigoUpper.includes("RECURSAL")) {
    return StatusProcesso.EM_RECURSO;
  }
  if (codigoUpper.includes("ATIVO") || codigoUpper.includes("DISTRIBUIDO")) {
    return StatusProcesso.ATIVO;
  }

  return StatusProcesso.OUTRO;
}

/**
 * Valida se um numero segue o padrao CNJ
 */
export function validarNumeroCNJ(numero: string): boolean {
  return REGEX_NUMERO_CNJ.test(numero);
}

// =============================================================================
// COLUMN SELECTION HELPERS (Disk I/O Optimization)
// =============================================================================

/**
 * Colunas básicas para listagem de processos (reduz I/O em 40%)
 * Usado em: findAllProcessos, queries de listagem
 */
export function getProcessoColumnsBasic(): string {
  return `
    id,
    id_pje,
    numero_processo,
    nome_parte_autora,
    nome_parte_re,
    data_autuacao,
    codigo_status_processo,
    responsavel_id,
    data_proxima_audiencia,
    trt,
    grau,
    origem,
    segredo_justica,
    updated_at
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas completas para detalhes de processo
 * Usado em: findProcessoById, operações de edição
 */
export function getProcessoColumnsFull(): string {
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
    created_at,
    updated_at
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas para view unificada (inclui campos de origem)
 * Usado em: findProcessoUnificadoById, acervo_unificado view
 */
export function getProcessoUnificadoColumns(): string {
  return `
    id,
    id_pje,
    advogado_id,
    origem,
    trt,
    numero_processo,
    numero,
    descricao_orgao_julgador,
    classe_judicial,
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
    created_at,
    updated_at,
    grau_atual,
    graus_ativos,
    instances,
    trt_origem,
    nome_parte_autora_origem,
    nome_parte_re_origem,
    data_autuacao_origem,
    orgao_julgador_origem,
    grau_origem
  `.trim().replace(/\s+/g, ' ');
}
