/**
 * Types do modulo de partes
 * Re-exporta tipos do core e define tipos especificos do frontend
 */

// Re-exportar tipos do core para conveniencia
export type {
  TipoPessoa,
  SituacaoPJE,
  GrauProcesso,
  ProcessoRelacionado,
  Cliente,
  ClienteBase,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  ParteContraria,
  ParteContrariaComEndereco,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  TipoParteTerceiro,
  PoloTerceiro,
  ListarClientesParams,
  ListarPartesContrariasParams,
  ListarTerceirosParams,
} from "../domain";

// Processo-Partes
export type { ParteComDadosCompletos } from "./processo-partes";
export type { TipoParteProcesso, PoloProcessoParte } from "./processo-partes";
export { TIPOS_PARTE_PROCESSO_VALIDOS } from "./processo-partes";

// Tipos de endereco
export type ParteEndereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

// Tipos estendidos com processos relacionados
export type { ProcessoRelacionado as ProcessoRelacionadoBase } from "../domain";

// Tipos de paginacao
export interface PaginationInfo {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

// Parametros de busca para hooks
export interface BuscarPartesContrariasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipo_pessoa?: "pf" | "pj";
  situacao?: "A" | "I" | "E" | "H";
  incluirEndereco?: boolean;
  incluirProcessos?: boolean;
}

export interface BuscarTerceirosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipo_pessoa?: "pf" | "pj";
  tipo_parte?: string;
  polo?: string;
  situacao?: "A" | "I";
  incluirEndereco?: boolean;
  incluirProcessos?: boolean;
}

export interface BuscarRepresentantesParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  oab?: string;
  uf_oab?: string;
  incluirEndereco?: boolean;
  incluirProcessos?: boolean;
}

// Respostas da API
export interface PartesContrariasApiResponse {
  success: boolean;
  data: {
    partesContrarias: import("../domain").ParteContraria[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

export interface TerceirosApiResponse {
  success: boolean;
  data: {
    terceiros: import("../domain").Terceiro[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

// Filtros
export interface ClientesFilters {
  tipo_pessoa?: "pf" | "pj";
  situacao?: "A" | "I" | "E" | "H";
  trt?: string;
  grau?: "primeiro_grau" | "segundo_grau" | "tribunal_superior";
}

export interface PartesContrariasFilters {
  tipo_pessoa?: "pf" | "pj";
  situacao?: "A" | "I" | "E" | "H";
}

export interface TerceirosFilters {
  tipo_pessoa?: "pf" | "pj";
  tipo_parte?: string;
  polo?: string;
  situacao?: "A" | "I";
}

export interface RepresentantesFilters {
  tipo_pessoa?: "pf" | "pj";
  situacao?: "A" | "I";
  busca?: string;
}

// Re-exportar tipos de representantes do backend
export type {
  Representante,
  InscricaoOAB,
  SituacaoOAB,
  TipoRepresentante,
  Polo,
  RepresentanteComEndereco,
  ListarRepresentantesResult,
} from "./representantes";
