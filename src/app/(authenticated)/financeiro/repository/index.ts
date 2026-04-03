/**
 * Barrel export para Repository Layer do módulo financeiro
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado:
 * import { LancamentosRepository } from '@/app/(authenticated)/financeiro/repository/lancamentos';
 */

// ============================================================================
// Repositories - Acesso a Dados
// ============================================================================
export { LancamentosRepository } from './lancamentos';
export { ConciliacaoRepository } from './conciliacao';
export { ObrigacoesRepository } from './obrigacoes';
export { PlanoContasRepository } from './plano-contas';
export { FluxoCaixaRepository } from './fluxo-caixa';
export { OrcamentosRepository } from './orcamentos';
export { DRERepository } from './dre';
