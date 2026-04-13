/**
 * CONTRATOS FEATURE - Actions Barrel Export
 *
 * Re-exporta todas as Server Actions do módulo de contratos.
 */

export type {
  ActionResult,
  ContratoCompleto,
  ContratoCompletoStats,
  ClienteDetalhado,
  ResponsavelDetalhado,
  SegmentoDetalhado,
  ContratosPulseStats,
} from "./contratos-actions";
export {
  actionCriarContrato,
  actionAtualizarContrato,
  actionListarContratos,
  actionBuscarContrato,
  actionBuscarContratoCompleto,
  actionContarContratosPorStatus,
  actionContarContratosComEstatisticas,
  actionResolverNomesEntidadesContrato,
  actionExcluirContrato,
  actionAlterarStatusContratosEmMassa,
  actionAtribuirResponsavelContratosEmMassa,
  actionAlterarSegmentoContratosEmMassa,
  actionExcluirContratosEmMassa,
  actionAlterarResponsavelContrato,
  actionContratosStats,
  actionContratosPulseStats,
} from "./contratos-actions";

// Segmentos Actions
export type {
  Segmento,
  CreateSegmentoInput,
  UpdateSegmentoInput,
} from "./segmentos-actions";
export {
  actionListarSegmentos,
  actionCriarSegmento,
  actionAtualizarSegmento,
  actionDeletarSegmento,
} from "./segmentos-actions";
