/**
 * Barrel export para Service Layer do módulo financeiro
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado:
 * import { LancamentosService } from '@/app/(authenticated)/financeiro/services/lancamentos';
 */

// ============================================================================
// Lancamentos Service
// ============================================================================
export { LancamentosService } from './lancamentos';

// ============================================================================
// Conciliação Service
// ============================================================================
export { ConciliacaoService, conciliacaoService } from './conciliacao';

// ============================================================================
// Obrigações Services
// ============================================================================
export { ObrigacoesService } from './obrigacoes';

export type {
  SincronizacaoParcelaResult,
  SincronizacaoAcordoResult,
  ConsistenciaResult,
} from './obrigacoes-integracao';

export {
  sincronizarParcelaParaFinanceiro,
  sincronizarAcordoCompleto,
  verificarConsistencia,
  reverterSincronizacao,
} from './obrigacoes-integracao';

export type {
  SeveridadeValidacao,
  TipoValidacao,
  ItemValidacao,
  ResultadoValidacao,
} from './obrigacoes-validacao';

export {
  validarSincronizacaoParcela,
  validarSincronizacaoAcordo,
  formatarResultadoValidacao,
} from './obrigacoes-validacao';

// ============================================================================
// Dashboard Service
// ============================================================================
export type {
  DashboardFinanceiroData,
  FluxoCaixaProjetadoItem,
} from './dashboard';

export {
  getDashboardFinanceiro,
  getFluxoCaixaProjetadoDashboard,
} from './dashboard';

// ============================================================================
// Plano de Contas Service
// ============================================================================
export { PlanoContasService } from './plano-contas';

// ============================================================================
// Fluxo de Caixa Service
// ============================================================================
export { FluxoCaixaService } from './fluxo-caixa';

// ============================================================================
// DRE Service
// ============================================================================
export {
  DREService,
  calcularDRE,
  calcularComparativoDRE,
  calcularEvolucaoAnual,
} from './dre';

// ============================================================================
// Orçamentos Service
// ============================================================================
export {
  OrcamentosService,
  listarOrcamentos,
  buscarOrcamentoComDetalhes,
  criarOrcamento,
  atualizarOrcamento,
  deletarOrcamento,
  excluirItemOrcamento,
  aprovarOrcamento,
  iniciarExecucaoOrcamento,
  encerrarOrcamento,
  buscarAnaliseOrcamentaria,
  mapAnaliseToUI,
} from './orcamentos';

// ============================================================================
// Recorrência Service
// ============================================================================
export { RecorrenciaService } from './recorrencia';
