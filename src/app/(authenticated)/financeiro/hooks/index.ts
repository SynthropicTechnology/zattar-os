/**
 * Barrel export para hooks financeiros
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { useContasPagar } from '@/app/(authenticated)/financeiro/hooks/use-contas-pagar';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { useContasPagar, useContasReceber } from '@/app/(authenticated)/financeiro/hooks';
 */

// ============================================================================
// Hooks de Lançamentos
// ============================================================================
export {
  useContasPagar,
  cancelarConta,
  excluirConta,
  useContaPagar,
} from './use-contas-pagar';

export {
  useContasReceber,
  cancelarContaReceber,
  excluirContaReceber,
  useContaReceber,
} from './use-contas-receber';

export { useContasBancarias } from './use-contas-bancarias';

export { useCentrosCustoAtivos, useCentrosCusto } from './use-centros-custo';

// ============================================================================
// Hooks de Conciliação
// ============================================================================
export {
  useTransacoesImportadas,
  useTransacaoDetalhes,
  useSugestoesConciliacao,
  conciliarManual,
  conciliarAutomaticamente,
  desconciliar,
} from './use-conciliacao';

// ============================================================================
// Hooks de Obrigações
// ============================================================================
export {
  useObrigacoes,
  useResumoObrigacoes,
  sincronizarAcordo,
  sincronizarParcela,
} from './use-obrigacoes';

// ============================================================================
// Hooks de Plano de Contas
// ============================================================================
export {
  usePlanoContas,
  usePlanoContasAnaliticas,
  usePlanoContasHierarquiaAchatada,
  gerarLabelParaSeletor,
} from './use-plano-contas';

export type {
  PlanoContasPaginacao,
  PlanoContaHierarquico,
  PlanoContaComIndentacao,
} from './use-plano-contas';

// ============================================================================
// Hooks de DRE
// ============================================================================
export {
  useDRE,
  useEvolucaoDRE,
  useExportarDRE,
  gerarPeriodoAtual,
  gerarPeriodoAnterior,
} from './use-dre';

// ============================================================================
// Hooks de Orçamentos
// ============================================================================
export {
  useOrcamentos,
  useOrcamento,
  useAnaliseOrcamentaria,
  useProjecaoOrcamentaria,
  aprovarOrcamento,
  iniciarExecucaoOrcamento,
  encerrarOrcamento,
  excluirOrcamento,
  excluirItemOrcamento,
  criarItemOrcamento,
  atualizarItemOrcamento,
} from './use-orcamentos';

// ============================================================================
// Hooks de Fluxo de Caixa
// ============================================================================
export { useFluxoCaixa } from './use-fluxo-caixa';

// ============================================================================
// Hooks Utilitários
// ============================================================================
export { useFiltrosFinanceiros } from './use-filtros-financeiros';
