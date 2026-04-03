/**
 * Barrel export para Server Actions do módulo financeiro
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { actionListarLancamentos } from '@/app/(authenticated)/financeiro/actions/lancamentos';
 */

// ============================================================================
// Lancamentos - Server Actions
// ============================================================================
export {
  actionListarLancamentos,
  actionExcluirLancamento,
  actionCriarLancamento,
  actionAtualizarLancamento,
  actionConfirmarLancamento,
  actionCancelarLancamento,
  actionBuscarLancamento,
  actionEstornarLancamento,
} from './lancamentos';

// ============================================================================
// Conciliação - Server Actions
// ============================================================================
export {
  actionImportarExtrato,
  actionConciliarManual,
  actionObterSugestoes,
  actionBuscarLancamentosManuais,
  actionConciliarAutomaticamente,
  actionListarTransacoes,
  actionDesconciliar,
  actionBuscarTransacao,
} from './conciliacao';

// ============================================================================
// Obrigações - Server Actions
// ============================================================================
export {
  actionSincronizarParcela,
  actionRegistrarDeclaracao,
  actionGerarRepasse,
  actionSincronizarAcordo,
  actionVerificarConsistencia,
  actionObterResumoObrigacoes,
  actionObterAlertasFinanceiros,
  actionListarObrigacoes,
} from './obrigacoes';

// ============================================================================
// Plano de Contas - Server Actions
// ============================================================================
export {
  actionListarPlanoContas,
  actionCriarConta,
  actionAtualizarConta,
  actionExcluirConta,
} from './plano-contas';

// ============================================================================
// DRE - Server Actions
// ============================================================================
export {
  actionGerarDRE,
  actionObterEvolucaoDRE,
  actionExportarDRECSV,
  actionExportarDREPDF,
} from './dre';

// ============================================================================
// Orçamentos - Server Actions
// ============================================================================
export {
  actionListarOrcamentos,
  actionBuscarOrcamento,
  actionCriarOrcamento,
  actionAtualizarOrcamento,
  actionExcluirOrcamento,
  actionExcluirItemOrcamento,
  actionCriarItemOrcamento,
  actionAtualizarItemOrcamento,
  actionAprovarOrcamento,
  actionIniciarExecucaoOrcamento,
  actionEncerrarOrcamento,
  actionObterAnaliseOrcamentaria,
  actionObterProjecaoOrcamentaria,
} from './orcamentos';

export type { AnaliseOrcamentariaUI } from './orcamentos';

// ============================================================================
// Dashboard - Server Actions
// ============================================================================
export {
  actionObterDashboardFinanceiro,
  actionObterFluxoCaixaProjetado,
  actionObterResumoContas,
  actionObterIndicadoresFinanceiros,
  actionObterEvolucaoMensal,
  actionObterTopCategorias,
} from './dashboard';

// ============================================================================
// Fluxo de Caixa - Server Actions
// ============================================================================
export {
  actionObterFluxoCaixaUnificado,
  actionObterFluxoCaixaDiario,
  actionObterFluxoCaixaPorPeriodo,
  actionObterIndicadoresSaude,
  actionObterAlertasCaixa,
  actionObterResumoDashboard,
  actionObterSaldoInicial,
  actionListarContasBancarias,
  actionListarCentrosCusto,
} from './fluxo-caixa';

// ============================================================================
// Relatórios - Server Actions
// ============================================================================
export {
  actionExportarLancamentosCSV,
  actionExportarContasPagarCSV,
  actionExportarContasReceberCSV,
  actionExportarFluxoCaixaCSV,
  actionExportarPlanoContasCSV,
  actionExportarConciliacaoCSV,
  actionExportarInadimplenciaCSV,
} from './relatorios';

// ============================================================================
// Auxiliares - Server Actions
// ============================================================================
export {
  actionListarContasBancariasAtivas,
  actionListarCentrosCustoAtivos,
} from './auxiliares';

// ============================================================================
// Storage - Server Actions
// ============================================================================
export { actionUploadComprovante } from './storage-actions';
