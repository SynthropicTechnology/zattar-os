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
