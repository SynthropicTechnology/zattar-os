/**
 * Barrel export para Server Actions da feature Audiências
 *
 * Organiza todas as actions de:
 * - Audiências (CRUD, status, observações, URL, endereço)
 * - Tipos e Salas (dados de referência)
 * - Buscas por CPF/CNPJ/Processo (MCP Tools)
 */

// =============================================================================
// AUDIÊNCIAS - CRUD & Operações
// =============================================================================
export {
  type ActionResult,
  actionCriarAudiencia,
  actionAtualizarAudiencia,
  actionAtualizarStatusAudiencia,
  actionAtualizarObservacoes,
  actionAtualizarUrlVirtual,
  actionAtualizarEnderecoPresencial,
  actionListarAudiencias,
  actionBuscarAudienciaPorId,
  actionCriarAudienciaPayload,
  actionAtualizarAudienciaPayload,
} from './audiencias-actions';

// =============================================================================
// TIPOS & SALAS - Dados de Referência
// =============================================================================
export {
  actionListarTiposAudiencia,
  actionListarSalasAudiencia,
} from './tipos-salas-actions';

// =============================================================================
// BUSCAS - CPF/CNPJ/Processo (MCP Tools)
// =============================================================================
export {
  actionBuscarAudienciasPorCPF,
  actionBuscarAudienciasPorCNPJ,
  actionBuscarAudienciasPorNumeroProcesso,
} from './busca-actions';
