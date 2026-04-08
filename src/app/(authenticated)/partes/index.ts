/**
 * Partes Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de partes processuais.
 * Toda importação cross-módulo DEVE passar por este arquivo.
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
 * Entidades: Clientes, Partes Contrárias, Terceiros, Representantes (Advogados)
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
// Actions (Server Actions)
// ============================================================================

// --- Client-safe actions (wrapped with 'use server' in actions.ts) ---
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

// --- Safe Actions (com validação next-safe-action) ---
export {
  actionListarClientesSafe,
  actionBuscarClienteSafe,
  actionListarClientesSugestoesSafe,
  actionCriarClienteSafe,
  actionAtualizarClienteSafe,
  actionDesativarClienteSafe,
  actionListarPartesContrariasSafe,
  actionBuscarParteContrariaSafe,
  actionCriarParteContrariaSafe,
  actionAtualizarParteContrariaSafe,
  actionDesativarPartesContrariasEmMassa,
  actionListarTerceirosSafe,
  actionBuscarTerceiroSafe,
  actionCriarTerceiroSafe,
  actionAtualizarTerceiroSafe,
  actionDesativarTerceirosEmMassa,
} from "./actions/index";

// --- Direct Actions (MCP, server-only, etc.) ---
export {
  actionBuscarCliente,
  actionAtualizarCliente,
  actionListarClientesSugestoes,
  actionBuscarClientePorCPF,
  actionBuscarClientePorCNPJ,
  actionContarClientes,
  actionBuscarParteContraria,
  actionBuscarTerceiro,
  actionBuscarProcessosPorEntidade,
  actionBuscarRepresentantesPorCliente,
  actionBuscarClientesPorRepresentante,
} from "./actions/index";

// --- Representantes Actions ---
export {
  actionListarRepresentantes,
  actionBuscarRepresentantePorId,
  actionCriarRepresentante,
  actionAtualizarRepresentante,
  actionDeletarRepresentante,
  actionUpsertRepresentantePorCPF,
  actionBuscarRepresentantePorNome,
  actionBuscarRepresentantesPorOAB,
  actionDeletarRepresentantesEmMassa,
} from "./actions/index";

// --- Stats Actions ---
export {
  actionContarPartesPorTipo,
} from "./actions/index";

export type {
  ContarPartesPorTipoData,
  PartesTipoCounts,
} from "./actions/index";

// --- Form Actions (useActionState) ---
export {
  actionListarPartesContrarias,
  actionListarTerceiros,
} from "./actions/index";

export type { ActionResult } from "./actions/index";

// ============================================================================
// Types / Domain
// ============================================================================

// --- Core domain types ---
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
  ParteContrariaBase,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  ParteContrariaComEndereco,
  Terceiro,
  TerceiroBase,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  TipoParteTerceiro,
  PoloTerceiro,
  ListarClientesParams,
  ListarPartesContrariasParams,
  ListarTerceirosParams,
  // Input types (schemas)
  CreateClientePFInput,
  CreateClientePJInput,
  CreateClienteInput,
  UpdateClienteInput,
  CreateParteContrariaPFInput,
  CreateParteContrariaPJInput,
  CreateParteContrariaInput,
  UpdateParteContrariaInput,
  CreateTerceiroPFInput,
  CreateTerceiroPJInput,
  CreateTerceiroInput,
  UpdateTerceiroInput,
  // Ordering
  OrdenarPorParte,
  Ordem,
  OrdenarPorTerceiro,
  // Extended types (com endereço e processos)
  ClienteComEndereco,
  ClienteComEnderecoEProcessos,
  ParteContrariaComEnderecoEProcessos,
  TerceiroComEndereco,
  TerceiroComEnderecoEProcessos,
} from "./domain";

// --- Domain schemas & validation functions ---
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

// --- Frontend-specific types (types/) ---
export type {
  ParteComDadosCompletos,
  TipoParteProcesso,
  PoloProcessoParte,
  ParteEndereco,
  PaginationInfo,
  BuscarPartesContrariasParams,
  BuscarTerceirosParams,
  BuscarRepresentantesParams,
  PartesContrariasApiResponse,
  TerceirosApiResponse,
  ClientesFilters,
  PartesContrariasFilters,
  TerceirosFilters,
  RepresentantesFilters,
  Representante,
  InscricaoOAB,
  SituacaoOAB,
  TipoRepresentante,
  Polo,
  RepresentanteComEndereco,
  ListarRepresentantesResult,
} from "./types";

export { TIPOS_PARTE_PROCESSO_VALIDOS } from "./types";

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

export {
  validarInput,
  verificarDuplicidadeDocumento,
  verificarDuplicidadeDocumentoUpdate,
} from "./utils";

// ============================================================================
// Errors
// ============================================================================
export {
  // Error classes
  DocumentoDuplicadoError,
  DocumentoInvalidoError,
  TipoPessoaIncompativelError,
  EntidadeNaoEncontradaError,
  CampoObrigatorioError,
  EmailInvalidoError,
  // Conversion helpers
  toAppError,
  // Type guards
  isDocumentoDuplicadoError,
  isDocumentoInvalidoError,
  isTipoPessoaIncompativelError,
  isEntidadeNaoEncontradaError,
  isCampoObrigatorioError,
  isEmailInvalidoError,
  isPartesError,
  // Error factories
  clienteCpfDuplicadoError,
  clienteCnpjDuplicadoError,
  parteContrariaCpfDuplicadoError,
  parteContrariaCnpjDuplicadoError,
  terceiroCpfDuplicadoError,
  terceiroCnpjDuplicadoError,
  clienteNaoEncontradoError,
  parteContrariaNaoEncontradaError,
  terceiroNaoEncontradoError,
  // HTTP helpers
  errorCodeToHttpStatus,
  appErrorToHttpResponse,
} from "./errors";

// ============================================================================
// Server-only exports
// ============================================================================
// Services e Repositories devem ser importados via server entrypoint:
//   import { findClienteById } from '@/app/(authenticated)/partes/server';
// NÃO re-exportar aqui para evitar vazamento de server-only no bundle client.
