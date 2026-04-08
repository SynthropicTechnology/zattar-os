/**
 * Captura Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de captura judicial.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { CapturaList } from '@/app/(authenticated)/captura/components/captura-list';
 * import { useCapturasLog } from '@/app/(authenticated)/captura/hooks/use-capturas-log';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { CapturaList, useCapturasLog } from '@/app/(authenticated)/captura';
 *
 * ⚠️ SERVER-ONLY:
 * Para código server-only (Playwright, Node APIs, drivers), importe de:
 * import { ... } from '@/app/(authenticated)/captura/server';
 */

// ============================================================================
// Components
// ============================================================================
export { CapturaList } from './components/captura-list';
export { CapturaDialog } from './components/captura-dialog';
export {
  CapturaResult,
  type CapturaResultData,
} from './components/captura-result';
export {
  CapturaFormBase,
  validarCamposCaptura,
} from './components/captura-form-base';
export { TipoCapturaSelect } from './components/tipo-captura-select';
export { CapturaErrosFormatados } from './components/captura-erros-formatados';
export { CapturaRawLogs } from './components/captura-raw-logs';
export { AdvogadoCombobox } from './components/advogado-combobox';
export { CredenciaisCombobox } from './components/credenciais-combobox';

// Comunica CNJ Components (client-safe)
export {
  ComunicaCNJConsulta,
  ComunicaCNJCapturadas,
  ComunicaCNJResultsTable,
  ComunicaCNJSearchForm,
  ComunicaCNJTabsContent,
} from './components/comunica-cnj';

// ============================================================================
// Hooks
// ============================================================================
export { useCapturasLog } from './hooks/use-capturas-log';
export { useTribunais } from './hooks/use-tribunais';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
// NOTE: Server actions with 'use server' ARE safe to export from client-accessible barrels
// because Next.js handles the serialization at build time.
export {
  actionCapturarTimeline,
  actionRelinkBackblaze,
} from './actions';

export type { ActionResponse } from './actions';

// ============================================================================
// Types / Domain
// ============================================================================

// --- Core domain types ---
export type {
  Credencial,
  ConfigTribunal,
  ProcessoCapturado,
  MovimentacaoCapturada,
  ResultadoCaptura,
  TipoCaptura,
  PeriodoAudiencias,
  BuscarProcessosParams,
  SistemaJudicialSuportado,
  CapturaLog,
  StatusCaptura,
  CredencialDisponivel,
  AcervoGeralResult,
  ArquivadosResult,
  AudienciasResult,
  PendentesResult,
  CapturaPartesResult,
  TimelineResult,
  CodigoTRT,
  GrauTRT,
  FiltroPrazoPendentes,
} from './domain';

export {
  mapearTipoAcessoParaGrau,
  mapearTipoCapturaParaOrigem,
} from './domain';

// --- Types (API/UI específicos) ---
export type { ResultadoCapturaPartes } from './types/capturas-log-types';

export type {
  CapturaRawLog,
  CapturaRawLogCreate,
  StatusCapturaRaw,
} from './types/captura-raw-log';

export type {
  DocumentoMetadata,
  DocumentoConteudo,
  FetchDocumentoParams,
  FetchDocumentoResult,
  ArquivoInfo,
} from './types/documento-types';

export { AgrupamentoProcessoTarefa } from './types/types';
export type {
  Processo,
  Audiencia,
  Totalizador,
  PagedResponse,
} from './types/types';

export type {
  TipoRotaTRT,
  TipoAcessoTribunal,
  BaseCapturaTRTParams,
  CredenciaisTRT,
  CustomTimeouts,
  TribunalConfigDb,
  ConfigTRT,
} from './types/trt-types';

export type {
  Agendamento,
  CriarAgendamentoParams,
  AtualizarAgendamentoParams,
  ListarAgendamentosParams,
} from './types/agendamentos-types';

// ============================================================================
// Constants
// ============================================================================
export {
  TRT_CODIGOS,
  GRAUS,
  FILTROS_PRAZO,
  STATUS_AUDIENCIA_OPTIONS,
} from './constants';

// ============================================================================
// Services (client-safe API client)
// ============================================================================
export * from './services/api-client';

// ============================================================================
// Utils
// ============================================================================
export { ordenarCredenciaisPorTRT } from './utils/ordenar-credenciais';
export {
  formatarErroCaptura,
  formatarErroTecnico,
  isAuthTimeoutError,
  isNetworkError,
} from './utils/error-formatter';

// ============================================================================
// Server-only exports
// ============================================================================
// Services, Drivers e Comunica CNJ server-only devem ser importados via:
//   import { ... } from '@/app/(authenticated)/captura/server';
// NÃO re-exportar aqui para evitar vazamento de server-only no bundle client.
