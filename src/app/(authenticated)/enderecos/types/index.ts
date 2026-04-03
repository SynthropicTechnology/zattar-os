// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Grau de jurisdição de um processo.
 * Definido localmente para evitar dependência circular com @/app/(authenticated)/partes.
 */
export type GrauProcesso = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Define a que tipo de entidade um endereço está associado.
 * Esta é uma relação polimórfica.
 */
export type EntidadeTipoEndereco = 'cliente' | 'parte_contraria' | 'terceiro';

/**
 * Situação de um endereço, especialmente em sincronia com o PJE.
 * - `A`: Ativo
 * - `I`: Inativo
 * - `P`: Principal (endereço de correspondência)
 * - `H`: Histórico
 */
export type SituacaoEndereco = 'A' | 'I' | 'P' | 'H';

/**
 * Classificação de um endereço (e.g., residencial, comercial).
 */
export interface ClassificacaoEndereco {
  codigo?: string;
  descricao?: string;
}

/**
 * Representa um endereço físico associado a uma entidade (cliente,
 * parte contrária ou terceiro).
 */
export interface Endereco {
  id: number;
  id_pje: number | null;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
  trt: string | null;
  grau: GrauProcesso | null;
  numero_processo: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  id_municipio_pje: number | null;
  municipio: string | null;
  municipio_ibge: string | null;
  estado_id_pje: number | null;
  estado_sigla: string | null;
  estado_descricao: string | null;
  estado: string | null;
  pais_id_pje: number | null;
  pais_codigo?: string | null;
  pais_descricao?: string | null;
  pais: string | null;
  cep: string | null;
  classificacoes_endereco: ClassificacaoEndereco[] | null;
  correspondencia: boolean | null;
  situacao: SituacaoEndereco | null;
  dados_pje_completo: Record<string, unknown> | null;
  id_usuario_cadastrador_pje: number | null;
  data_alteracao_pje: string | null;
  ativo: boolean | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONTRACT TYPES (PARAMS)
// ============================================================================

export type OrdenarPorEndereco = 'created_at' | 'municipio' | 'estado' | 'cep';
export type OrdemEndereco = 'asc' | 'desc';

export interface CriarEnderecoParams {
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
  id_pje?: number | null;
  trt?: string | null;
  grau?: GrauProcesso | null;
  numero_processo?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  id_municipio_pje?: number | null;
  municipio?: string | null;
  municipio_ibge?: string | null;
  estado_id_pje?: number | null;
  estado_sigla?: string | null;
  estado_descricao?: string | null;
  estado?: string | null;
  pais_id_pje?: number | null;
  pais_codigo?: string | null;
  pais_descricao?: string | null;
  pais?: string | null;
  cep?: string | null;
  classificacoes_endereco?: ClassificacaoEndereco[] | null;
  correspondencia?: boolean | null;
  situacao?: SituacaoEndereco | null;
  dados_pje_completo?: Record<string, unknown> | null;
  id_usuario_cadastrador_pje?: number | null;
  data_alteracao_pje?: string | null;
  ativo?: boolean | null;
}

export interface AtualizarEnderecoParams extends Partial<CriarEnderecoParams> {
  id: number;
}

export interface ListarEnderecosParams {
  entidade_tipo?: EntidadeTipoEndereco;
  entidade_id?: number;
  trt?: string;
  grau?: GrauProcesso;
  numero_processo?: string;
  municipio?: string;
  estado_sigla?: string;
  estado?: string;
  pais_codigo?: string;
  pais?: string;
  cep?: string;
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  ativo?: boolean;
  busca?: string;
  ordenar_por?: OrdenarPorEndereco;
  ordem?: OrdemEndereco;
  pagina?: number;
  limite?: number;
}

export interface ListarEnderecosResult {
  enderecos: Endereco[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface UpsertEnderecoPorIdPjeParams extends CriarEnderecoParams {
  id_pje: number;
}

export interface BuscarEnderecosPorEntidadeParams {
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
}

export interface DefinirEnderecoPrincipalParams {
  id: number;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
}
