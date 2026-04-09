/**
 * DASHBOARD FEATURE - Repositories Index
 *
 * Barrel exports para todos os repositories do módulo de dashboard.
 */

// Processos Metrics
export {
  buscarProcessosResumo,
  buscarProcessosDetalhados,
  buscarTotalProcessos,
} from './processos-metrics';

// Audiências Metrics
export {
  buscarAudienciasResumo,
  buscarAudienciasDetalhadas,
  buscarProximasAudiencias,
  buscarAudienciasMes,
} from './audiencias-metrics';

// Expedientes Metrics
export {
  buscarExpedientesResumo,
  buscarExpedientesDetalhados,
  buscarExpedientesUrgentes,
  buscarTotalExpedientesPendentes,
} from './expedientes-metrics';

// Produtividade Metrics
export { buscarProdutividadeUsuario } from './produtividade-metrics';

// Admin Metrics
export {
  buscarMetricasEscritorio,
  buscarCargaUsuarios,
  buscarStatusCapturas,
  buscarPerformanceAdvogados,
  buscarUsuario,
} from './admin-metrics';

// Financeiro Metrics
export {
  buscarDadosFinanceirosConsolidados,
  buscarFinanceiroDetalhado,
} from './financeiro-metrics';

// Contratos Metrics
export { buscarContratosResumo } from './contratos-metrics';

// Chat Metrics
export { buscarChatResumo } from './chat-metrics';

// Documentos Recentes
export { buscarDocumentosRecentes } from './documentos-recentes';

// Shared Formatters
export { formatarMoeda } from './shared/formatters';

// Lembretes
export {
  buscarLembretes,
  buscarLembretePorId,
  criarLembrete,
  atualizarLembrete,
  marcarLembreteConcluido,
  deletarLembrete,
  contarLembretesPendentes,
  buscarLembretesVencidos,
} from './lembretes-repository';

// Progresso Diário
export {
  buscarProgressoDiario,
  type ProgressoDiario,
} from './progresso-diario';
