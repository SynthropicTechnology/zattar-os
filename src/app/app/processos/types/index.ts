/**
 * PROCESSOS TYPES - Tipos para integração Frontend
 *
 * Tipos específicos para uso na camada de apresentação (React/Next.js).
 */

import type {
  Processo,
  ProcessoUnificado,
  ProcessoInstancia,
  OrigemAcervo,
  Ordem,
  ProcessoSortBy,
} from "../domain";
import type { GrauProcesso } from "@/app/app/partes";

// Re-export dos tipos do domain para conveniência
export type {
  Processo,
  ProcessoUnificado,
  ProcessoInstancia,
  OrigemAcervo,
  Ordem,
  ProcessoSortBy,
  GrauProcesso,
};

// Runtime export (fixtures/tests expect `StatusProcesso.ATIVO` etc)
export { StatusProcesso } from "../domain";

/**
 * Campos disponíveis para ordenação de acervo (snake_case para compatibilidade UI)
 */
export type OrdenarPorAcervo =
  | "data_autuacao"
  | "numero_processo"
  | "nome_parte_autora"
  | "nome_parte_re"
  | "data_arquivamento"
  | "data_proxima_audiencia"
  | "prioridade_processual"
  | "created_at"
  | "updated_at";

/**
 * Campos disponíveis para agrupamento de acervo
 */
export type AgruparPorAcervo =
  | "trt"
  | "grau"
  | "origem"
  | "responsavel_id"
  | "classe_judicial"
  | "codigo_status_processo"
  | "orgao_julgador"
  | "mes_autuacao"
  | "ano_autuacao";

/**
 * Ordem de ordenação
 */
export type OrdemAcervo = Ordem;

/**
 * Parâmetros para listar acervo com filtros, paginação, ordenação e agrupamento
 */
export interface ListarAcervoParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Unificação de processos multi-instância
  unified?: boolean; // default: true

  // Filtros básicos
  origem?: OrigemAcervo;
  trt?: string;
  grau?: GrauProcesso;
  responsavel_id?: number | "null";
  sem_responsavel?: boolean;

  // Busca textual (busca em múltiplos campos)
  busca?: string;

  // Filtros específicos por campo
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  tem_associacao?: boolean;

  // Filtros de data (ranges)
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;
  data_arquivamento_inicio?: string;
  data_arquivamento_fim?: string;
  data_proxima_audiencia_inicio?: string;
  data_proxima_audiencia_fim?: string;
  tem_proxima_audiencia?: boolean;

  // Ordenação
  ordenar_por?: OrdenarPorAcervo;
  ordem?: OrdemAcervo;

  // Agrupamento
  agrupar_por?: AgruparPorAcervo;
  incluir_contagem?: boolean; // default: true
}

/**
 * Resposta da API de acervo (formato padrão ou unificado)
 */
export interface AcervoApiResponse {
  success: boolean;
  data: {
    processos: (Processo | ProcessoUnificado)[];
    paginacao: {
      pagina: number;
      limite: number;
      total: number;
      totalPaginas: number;
    };
  };
}

/**
 * Parâmetros para buscar processos (frontend)
 */
export interface BuscarProcessosParams extends Partial<ListarAcervoParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  ordenar_por?: ListarAcervoParams["ordenar_por"];
  ordem?: ListarAcervoParams["ordem"];
}

/**
 * Estado de filtros da página de processos
 */
export interface ProcessosFilters {
  origem?: "acervo_geral" | "arquivado";
  trt?: string;
  grau?: GrauProcesso;
  responsavel_id?: number | "null";
  sem_responsavel?: boolean;
  busca?: string;
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  tem_associacao?: boolean;
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;
  data_arquivamento_inicio?: string;
  data_arquivamento_fim?: string;
  data_proxima_audiencia_inicio?: string;
  data_proxima_audiencia_fim?: string;
  tem_proxima_audiencia?: boolean;
}

export type FiltrosProcesso = ProcessosFilters;
