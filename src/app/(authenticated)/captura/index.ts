// Domain (tipos e interfaces)
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
} from "./domain";

export {
  mapearTipoAcessoParaGrau,
  mapearTipoCapturaParaOrigem,
} from "./domain";

// Types (tipos específicos de API/UI)
export type {
  CapturaLog,
  StatusCaptura,
  CredencialDisponivel,
  AcervoGeralResult,
  ArquivadosResult,
  AudienciasResult,
  PendentesResult,
  CapturaPartesResult,
  TimelineResult,
} from "./domain";

// Capturas Log Types
export type { ResultadoCapturaPartes } from "./types/capturas-log-types";

// Captura Raw Logs (tabela captura_logs_brutos)
export type {
  CapturaRawLog,
  CapturaRawLogCreate,
  StatusCapturaRaw,
} from "./types/captura-raw-log";

// PJE Documento Types
export type {
  DocumentoMetadata,
  DocumentoConteudo,
  FetchDocumentoParams,
  FetchDocumentoResult,
  ArquivoInfo,
} from "./types/documento-types";

// TRT Types (exportados de types.ts que re-exporta de trt-types.ts)
export type { CodigoTRT, GrauTRT, FiltroPrazoPendentes } from "./domain";

// Additional TRT Types from types.ts (for lib/api usage)
export { AgrupamentoProcessoTarefa } from "./types/types";
export type {
  Processo,
  Audiencia,
  Totalizador,
  PagedResponse,
} from "./types/types";

// TRT Types diretos (incluindo ConfigTRT que não está em types.ts)
export type {
  TipoRotaTRT,
  TipoAcessoTribunal,
  BaseCapturaTRTParams,
  CredenciaisTRT,
  CustomTimeouts,
  TribunalConfigDb,
  ConfigTRT,
} from "./types/trt-types";

// Constants
export {
  TRT_CODIGOS,
  GRAUS,
  FILTROS_PRAZO,
  STATUS_AUDIENCIA_OPTIONS,
} from "./constants";

// API Client (para uso em componentes)
export * from "./services/api-client";

// Hooks
export { useCapturasLog } from "./hooks/use-capturas-log";
export { useTribunais } from "./hooks/use-tribunais";

// Agendamentos Types
export type {
  Agendamento,
  CriarAgendamentoParams,
  AtualizarAgendamentoParams,
  ListarAgendamentosParams,
} from "./types/agendamentos-types";

// Components (re-export principais)
export { CapturaList } from "./components/captura-list";
export { CapturaDialog } from "./components/captura-dialog";
export {
  CapturaResult,
  type CapturaResultData,
} from "./components/captura-result";

// Server Actions (safe to import in client components)
// NOTE: Server actions with 'use server' ARE safe to export from client-accessible barrels
// because Next.js handles the serialization at build time.
export { actionCapturarTimeline } from "./actions/timeline-actions";
export type { ActionResponse } from "./actions/timeline-actions";

// Comunica CNJ Components (client-safe)
export {
  ComunicaCNJConsulta,
  ComunicaCNJCapturadas,
  ComunicaCNJResultsTable,
  ComunicaCNJSearchForm,
  ComunicaCNJTabsContent,
} from "./components/comunica-cnj";

// Utils
export { ordenarCredenciaisPorTRT } from "./utils/ordenar-credenciais";
export {
  formatarErroCaptura,
  formatarErroTecnico,
  isAuthTimeoutError,
  isNetworkError,
} from "./utils/error-formatter";

// Components (additional exports)
export {
  CapturaFormBase,
  validarCamposCaptura,
} from "./components/captura-form-base";
export { TipoCapturaSelect } from "./components/tipo-captura-select";
export { CapturaErrosFormatados } from "./components/captura-erros-formatados";
export { CapturaRawLogs } from "./components/captura-raw-logs";
export { AdvogadoCombobox } from "./components/advogado-combobox";
export { CredenciaisCombobox } from "./components/credenciais-combobox";

// Comunica CNJ & heavy server-only code
// NOTE: `comunica-cnj/*` and internal services depend on Node APIs / Playwright.
// Import them from `@/app/(authenticated)/captura/server` (server-side only).
