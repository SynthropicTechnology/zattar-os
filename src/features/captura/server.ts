/**
 * Server-only entrypoint for the `captura` feature.
 *
 * Import this file from Server Components, Route Handlers, cron/scheduler services, etc.
 * It must never be imported from Client Components.
 */

import 'server-only';

// Service (orquestrador)
export { executarCaptura, type ExecutarCapturaParams } from './service';

// Repository (acesso a dados)
export { buscarCredencial, buscarConfigTribunal, salvarLogCaptura } from './repository';

// Credential Service (acesso a credenciais no banco)
export { getCredentialByTribunalAndGrau } from './credentials/credential.service';

// Drivers
export { getDriver } from './drivers/factory';
export type { JudicialDriver, SessaoAutenticada } from './drivers/judicial-driver.interface';

// PJE-TRT API (exportações principais)
export { obterPartesProcesso, obterRepresentantesPartePorID } from './pje-trt/partes';
export { obterTimeline } from './pje-trt/timeline';
export { fetchPJEAPI } from './pje-trt/shared/fetch';
export type { TimelineResponse, ObterTimelineOptions } from './pje-trt/timeline';

// TRT Services (autenticação e configuração) — imports Playwright (server-only)
export { autenticarPJE, type AuthResult } from './services/trt/trt-auth.service';
export { getTribunalConfig } from './services/trt/config';

// Timeline Service
export {
  capturarTimeline,
  type CapturaTimelineParams,
  type CapturaTimelineResult,
} from './services/timeline/timeline-capture.service';

// Partes Service
export { capturarPartesProcesso, type ProcessoParaCaptura } from './services/partes/partes-capture.service';

// Log Persistence Service (Supabase service key)
export { buscarCapturaLog } from './services/persistence/captura-log-persistence.service';

// Raw Log Persistence Service (logs brutos por tribunal/grau)
export { buscarLogsBrutoPorCapturaId, contarLogsBrutoPorStatus } from './services/persistence/captura-raw-log.service';

// Comunica CNJ (server-only)
export * from './comunica-cnj/domain';
export * from './comunica-cnj/cnj-client';
export * from './comunica-cnj/repository';
export * from './comunica-cnj/service';

// Actions (server actions)
export * from './actions/comunica-cnj-actions';
export * from './actions/timeline-actions';


