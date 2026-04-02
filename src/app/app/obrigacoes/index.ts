
// Types - Legal entities only (sync types moved to financeiro)
export type {
  AcordoCondenacao,
  Parcela,
  AcordoComParcelas,
  ParcelaComLancamento,
  TipoObrigacao,
  DirecaoPagamento,
  StatusAcordo,
  StatusParcela,
  StatusRepasse,
  SplitPagamento,
  FormaPagamento,
  ObrigacoesFilters,
  ResumoObrigacoes,
  AlertasObrigacoesType,
  CriarAcordoComParcelasParams,
  ListarAcordosParams,
  AtualizarAcordoParams,
  ProcessoInfo,
  RepassePendente,
  FiltrosRepasses,
  RegistrarRepasseParams,
  MarcarParcelaRecebidaParams,
  AtualizarParcelaParams
} from './domain';

// Domain - Schemas and Constants
export {
  acordoCondenacaoSchema,
  parcelaSchema,
  TIPO_LABELS,
  DIRECAO_LABELS,
  STATUS_LABELS,
  FORMA_PAGAMENTO_LABELS,
  STATUS_REPASSE_LABELS,
  PERCENTUAL_ESCRITORIO_PADRAO,
  INTERVALO_PARCELAS_PADRAO,
  criarAcordoComParcelasSchema,
  atualizarAcordoSchema,
  marcarParcelaRecebidaSchema,
} from './domain';

// Domain - Business Logic Functions (legal only, sync functions moved to financeiro)
export {
  calcularSplitPagamento,
  podeIniciarRepasse,
  podeFinalizarRepasse,
  calcularSaldoDevedor,
  calcularRepassesPendentes,
  determinarStatusAcordo,
  validarIntegridadeParcela,
  determinarStatusSincronizacao,
} from './domain';

// Utils
export {
  formatarTipo,
  formatarDirecao,
  formatarStatus,
  formatarStatusRepasse,
  formatarFormaPagamento,
  getTipoColorClass,
  getDirecaoColorClass,
  getStatusColorClass,
  formatCurrency,
} from './utils';

// Repository (for internal financeiro usage)
// NOTE: exports server-only removidos do barrel publico para evitar bundling no browser.
// Use `@/app/app/obrigacoes/server` (server-only) quando precisar de repository/service.

// Actions
// NOTE: exports de Server Actions removidos do barrel público para evitar bundling no browser.
// Use `@/app/app/obrigacoes/server-actions`.

// Hooks
export { useRepassesPendentes } from './hooks/use-repasses-pendentes';

// Components
export { AcordoForm } from './components/dialogs/acordo-form';
export { NovaObrigacaoDialog } from './components/dialogs/nova-obrigacao-dialog';
export { ObrigacoesContent } from './components/obrigacoes-content';
export { ObrigacoesTableWrapper } from './components/table/obrigacoes-table-wrapper';
export { ObrigacoesMonthWrapper } from './components/calendar/obrigacoes-month-wrapper';
export { ObrigacoesYearWrapper } from './components/calendar/obrigacoes-year-wrapper';
export { ObrigacoesCalendarCompact } from './components/calendar/obrigacoes-calendar-compact';
export { ObrigacoesDayList } from './components/calendar/obrigacoes-day-list';
export { ResumoCards } from './components/shared/resumo-cards';
export { AlertasObrigacoes } from './components/shared/alertas-obrigacoes';

export { ParcelasTable } from './components/parcelas/parcelas-table';
export { EditParcelaDialog } from './components/parcelas/edit-parcela-dialog';
export { IntegracaoFinanceiraSection } from './components/parcelas/integracao-financeira-section';

export { RepassesPendentesList } from './components/repasses/repasses-pendentes-list';
export { UploadDeclaracaoDialog } from './components/repasses/upload-declaracao-dialog';
export { UploadComprovanteDialog } from './components/repasses/upload-comprovante-dialog';
