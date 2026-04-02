/**
 * CHAT FEATURE - Public API
 *
 * Re-exporta todos os módulos públicos da feature chat.
 * Este é o ponto de entrada principal para importar funcionalidades de chat.
 *
 * @example
 * ```tsx
 * import {
 *   ChatLayout,
 *   ChatWindow,
 *   ChatSidebarWrapper,
 *   useChatSubscription,
 *   actionEnviarMensagem,
 *   SalaChat,
 *   TipoSalaChat
 * } from '@/app/app/chat';
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================
export type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  UsuarioChat,
  ChatItem, // Added
  TypingUser,
  CriarSalaChatInput,
  CriarMensagemChatInput,
  ListarSalasParams,
  ListarMensagensParams,
  PaginationInfo,
  PaginatedResponse,
  ActionResult,
  // Database row types
  SalaChatRow,
  MensagemChatRow,
  UsuarioChatRow,
  DyteMeeting,
  ChatMessageData,
  // Call Feature Types
  Chamada,
  ChamadaParticipante,
  ChamadaComParticipantes,
  TipoChamada,
  StatusChamada,
} from "./domain";

export {
  TipoSalaChat,
  TipoMensagemChat,
  criarSalaChatSchema,
  criarMensagemChatSchema,
  // Call Feature Schemas
  criarChamadaSchema,
  responderChamadaSchema,
} from "./domain";

// =============================================================================
// REPOSITORY
// =============================================================================
// NOTA: ChatRepository e createChatRepository NÃO são exportados aqui
// porque usam código do servidor (next/headers). Use import dinâmico
// em Server Components/Actions: await import('@/app/app/chat/repository')

// =============================================================================
// SERVICE
// =============================================================================
// NOTA: ChatService e createChatService NÃO são exportados aqui
// porque usam código do servidor (next/headers). Use import direto
// em Server Components/Actions: import { createChatService } from '@/app/app/chat/service'

// =============================================================================
// ACTIONS (Server Actions)
// =============================================================================
export {
  actionCriarSala,
  actionCriarGrupo,
  actionListarSalas,
  actionDeletarSala,
  actionArquivarSala,
  actionDesarquivarSala,
  actionAtualizarNomeSala,
  actionEnviarMensagem,
  actionBuscarHistorico,
} from "./actions/chat-actions";
export * from "./actions/chamadas-actions";

// =============================================================================
// HOOKS
// =============================================================================
export { useChatSubscription } from "./hooks/use-chat-subscription";
export { useTypingIndicator } from "./hooks/use-typing-indicator";

// =============================================================================
// COMPONENTS
// =============================================================================
export {
  ChatLayout,
  ChatWindow,
  ChatSidebarWrapper,
  ChatSidebar,
  CallHistoryList,
  CallWindowContent,
  MeetingSkeleton,
} from "./components";
