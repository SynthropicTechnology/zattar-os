/**
 * CHAT FEATURE - Types & Validation Schemas
 *
 * Define todos os tipos, interfaces e schemas Zod do módulo de chat.
 * Segue convenções de naming em camelCase para propriedades e PascalCase para tipos.
 */

import { z } from "zod";

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Tipos de sala de chat disponíveis no sistema
 */
export enum TipoSalaChat {
  /** Sala pública compartilhada por todos os usuários */
  Geral = "geral",
  /** Sala vinculada a um documento específico */
  Documento = "documento",
  /** Conversa privada 1-para-1 entre dois usuários */
  Privado = "privado",
  /** Sala de grupo criada manualmente */
  Grupo = "grupo",
}

/**
 * Tipos de mensagem que podem ser enviadas
 */
export enum TipoMensagemChat {
  /** Mensagem de texto simples */
  Texto = "texto",
  /** Mensagem com arquivos anexados */
  Arquivo = "arquivo",
  /** Mensagem com imagem */
  Imagem = "imagem",
  /** Mensagem com vídeo */
  Video = "video",
  /** Mensagem de áudio */
  Audio = "audio",
  /** Notificação do sistema */
  Sistema = "sistema",
}

export type MessageStatus = "sending" | "sent" | "forwarded" | "read" | "failed";

// =============================================================================
// INTERFACES - Domain Entities
// =============================================================================

/**
 * Dados extras para mensagens com mídia
 */
export interface ChatMessageData {
  fileName?: string;
  cover?: string;
  fileUrl?: string; // URL pública
  fileKey?: string; // Chave para deletar
  mimeType?: string;
  size?: string;
  duration?: string;
  images?: string[]; // Para galerias se necessário
  uploadedAt?: string;
  uploadedBy?: number;
}

/**
 * Representa uma mensagem de chat
 */
export interface MensagemChat {
  id: number;
  salaId: number;
  usuarioId: number;
  conteudo: string;
  tipo: TipoMensagemChat;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Novos campos expandidos
  status?: MessageStatus;
  ownMessage?: boolean;
  read?: boolean;
  data?: ChatMessageData;
}

/**
 * Representa uma sala de chat no sistema
 */
export interface SalaChat {
  id: number;
  nome: string;
  tipo: TipoSalaChat;
  documentoId: number | null;
  participanteId: number | null;
  criadoPor: number;
  createdAt: string;
  updatedAt: string;
  isArchive?: boolean; // Novo campo
}

/**
 * Informações básicas do usuário para exibição no chat
 */
export interface UsuarioChat {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string | null;
  emailCorporativo: string | null;

  // Novos campos de perfil
  avatar?: string;
  about?: string;
  phone?: string;
  country?: string;
  email?: string; // Alias ou override de emailCorporativo
  gender?: string;
  website?: string;
  onlineStatus?: "online" | "away" | "offline";
  lastSeen?: string;
  socialLinks?: Array<{ icon: string; link: string }>;
  medias?: Array<{ type: string; url: string }>;
}

/**
 * Mensagem com dados do usuário anexados (para exibição)
 */
export interface MensagemComUsuario extends MensagemChat {
  usuario: UsuarioChat;
}

/**
 * Tipo unificado para lista de salas (compatível com UI nova)
 */
export interface ChatItem extends SalaChat {
  // Campos de UI/Display
  name?: string; // Alias para nome
  image?: string; // Avatar da sala/grupo
  lastMessage?: string; // Preview
  date?: string; // Data da última mensagem
  unreadCount?: number;

  // Dados do outro participante (para salas privadas)
  usuario?: UsuarioChat;
}

/**
 * Usuário que está digitando no momento
 */
export interface TypingUser {
  userId: number;
  userName: string;
  timestamp: number;
}

// =============================================================================
// ZOD SCHEMAS - Validation
// =============================================================================

/**
 * Schema para validação de criação de sala
 */
export const criarSalaChatSchema = z
  .object({
    nome: z
      .string()
      .min(1, "Nome é obrigatório")
      .max(200, "Nome deve ter no máximo 200 caracteres"),
    tipo: z.nativeEnum(TipoSalaChat),
    documentoId: z.number().optional().nullable(),
    participanteId: z.number().optional().nullable(),
  })
  .refine(
    (data) => data.tipo !== TipoSalaChat.Documento || data.documentoId !== null,
    {
      message: "documentoId é obrigatório para salas de documento",
      path: ["documentoId"],
    }
  )
  .refine(
    (data) =>
      data.tipo !== TipoSalaChat.Privado || data.participanteId !== null,
    {
      message: "participanteId é obrigatório para conversas privadas",
      path: ["participanteId"],
    }
  );

/**
 * Schema para validação de criação de mensagem
 */
export const criarMensagemChatSchema = z.object({
  salaId: z.number({ required_error: "ID da sala é obrigatório" }),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  tipo: z.nativeEnum(TipoMensagemChat).default(TipoMensagemChat.Texto),
  data: z
    .object({
      fileName: z.string().optional(),
      fileUrl: z.string().optional(),
      fileKey: z.string().optional(),
      mimeType: z.string().optional(),
      size: z.string().optional(),
      duration: z.string().optional(),
      cover: z.string().optional(),
    })
    .optional(),
});

// =============================================================================
// TYPES - Inferred & Parameters
// =============================================================================

/**
 * Tipo inferido do schema de criação de sala
 */
export type CriarSalaChatInput = z.infer<typeof criarSalaChatSchema>;

/**
 * Tipo inferido do schema de criação de mensagem
 */
export type CriarMensagemChatInput = z.infer<typeof criarMensagemChatSchema>;

/**
 * Parâmetros para listar salas do usuário
 */
export interface ListarSalasParams {
  tipo?: TipoSalaChat;
  documentoId?: number;
  limite?: number;
  offset?: number;
  arquivadas?: boolean; // Novo filtro
}

/**
 * Parâmetros para listar mensagens de uma sala
 */
export interface ListarMensagensParams {
  salaId: number;
  antesDe?: string;
  limite?: number;
}

/**
 * Informações de paginação
 */
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Resposta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// =============================================================================
// ACTION RESULT
// =============================================================================

/**
 * Resultado de uma Server Action
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | {
      success: false;
      error: string;
      errors?: Record<string, string[]>;
      message: string;
    };

// =============================================================================
// DATABASE ROW TYPES (snake_case - from Supabase)
// =============================================================================

/**
 * Row type for salas_chat table (snake_case)
 */
export interface SalaChatRow {
  id: number;
  nome: string;
  tipo: string;
  documento_id: number | null;
  participante_id: number | null;
  criado_por: number;
  created_at: string;
  updated_at: string;
  is_archive?: boolean;
  last_message?: Array<{
    conteudo: string;
    created_at: string;
    tipo: string;
    data?: unknown;
  }>;
  criador?: UsuarioChatRow;
  participante?: UsuarioChatRow;
}

/**
 * Row type for mensagens_chat table (snake_case)
 */
export interface MensagemChatRow {
  id: number;
  sala_id: number;
  usuario_id: number;
  conteudo: string;
  tipo: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status?: "sent" | "forwarded" | "read";
  data?: ChatMessageData | null;
  usuario?: UsuarioChatRow;
}

/**
 * Row type for usuarios table (snake_case) - partial for chat context
 */
export interface UsuarioChatRow {
  id: number;
  nome_completo: string;
  nome_exibicao: string | null;
  email_corporativo: string | null;
  avatar_url?: string;
  online_status?: 'online' | 'away' | 'offline';
  last_seen?: string;
}

/**
 * Dyte meeting object type
 */
export interface DyteMeeting {
  id: string;
  roomName?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// =============================================================================
// CALLS FEATURE TYPES
// =============================================================================

export enum TipoChamada {
  Audio = 'audio',
  Video = 'video',
}

export enum StatusChamada {
  Iniciada = 'iniciada',
  EmAndamento = 'em_andamento',
  Finalizada = 'finalizada',
  Cancelada = 'cancelada',
  Recusada = 'recusada',
}

/**
 * Representa uma chamada de áudio/vídeo
 */
export interface Chamada {
  id: number;
  meetingId: string;
  salaId: number;
  tipo: TipoChamada;
  iniciadoPor: number;
  status: StatusChamada;
  iniciadaEm: string;
  finalizadaEm?: string;
  duracaoSegundos?: number;
  transcricao?: string;
  resumo?: string;
  gravacaoUrl?: string;
  createdAt: string;
}

/**
 * Representa um participante de uma chamada
 */
export interface ChamadaParticipante {
  id: number;
  chamadaId: number;
  usuarioId: number;
  entrouEm?: string;
  saiuEm?: string;
  duracaoSegundos?: number;
  aceitou?: boolean;
  respondeuEm?: string;
  createdAt: string;
}

/**
 * Chamada com lista de participantes
 */
export interface ChamadaComParticipantes extends Chamada {
  participantes: ChamadaParticipante[];
  iniciador?: UsuarioChat;
}

/**
 * Row type for chamadas table (snake_case)
 */
export interface ChamadaRow {
  id: number;
  meeting_id: string;
  sala_id: number;
  tipo: string;
  iniciado_por: number;
  status: string;
  iniciada_em: string;
  finalizada_em?: string;
  duracao_segundos?: number;
  transcricao?: string;
  resumo?: string;
  gravacao_url?: string;
  created_at: string;
}

/**
 * Row type for chamadas_participantes table (snake_case)
 */
export interface ChamadaParticipanteRow {
  id: number;
  chamada_id: number;
  usuario_id: number;
  entrou_em?: string;
  saiu_em?: string;
  duracao_segundos?: number;
  aceitou?: boolean;
  respondeu_em?: string;
  created_at: string;
}

// =============================================================================
// CALLS ZOD SCHEMAS
// =============================================================================

export const criarChamadaSchema = z.object({
  salaId: z.number(),
  tipo: z.nativeEnum(TipoChamada),
  meetingId: z.string(),
});

export const atualizarStatusChamadaSchema = z.object({
  status: z.nativeEnum(StatusChamada),
});

export const responderChamadaSchema = z.object({
  chamadaId: z.number(),
  aceitou: z.boolean(),
});

// =============================================================================
// CALLS INFERRED TYPES
// =============================================================================

export type CriarChamadaInput = z.infer<typeof criarChamadaSchema>;
export type AtualizarStatusChamadaInput = z.infer<typeof atualizarStatusChamadaSchema>;
export type ResponderChamadaInput = z.infer<typeof responderChamadaSchema>;

// =============================================================================
// MEDIA DEVICES TYPES
// =============================================================================

export interface SelectedDevices {
  videoDevice?: string;
  audioInput?: string;
  audioOutput?: string;
}

export interface MediaDevicePermissions {
  camera: PermissionState;
  microphone: PermissionState;
}

// =============================================================================
// HISTORY & FILTERS
// =============================================================================

export interface ListarChamadasParams {
  tipo?: TipoChamada;
  status?: StatusChamada;
  dataInicio?: string;
  dataFim?: string;
  usuarioId?: number;
  limite?: number;
  offset?: number;
  pagina?: number; // Para compatibilidade com UI (1-based)
}

export interface DyteMeetingDetails {
  id: string;
  status: 'LIVE' | 'ENDED' | 'SCHEDULED';
  participantCount: number;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
}