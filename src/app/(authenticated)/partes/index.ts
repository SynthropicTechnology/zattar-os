/**
 * Partes Feature Module - Main barrel export
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { useClientes } from '@/app/(authenticated)/partes/hooks/use-clientes';
 * import { ClientesTableWrapper } from '@/app/(authenticated)/partes/components/clientes';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { useClientes, ClientesTableWrapper } from '@/app/(authenticated)/partes';
 *
 * Este modulo centraliza toda a funcionalidade relacionada a partes processuais:
 * - Clientes
 * - Partes Contrarias
 * - Terceiros
 * - Representantes (Advogados)
 *
 * @example
 * // Importar componentes
 * import { ClientesTableWrapper, ClienteForm } from '@/app/(authenticated)/partes';
 *
 * // Importar hooks
 * import { usePartesContrarias, useTerceiros } from '@/app/(authenticated)/partes';
 *
 * // Importar utils
 * import { formatarCpf, formatarNome } from '@/app/(authenticated)/partes';
 *
 * // Importar tipos
 * import type { Cliente, ParteContraria } from '@/app/(authenticated)/partes';
 */

// ============================================================================
// Components
// ============================================================================
export {
  // Shared
  ProcessosRelacionadosCell,
  CopyButton,
  MapButton,
  FilterPopover,
  FilterPopoverMulti,
  // Clientes
  ClientesTableWrapper,
  ClienteForm,
  ClienteDocumentosViewer,
  // Partes Contrarias
  PartesContrariasTableWrapper,
  // Terceiros
  TerceirosTableWrapper,
  // Representantes
  RepresentantesTableWrapper,
} from "./components";

export type { FilterOption } from "./components";

// ============================================================================
// Hooks
// ============================================================================
export {
  useClientes,
  usePartesContrarias,
  useTerceiros,
  useRepresentantes,
  usePartes,
} from "./hooks";

export type { TipoEntidade, UsePartesParams, UsePartesResult } from "./hooks";

// ============================================================================
// Utils
// ============================================================================
export {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarCep,
  formatarNome,
  formatarEnderecoCompleto,
  formatarData,
  formatarTipoPessoa,
  calcularIdade,
} from "./utils";

// ============================================================================
// Types
// ============================================================================
export type {
  // Core types
  TipoPessoa,
  SituacaoPJE,
  GrauProcesso,
  ProcessoRelacionado,
  Cliente,
  ClienteBase,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  ParteContraria,
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
  // Extended types
  ParteEndereco,
  PaginationInfo,
  // Params types
  BuscarPartesContrariasParams,
  BuscarTerceirosParams,
  BuscarRepresentantesParams,
  // API response types
  PartesContrariasApiResponse,
  TerceirosApiResponse,
  // Filter types
  ClientesFilters,
  PartesContrariasFilters,
  TerceirosFilters,
  RepresentantesFilters,
  // Representante types
  Representante,
  InscricaoOAB,
  SituacaoOAB,
  TipoRepresentante,
  RepresentanteComEndereco,
  ListarRepresentantesResult,
} from "./types";

export type { ParteComDadosCompletos } from "./types";
export type { TipoParteProcesso, PoloProcessoParte } from "./types";
export { TIPOS_PARTE_PROCESSO_VALIDOS } from "./types";

// ============================================================================
// Domain (Schemas, Validation, Types)
// ============================================================================
// Additional domain types
export type {
  CreateClientePFInput,
  CreateClientePJInput,
  CreateClienteInput,
  UpdateClienteInput,
  ParteContrariaBase,
  CreateParteContrariaPFInput,
  CreateParteContrariaPJInput,
  CreateParteContrariaInput,
  UpdateParteContrariaInput,
  TerceiroBase,
  CreateTerceiroPFInput,
  CreateTerceiroPJInput,
  CreateTerceiroInput,
  UpdateTerceiroInput,
  OrdenarPorParte,
  Ordem,
  OrdenarPorTerceiro,
  ClienteComEndereco,
  ClienteComEnderecoEProcessos,
  ParteContrariaComEndereco,
  ParteContrariaComEnderecoEProcessos,
  TerceiroComEndereco,
  TerceiroComEnderecoEProcessos,
} from "./domain";

// Functions and Schemas
export {
  normalizarDocumento,
  validarCpfFormato,
  validarCpfDigitos,
  validarCnpjFormato,
  validarCnpjDigitos,
  validarEmail,
  cpfSchema,
  cpfStrictSchema,
  cnpjSchema,
  cnpjStrictSchema,
  emailArraySchema,
  createClientePFSchema,
  createClientePJSchema,
  createClienteSchema,
  updateClienteSchema,
  createParteContrariaPFSchema,
  createParteContrariaPJSchema,
  createParteContrariaSchema,
  updateParteContrariaSchema,
  createTerceiroPFSchema,
  createTerceiroPJSchema,
  createTerceiroSchema,
  updateTerceiroSchema,
} from "./domain";

// ============================================================================
// Actions (Server Actions — safe for client bundles via 'use server')
// ============================================================================
// Re-exports do wrapper "use server" (actions.ts — subconjunto seguro para Client Components)
export {
  actionListarClientes,
  actionCriarCliente,
  actionAtualizarClienteForm,
  actionDesativarCliente,
  actionDesativarClientesEmMassa,
  actionContarClientesComEstatisticas,
  actionContarClientesPorEstado,
  actionContarPartesContrariasComEstatisticas,
  actionBuscarPartesPorProcessoEPolo,
  actionCriarParteContraria,
  actionAtualizarParteContraria,
  actionCriarTerceiro,
  actionAtualizarTerceiro,
} from "./actions";

// Re-exports do diretório actions/ (actions completas — MCP, server-only, etc.)
export {
  actionBuscarCliente,
  actionAtualizarCliente,
  actionBuscarParteContraria,
  actionBuscarTerceiro,
  actionBuscarRepresentantePorId,
  actionBuscarProcessosPorEntidade,
  actionBuscarRepresentantesPorCliente,
  actionBuscarClientesPorRepresentante,
  actionListarRepresentantes,
  actionCriarRepresentante,
  actionAtualizarRepresentante,
} from "./actions/index";

// ============================================================================
// Server-only exports
// ============================================================================
// Services e Repositories devem ser importados via server entrypoint:
//   import { findClienteById } from '@/app/(authenticated)/partes/server';
// NÃO re-exportar aqui para evitar vazamento de server-only no bundle client.

// ============================================================================
// Errors
// ============================================================================
export {
  DocumentoDuplicadoError,
  DocumentoInvalidoError,
  TipoPessoaIncompativelError,
  EntidadeNaoEncontradaError,
  CampoObrigatorioError,
  EmailInvalidoError,
  toAppError,
  isDocumentoDuplicadoError,
  isDocumentoInvalidoError,
  isTipoPessoaIncompativelError,
  isEntidadeNaoEncontradaError,
  isCampoObrigatorioError,
  isEmailInvalidoError,
  isPartesError,
  clienteCpfDuplicadoError,
  clienteCnpjDuplicadoError,
  parteContrariaCpfDuplicadoError,
  parteContrariaCnpjDuplicadoError,
  terceiroCpfDuplicadoError,
  terceiroCnpjDuplicadoError,
  clienteNaoEncontradoError,
  parteContrariaNaoEncontradaError,
  terceiroNaoEncontradoError,
  errorCodeToHttpStatus,
  appErrorToHttpResponse,
} from "./errors";
