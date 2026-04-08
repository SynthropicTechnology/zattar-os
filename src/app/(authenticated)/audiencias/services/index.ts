/**
 * Barrel export para serviços especializados da feature Audiências
 *
 * Serviços complementares ao service.ts principal:
 * - AI Agent: Busca formatada para consumo pelo Agente IA WhatsApp
 * - Responsável: Atribuição de responsável a audiências
 * - Virtual: Atualização de URL de audiência virtual
 */

// =============================================================================
// AI AGENT - Busca formatada para Agente IA
// =============================================================================
export { buscarAudienciasClientePorCpf } from './ai-agent.service';

// =============================================================================
// RESPONSÁVEL - Atribuição de responsável
// =============================================================================
export {
  atribuirResponsavelAudiencia,
  type AtribuirResponsavelAudienciaParams,
  type AtribuirResponsavelAudienciaResult,
} from './responsavel.service';

// =============================================================================
// VIRTUAL - URL de audiência virtual
// =============================================================================
export {
  atualizarUrlVirtualAudiencia,
  type AtualizarUrlVirtualParams,
} from './virtual.service';
