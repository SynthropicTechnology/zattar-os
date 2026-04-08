/**
 * Barrel export — Services do módulo captura
 *
 * ⚠️ EXCEÇÃO FSD JUSTIFICADA:
 * O módulo captura mantém `services/` como pasta (em vez de `service.ts`)
 * devido à complexidade: 12+ subserviços organizados por domínio.
 *
 * Para imports server-only (Playwright, Node APIs), use:
 * import { ... } from '@/app/(authenticated)/captura/server';
 *
 * Para imports client-safe (API client), use:
 * import { ... } from '@/app/(authenticated)/captura/services/api-client';
 */

// ============================================================================
// API Client (client-safe — fetch-based)
// ============================================================================
export {
    listarCredenciais,
    capturarAcervoGeral,
    capturarArquivados,
    capturarAudiencias,
    capturarPericias,
    capturarPendentes,
    capturarPartes,
    capturarTimeline,
    capturarCombinada,
    deletarCapturaLog,
    buscarCapturaLog,
    listarRecoveryLogs,
    buscarRecoveryAnalise,
    reprocessarRecovery,
} from './api-client';

// ============================================================================
// Captura Log Service (server-only)
// ============================================================================
export {
    iniciarCapturaLog,
    finalizarCapturaLogSucesso,
    finalizarCapturaLogErro,
    atualizarStatusCapturaLog,
    atualizarCapturaLog,
} from './captura-log.service';

// ============================================================================
// Capture Orchestrator (server-only)
// ============================================================================
export {
    executarCaptura,
} from './capture-orchestrator';

export type { ExecutarCapturaParams } from './capture-orchestrator';

// ============================================================================
// Advogado Helper (server-only)
// ============================================================================
export { buscarOuCriarAdvogadoPorCpf } from './advogado-helper.service';
