/**
 * Barrel export para Componentes do módulo financeiro
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { ContaPagarFormDialog } from '@/app/(authenticated)/financeiro/components/contas-pagar/conta-pagar-form-dialog';
 */

// ============================================================================
// Componentes Gerais
// ============================================================================
export { ExportButton } from './export-button';

// ============================================================================
// Componentes Compartilhados
// ============================================================================
export { ChartSkeleton } from './shared/chart-skeleton';
export { OrigemLancamentoSection } from './shared/origem-lancamento-section';
export { FiltroStatus } from './shared/filtros/filtro-status';
export { FiltroVencimento } from './shared/filtros/filtro-vencimento';
export { FiltroCategoria } from './shared/filtros/filtro-categoria';
export { FiltroContaContabil } from './shared/filtros/filtro-conta-contabil';
export { FiltroCentroCusto } from './shared/filtros/filtro-centro-custo';
export { FiltroCliente } from './shared/filtros/filtro-cliente';
export { FiltroFornecedor } from './shared/filtros/filtro-fornecedor';
export { MaisFiltrosPopover } from './shared/filtros/mais-filtros-popover';
export { MaisFiltrosReceberPopover } from './shared/filtros/mais-filtros-receber-popover';

// ============================================================================
// Contas a Pagar
// ============================================================================
export { AlertasVencimento } from './contas-pagar/alertas-vencimento';
export { ContaPagarFormDialog } from './contas-pagar/conta-pagar-form-dialog';
export { PagarContaDialog } from './contas-pagar/pagar-conta-dialog';

// ============================================================================
// Contas a Receber
// ============================================================================
export { AlertasInadimplencia } from './contas-receber/alertas-inadimplencia';
export { ContaReceberFormDialog } from './contas-receber/conta-receber-form-dialog';
export { ReceberContaDialog } from './contas-receber/receber-conta-dialog';

// ============================================================================
// Conciliação
// ============================================================================
export { AlertasConciliacao } from './conciliacao/alertas-conciliacao';
export {
  buildConciliacaoFilterOptions,
  buildConciliacaoFilterGroups,
  parseConciliacaoFilters,
} from './conciliacao/conciliacao-toolbar-filters';
export {
  ConciliacaoListFilters,
  calcularPeriodo,
} from './conciliacao/conciliacao-list-filters';
export type {
  StatusConciliacaoFilter,
  PeriodoFilter,
  ConciliacaoListFiltersProps,
} from './conciliacao/conciliacao-list-filters';
export { ConciliarManualDialog } from './conciliacao/conciliar-manual-dialog';
export { ImportarExtratoDialog } from './conciliacao/importar-extrato-dialog';
export { TransacoesImportadasTable } from './conciliacao/transacoes-importadas-table';

// ============================================================================
// Plano de Contas
// ============================================================================
export { PlanoContaCreateDialog } from './plano-contas/plano-conta-create-dialog';
export { PlanoContaEditDialog } from './plano-contas/plano-conta-edit-dialog';
export {
  PlanoContaSelect,
  PlanoContaPaiSelect,
  PlanoContaAnaliticaSelect,
} from './plano-contas/plano-conta-select';
export {
  PLANO_CONTAS_FILTER_CONFIGS,
  buildPlanoContasFilterOptions,
  buildPlanoContasFilterGroups,
  parsePlanoContasFilters,
} from './plano-contas/plano-contas-toolbar-filters';
export { MaisFiltrosPlanoContasPopover } from './plano-contas/mais-filtros-plano-contas-popover';

// ============================================================================
// Orçamentos
// ============================================================================
export { OrcamentoFormDialog } from './orcamentos/orcamento-form-dialog';
export type { OrcamentoFormDialogProps } from './orcamentos/orcamento-form-dialog';
export { OrcamentoItemDialog } from './orcamentos/orcamento-item-dialog';
export {
  ORCAMENTOS_FILTER_CONFIGS,
  buildOrcamentosFilterOptions,
  buildOrcamentosFilterGroups,
  parseOrcamentosFilters,
  filtersToSelectedIds,
} from './orcamentos/orcamentos-toolbar-filters';
export { ResumoCards } from './orcamentos/resumo-cards';

// ============================================================================
// Dashboard
// ============================================================================
export { FinanceiroDashboard } from './dashboard/financeiro-dashboard';

// ============================================================================
// Provider de UsuarioId
// ============================================================================
export { UsuarioIdProvider, useUsuarioId } from './usuario-id-provider';