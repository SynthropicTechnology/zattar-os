/**
 * CONTRATOS FEATURE - Tipos Auxiliares
 *
 * Tipos utilizados pela UI e API, separados dos tipos de domínio.
 * Este arquivo resolve o import `@/app/(authenticated)/contratos/types` usado em outros módulos.
 *
 * NOTA: Tipos de domínio principais (Contrato, ParteContrato, enums) estão em domain.ts
 *       mas são re-exportados aqui para compatibilidade com imports existentes.
 */

import type {
  Contrato,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
} from './domain';

// =============================================================================
// TIPOS DE RESPOSTA API
// =============================================================================

/**
 * Resposta da API de contratos (formato padrão)
 */
export interface ContratosApiResponse {
  success: boolean;
  data: {
    contratos: Contrato[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

// =============================================================================
// TIPOS DE PARÂMETROS
// =============================================================================

/**
 * Parâmetros para buscar contratos (frontend)
 *
 * @example
 * ```typescript
 * const params: BuscarContratosParams = {
 *   pagina: 1,
 *   limite: 10,
 *   status: 'contratado',
 *   tipoContrato: 'ajuizamento',
 * };
 * ```
 */
export interface BuscarContratosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipoContrato?: TipoContrato;
  tipoCobranca?: TipoCobranca;
  status?: StatusContrato;
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
}

// =============================================================================
// TIPOS DE FILTROS
// =============================================================================

/**
 * Estado de filtros da página de contratos
 *
 * @example
 * ```typescript
 * const [filters, setFilters] = useState<ContratosFilters>({});
 *
 * const handleFilterChange = (newFilters: ContratosFilters) => {
 *   setFilters(newFilters);
 * };
 * ```
 */
export interface ContratosFilters {
  tipoContrato?: TipoContrato;
  tipoCobranca?: TipoCobranca;
  status?: StatusContrato;
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
}

// =============================================================================
// TIPOS DE PAGINAÇÃO
// =============================================================================

/**
 * Informações de paginação
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// =============================================================================
// TIPOS DE ENTIDADES RELACIONADAS
// =============================================================================

/**
 * Info básica de cliente/parte para selects e autocompletes
 *
 * @example
 * ```typescript
 * const clientes: ClienteInfo[] = await buscarClientes();
 *
 * <Select>
 *   {clientes.map(c => (
 *     <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
 *   ))}
 * </Select>
 * ```
 */
export interface ClienteInfo {
  id: number;
  nome: string;
  avatarUrl?: string | null;
}

/**
 * Info básica de responsável para selects
 */
export interface ResponsavelInfo {
  id: number;
  nome: string;
}

/**
 * Info básica de segmento para selects
 */
export interface SegmentoInfo {
  id: number;
  nome: string;
  slug: string;
}
