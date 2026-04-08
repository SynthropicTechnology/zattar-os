/**
 * Obrigações Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de obrigações.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Server Actions devem ser importadas diretamente de `actions/`:
 *   import { actionBuscarAcordo } from '@/app/(authenticated)/obrigacoes/actions';
 *
 * Repository e Service são server-only e devem ser importados diretamente:
 *   import { ObrigacoesRepository } from '@/app/(authenticated)/obrigacoes/repository';
 *   import * as ObrigacoesService from '@/app/(authenticated)/obrigacoes/service';
 */

// ============================================================================
// Components
// ============================================================================
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

// ============================================================================
// Hooks
// ============================================================================
export { useRepassesPendentes } from './hooks/use-repasses-pendentes';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
// NOTE: Server Actions não são re-exportadas no barrel público para evitar
// bundling no browser. Importe diretamente de:
//   import { actionX } from '@/app/(authenticated)/obrigacoes/actions';

// ============================================================================
// Types / Domain
// ============================================================================
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
  AtualizarParcelaParams,
} from './domain';

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

// ============================================================================
// Utils
// ============================================================================
export {
  formatarTipo,
  formatarDirecao,
  formatarStatus,
  formatarStatusRepasse,
  formatarFormaPagamento,
  formatCurrency,
} from './utils';

// ============================================================================
// Server-only exports
// ============================================================================
// Repository e Service são server-only e devem ser importados diretamente:
//   import { ObrigacoesRepository } from '@/app/(authenticated)/obrigacoes/repository';
//   import * as ObrigacoesService from '@/app/(authenticated)/obrigacoes/service';
// NÃO re-exportar aqui para evitar vazamento de server-only no bundle client.
