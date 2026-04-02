/**
 * Acervo Feature - Barrel Exports
 * Public API for the acervo feature
 */

// Types
export type {
  Acervo,
  OrigemAcervo,
  GrauAcervo,
  ProcessoInstancia,
  ProcessoUnificado,
  AgrupamentoAcervo,
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  ListarAcervoUnificadoResult,
  OrdenarPorAcervo,
  AgruparPorAcervo,
  OrdemAcervo,
  ProcessoClienteCpfRow,
  ClienteRespostaIA,
  ResumoProcessosIA,
  InstanciaProcessoIA,
  TimelineItemIA,
  UltimaMovimentacaoIA,
  TimelineStatus,
  TimelineJSONB,
  ProcessoRespostaIA,
  ProcessosClienteCpfResponse,
} from './domain';

// Domain
export {
  mapearStatusProcesso,
  converterParaAcervo,
  TRT_NOMES,
  TIPO_PARTE_NOMES,
  CLASSE_JUDICIAL_NOMES,
} from './domain';

// Utils
export {
  formatarCpf,
  formatarData,
  formatarDataHora,
  traduzirTrt,
  traduzirTipoParte,
  traduzirClasseJudicial,
  formatarItemTimeline,
  formatarTimeline,
  extrairUltimaMovimentacao,
  agruparProcessosPorNumero,
  formatarInstancia,
  formatarProcessoParaIA,
  type ProcessoAgrupado,
  type FormatarProcessoOpcoes,
} from './utils';

// Actions
export {
  actionListarAcervoPaginado,
  actionListarAcervoUnificado,
  actionBuscarProcesso,
  actionAtribuirResponsavel,
  actionBuscarProcessosClientePorCpf,
  actionExportarAcervoCSV,
  actionObterTimelinePorId,
  actionRecapturarTimeline,
} from './actions/acervo-actions';

// NOTE:
// Não re-exportar `./service` aqui, pois ele depende de módulos server-only (ex: captura/Playwright)
// e este barrel é consumido por Client Components.

// NOTE:
// Não re-exportar `./timeline-unificada` aqui, pois pode depender de módulos server-only
// e este barrel é consumido por Client Components.

// Hooks
export {
  useAcervo,
  useProcesso,
  useAtribuirResponsavel,
  useProcessosClienteCpf,
  useAcervoFilters,
} from './hooks/use-acervo';

// Components
export { AcervoTable } from './components/list/acervo-table';
export { AcervoFilters } from './components/list/acervo-filters';
