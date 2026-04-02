/**
 * Chatwoot API Client
 *
 * Módulo de integração com a API do Chatwoot para gerenciamento
 * de contatos e sincronização com o módulo de partes.
 *
 * @example
 * ```typescript
 * import { listContacts, createContact, getChatwootClient } from '@/lib/chatwoot';
 *
 * // Listar contatos
 * const result = await listContacts({ page: 1 });
 * if (result.success) {
 *   console.log(result.data.payload);
 * }
 *
 * // Criar contato
 * const contact = await createContact({
 *   inbox_id: 1,
 *   name: 'João Silva',
 *   email: 'joao@email.com',
 *   identifier: '12345678901', // CPF
 * });
 * ```
 */

// Client
export {
  ChatwootClient,
  getChatwootClient,
  isChatwootConfigured,
  resetChatwootClient,
} from './client';

// Configuration (Database-driven via integracoes table)
export {
  getChatwootConfigFromDatabase,
  isChatwootConfiguredInDatabase,
} from './config';

// Contacts
export {
  listContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  searchContacts,
  mergeContacts,
  findContactByIdentifier,
  findContactByEmail,
  findContactByPhone,
  listAllContacts,
} from './contacts';

// Contact Labels
export {
  listContactLabels,
  updateContactLabels,
  addContactLabels,
  removeContactLabels,
  hasContactLabel,
  getLabelsForTipoEntidade,
  applyParteLabels,
  CHATWOOT_LABELS,
} from './contact-labels';

// Conversations
export {
  getConversationCounts,
  listConversations,
  getConversation,
  createConversation,
  filterConversations,
  getContactConversations,
  listAllConversations,
  getOpenConversations,
  formatPhoneForSourceId,
} from './conversations';

// Messages
export {
  getMessages,
  getConversationHistory,
  getRecentMessages,
  getTextMessages,
  formatConversationForAI,
  countMessagesByType,
} from './messages';

// Types
export type {
  // Config
  ChatwootConfig,

  // Contact types
  ChatwootContact,
  ChatwootContactAdditionalAttributes,
  ChatwootContactCustomAttributes,
  ChatwootContactInbox,
  ChatwootInbox,
  ChatwootAvailabilityStatus,
  ChatwootContactSortField,

  // Request types
  CreateContactRequest,
  UpdateContactRequest,
  ListContactsParams,
  SearchContactsParams,
  MergeContactsRequest,
  UpdateContactLabelsRequest,

  // Response types
  ListContactsResponse,
  CreateContactResponse,
  GetContactResponse,
  UpdateContactResponse,
  DeleteContactResponse,
  ContactLabelsResponse,
  MergeContactsResponse,
  ChatwootPaginationMeta,

  // Error types
  ChatwootApiError,
  ChatwootResult,

  // Mapping types
  TipoEntidadeChatwoot,
  PartesChatwoot,
  CreatePartesChatwootInput,
  UpdatePartesChatwootInput,

  // Conversation types
  ChatwootConversationStatus,
  ChatwootAssigneeType,
  ChatwootMessageType,
  ChatwootSenderType,
  ChatwootMessageStatus,
  ChatwootContentType,
  ChatwootAgent,
  ChatwootMessageAttachment,
  ChatwootMessage,
  ChatwootConversationMeta,
  ChatwootConversation,
  ChatwootConversationCounts,
  ListConversationsParams,
  GetConversationCountsParams,
  CreateConversationRequest,
  ConversationFilterOperator,
  FilterConversationsRequest,
  ConversationCountsResponse,
  ListConversationsResponse,
  CreateConversationResponse,
  GetMessagesResponse,
} from './types';

export { ChatwootError } from './types';

// Domain (additional exports not in types.ts)
export {
  // Types - Conversas
  type ConversaChatwoot,
  type CreateConversaChatwootInput,
  type UpdateConversaChatwootInput,
  type ListarConversasParams,
  type StatusConversa,

  // Types - Usuários
  type UsuarioChatwoot,
  type CreateUsuarioChatwootInput,
  type UpdateUsuarioChatwootInput,
  type ListarUsuariosParams,
  type RoleUsuario,

  // Schemas
  tipoEntidadeChatwootSchema,
  createPartesChatwootSchema,
  updatePartesChatwootSchema,
  listarMapeamentosSchema,
  statusConversaSchema,
  roleUsuarioSchema,

  // Utils
  formatarTelefoneInternacional,
  normalizarDocumentoParaIdentifier,
  obterPrimeiroEmail,
  dadosModificados,
} from './domain';

// Repository
export {
  // Partes Chatwoot
  findMapeamentoById,
  findMapeamentoPorEntidade,
  findMapeamentoPorChatwootId,
  listarMapeamentos,
  criarMapeamento,
  atualizarMapeamento,
  atualizarMapeamentoPorEntidade,
  removerMapeamento,
  removerMapeamentoPorEntidade,
  removerMapeamentoPorChatwootId,
  contarMapeamentos,
  upsertMapeamentoPorEntidade,

  // Conversas Chatwoot
  findConversaById,
  findConversaPorChatwootId,
  listarConversas,
  criarConversa,
  atualizarConversa,
  removerConversa,

  // Usuários Chatwoot
  findUsuarioById,
  findUsuarioPorUUID,
  findUsuarioPorChatwootId,
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  atualizarUsuarioPorUUID,
  listarAgentesDisponíveis,
  removerUsuario,
} from './repository';

// Service
export {
  // Partes sync (existing)
  parteParaChatwootContact,
  parteParaChatwootUpdate,
  sincronizarParteComChatwoot,
  vincularParteAContato,
  desvincularParte,
  excluirContatoEMapeamento,
  buscarContatoVinculado,
  parteEstaVinculada,
  // Phone-based sync (Chatwoot -> App)
  extrairTelefone,
  buscarPartePorTelefone,
  sincronizarChatwootParaApp,
  type ParteEncontrada,
  type SincronizarChatwootParaAppResult,
  // Conversations
  buscarConversasDaParte,
  buscarHistoricoConversa,
  buscarHistoricoConversaFormatado,
  buscarMetricasConversas,
  // Conversas table sync (NEW)
  sincronizarConversaChatwoot,
  atribuirConversaInteligente,
  atualizarStatusConversa,
  // Usuários table sync (NEW)
  sincronizarAgenteChatwoot,
  atualizarDisponibilidadeAgente,
  // Webhook handling (NEW)
  processarWebhookConversa,
  processarWebhookAgente,
  processarWebhook,
  // Types (NEW)
  type SincronizarConversaParams,
  type AtribuirConversaInteligentParams,
  type SincronizarAgenteParams,
  type WebhookEventType,
  type WebhookPayload,
} from './service';

// Sync Hooks (wrapper functions com auto-sync)
export {
  saveClienteComSync,
  updateClienteComSync,
  sincronizarClienteManual,
} from './sync-hooks';

// Actions (server actions para batch sync)
export {
  // Generic actions (for all tipos de partes)
  sincronizarTodasPartes,
  sincronizarParte,
  type SincronizarPartesParams,
  type SincronizarPartesResult,
  // Two-phase sync (Chatwoot <-> App)
  sincronizarCompletoComChatwoot,
  type SincronizarCompletoParams,
  type SincronizarCompletoResult,
  // Webhook & API endpoints (NEW)
  processarWebhookChatwoot,
  sincronizarConversaManual,
  atualizarStatusConversaAPI,
  // Legacy actions (for clientes only - retrocompatibilidade)
  sincronizarTodosClientes,
  sincronizarCliente,
  sincronizarClientesPorIds,
  type SincronizarClientesParams,
  type SincronizarClientesResult,
} from './actions';

// Components
export { ChatwootSyncButton } from './components';

// Hooks (React hooks para UI)
export {
  useChatwootConversations,
  type UseChatwootConversationsOptions,
  type UseChatwootConversationsState,
  useChatwootAgents,
  useChatwootAgentAvailability,
  type UseChatwootAgentsOptions,
  type UseChatwootAgentsState,
  useChatwootRealtime,
  useChatwootConversationChanges,
  useChatwootUserChanges,
  type RealtimeEventType,
  type RealtimeEvent,
  type UseChatwootRealtimeOptions,
  type UseChatwootRealtimeState,
} from './hooks';
