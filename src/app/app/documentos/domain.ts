import { z } from "zod";
import type { Value } from "platejs";
export type { Value };

/**
 * Este arquivo contém todos os tipos relacionados ao editor de documentos,
 * pastas, compartilhamento, templates, uploads, versões e chat.
 */

// ============================================================================
// CONSTANTES
// ============================================================================

export const PERMISSOES = {
  proprietario: "Proprietário",
  editar: "Pode editar",
  visualizar: "Apenas visualizar",
} as const;

export const TIPOS_PASTA = {
  comum: "comum",
  privada: "privada",
} as const;

export const TIPOS_MEDIA = {
  imagem: "imagem",
  video: "video",
  audio: "audio",
  pdf: "pdf",
  outros: "outros",
} as const;

export const VISIBILIDADE_TEMPLATE = {
  publico: "publico",
  privado: "privado",
} as const;

export const PERMISSAO_VALUES = ["visualizar", "editar"] as const;

export const TIPOS_ARQUIVO = {
  documento_texto: "documento_texto", // Plate.js
  arquivo_generico: "arquivo_generico", // Upload
} as const;

export const EXTENSOES_PERMITIDAS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".mp4",
  ".mp3",
  ".zip",
] as const;

// ============================================================================
// DOCUMENTOS
// ============================================================================

/**
 * Documento completo do banco de dados
 */
export interface Documento {
  id: number;
  titulo: string;
  conteudo: Value; // JSONB - Estrutura do Plate.js
  pasta_id: number | null;
  criado_por: number;
  editado_por: number | null;
  versao: number;
  descricao: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  editado_em: string | null;
  deleted_at: string | null;
}

/**
 * Parâmetros para criar um novo documento
 */
export interface CriarDocumentoParams {
  titulo: string;
  conteudo?: Value; // Opcional - default '[]'
  pasta_id?: number | null;
  descricao?: string | null;
  tags?: string[];
}

/**
 * Parâmetros para atualizar um documento existente
 */
export interface AtualizarDocumentoParams {
  titulo?: string;
  conteudo?: Value;
  pasta_id?: number | null;
  descricao?: string | null;
  tags?: string[];
}

/**
 * Parâmetros para listar documentos com filtros
 */
export interface ListarDocumentosParams {
  pasta_id?: number | null;
  busca?: string;
  tags?: string[];
  criado_por?: number;
  incluir_deletados?: boolean;
  acesso_por_usuario_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Documento com informações do criador
 */
export interface DocumentoComUsuario extends Documento {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
    avatarUrl?: string | null;
  };
  editor?: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    avatarUrl?: string | null;
  };
}

// ============================================================================
// ARQUIVOS GENÉRICOS
// ============================================================================

/**
 * Arquivo genérico (diferente de Documento Plate.js)
 * Representa uploads de PDFs, imagens, documentos Office, etc.
 */
export interface Arquivo {
  id: number;
  nome: string;
  tipo_mime: string;
  tamanho_bytes: number;
  pasta_id: number | null;
  b2_key: string;
  b2_url: string;
  tipo_media: "imagem" | "video" | "audio" | "pdf" | "documento" | "outros";
  criado_por: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Arquivo com informações do criador
 */
export interface ArquivoComUsuario extends Arquivo {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
    avatarUrl?: string | null;
  };
}

/**
 * Parâmetros para criar um novo arquivo genérico
 */
export interface CriarArquivoParams {
  nome: string;
  tipo_mime: string;
  tamanho_bytes: number;
  pasta_id?: number | null;
  b2_key: string;
  b2_url: string;
  tipo_media: "imagem" | "video" | "audio" | "pdf" | "documento" | "outros";
}

/**
 * Parâmetros para atualizar um arquivo genérico
 */
export interface AtualizarArquivoParams {
  nome?: string;
  pasta_id?: number | null;
}

/**
 * Parâmetros para listar arquivos genéricos
 */
export interface ListarArquivosParams {
  pasta_id?: number | null;
  busca?: string;
  tipo_media?: "imagem" | "video" | "audio" | "pdf" | "documento" | "outros";
  criado_por?: number;
  incluir_deletados?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Tipo unificado para listagem de itens (pastas, documentos e arquivos)
 * Usado pelo FileManager para exibir todos os tipos de itens juntos
 */
export type ItemDocumento =
  | { tipo: "documento"; dados: DocumentoComUsuario }
  | { tipo: "arquivo"; dados: ArquivoComUsuario }
  | { tipo: "pasta"; dados: PastaComContadores };

// ============================================================================
// PASTAS
// ============================================================================

/**
 * Pasta do banco de dados
 */
export interface Pasta {
  id: number;
  nome: string;
  pasta_pai_id: number | null;
  tipo: "comum" | "privada";
  criado_por: number;
  descricao: string | null;
  cor: string | null;
  icone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Parâmetros para criar uma nova pasta
 */
export interface CriarPastaParams {
  nome: string;
  pasta_pai_id?: number | null;
  tipo: "comum" | "privada";
  descricao?: string | null;
  cor?: string | null;
  icone?: string | null;
}

/**
 * Parâmetros para atualizar uma pasta
 */
export interface AtualizarPastaParams {
  nome?: string;
  pasta_pai_id?: number | null;
  descricao?: string | null;
  cor?: string | null;
  icone?: string | null;
}

/**
 * Pasta com contagem de documentos e subpastas
 */
export interface PastaComContadores extends Pasta {
  total_documentos: number;
  total_subpastas: number;
  criador: {
    id: number;
    nomeCompleto: string;
  };
}

/**
 * Árvore hierárquica de pastas
 */
export interface PastaHierarquia extends Pasta {
  subpastas: PastaHierarquia[];
  documentos?: Documento[];
}

// ============================================================================
// COMPARTILHAMENTO
// ============================================================================

/**
 * Registro de compartilhamento de documento
 */
export interface DocumentoCompartilhado {
  id: number;
  documento_id: number;
  usuario_id: number;
  permissao: "visualizar" | "editar";
  pode_deletar: boolean;
  compartilhado_por: number;
  created_at: string;
}

/**
 * Parâmetros para compartilhar documento com usuário
 */
export interface CompartilharDocumentoParams {
  documento_id: number;
  usuario_id: number;
  permissao: "visualizar" | "editar";
  pode_deletar?: boolean;
}

/**
 * Compartilhamento com informações do usuário
 */
export interface DocumentoCompartilhadoComUsuario
  extends DocumentoCompartilhado {
  usuario: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
  compartilhador: {
    id: number;
    nomeCompleto: string;
  };
}

/**
 * Parâmetros para listar compartilhamentos
 */
export interface ListarCompartilhamentosParams {
  documento_id?: number;
  usuario_id?: number;
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Template de documento
 */
export interface Template {
  id: number;
  titulo: string;
  descricao: string | null;
  conteudo: Value; // JSONB - Estrutura do Plate.js
  visibilidade: "publico" | "privado";
  categoria: string | null;
  thumbnail_url: string | null;
  criado_por: number;
  uso_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Parâmetros para criar um novo template
 */
export interface CriarTemplateParams {
  titulo: string;
  descricao?: string | null;
  conteudo: Value;
  visibilidade: "publico" | "privado";
  categoria?: string | null;
  thumbnail_url?: string | null;
}

/**
 * Parâmetros para atualizar um template
 */
export interface AtualizarTemplateParams {
  titulo?: string;
  descricao?: string | null;
  conteudo?: Value;
  visibilidade?: "publico" | "privado";
  categoria?: string | null;
  thumbnail_url?: string | null;
}

/**
 * Template com informações do criador
 */
export interface TemplateComUsuario extends Template {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
}

/**
 * Parâmetros para listar templates
 */
export interface ListarTemplatesParams {
  visibilidade?: "publico" | "privado";
  categoria?: string;
  criado_por?: number;
  busca?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// UPLOADS
// ============================================================================

/**
 * Upload de arquivo associado a documento
 */
export interface DocumentoUpload {
  id: number;
  documento_id: number;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_bytes: number;
  b2_key: string;
  b2_url: string;
  tipo_media: "imagem" | "video" | "audio" | "pdf" | "outros";
  criado_por: number;
  created_at: string;
}

/**
 * Parâmetros para registrar upload de arquivo
 */
export interface UploadArquivoParams {
  documento_id: number | null;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_bytes: number;
  b2_key: string;
  b2_url: string;
  tipo_media: "imagem" | "video" | "audio" | "pdf" | "outros";
}

/**
 * Upload com informações do documento e usuário
 */
export interface DocumentoUploadComInfo extends DocumentoUpload {
  documento: {
    id: number;
    titulo: string;
  };
  criador: {
    id: number;
    nomeCompleto: string;
  };
}

/**
 * Parâmetros para listar uploads
 */
export interface ListarUploadsParams {
  documento_id?: number;
  tipo_media?: "imagem" | "video" | "audio" | "pdf" | "outros";
  limit?: number;
  offset?: number;
}

// ============================================================================
// VERSÕES
// ============================================================================

/**
 * Versão de documento (histórico)
 */
export interface DocumentoVersao {
  id: number;
  documento_id: number;
  versao: number;
  conteudo: Value; // JSONB - Estrutura do Plate.js
  titulo: string;
  criado_por: number;
  created_at: string;
}

/**
 * Parâmetros para criar uma nova versão
 */
export interface CriarVersaoParams {
  documento_id: number;
  versao: number;
  conteudo: Value;
  titulo: string;
}

/**
 * Versão com informações do criador
 */
export interface DocumentoVersaoComUsuario extends DocumentoVersao {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
    avatarUrl?: string | null;
  };
}

/**
 * Parâmetros para listar versões
 */
export interface ListarVersoesParams {
  documento_id: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CHAT - SALAS
// ============================================================================

/**
 * Sala de chat
 */
export interface SalaChat {
  id: number;
  nome: string;
  tipo: "geral" | "documento" | "privado" | "grupo";
  documento_id: number | null;
  participante_id: number | null;
  criado_por: number;
  created_at: string;
}

/**
 * Parâmetros para criar uma nova sala de chat
 */
export interface CriarSalaChatParams {
  nome: string;
  tipo: "geral" | "documento" | "privado" | "grupo";
  documento_id?: number | null;
  participante_id?: number | null;
}

/**
 * Sala de chat com informações adicionais
 */
export interface SalaChatComInfo extends SalaChat {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
  documento?: {
    id: number;
    titulo: string;
  };
  ultima_mensagem?: {
    conteudo: string;
    created_at: string;
  };
  total_nao_lidas?: number;
}

/**
 * Parâmetros para listar salas de chat
 */
export interface ListarSalasChatParams {
  tipo?: "geral" | "documento" | "privado" | "grupo";
  documento_id?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CHAT - MENSAGENS
// ============================================================================

/**
 * Mensagem de chat
 */
export interface MensagemChat {
  id: number;
  sala_id: number;
  usuario_id: number;
  conteudo: string;
  tipo: "texto" | "arquivo" | "sistema";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Parâmetros para criar uma nova mensagem
 */
export interface CriarMensagemChatParams {
  sala_id: number;
  conteudo: string;
  tipo: "texto" | "arquivo" | "sistema";
}

/**
 * Parâmetros para atualizar uma mensagem
 */
export interface AtualizarMensagemChatParams {
  conteudo: string;
}

/**
 * Mensagem com informações do usuário
 */
export interface MensagemChatComUsuario extends MensagemChat {
  usuario: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
}

/**
 * Parâmetros para listar mensagens
 */
export interface ListarMensagensChatParams {
  sala_id: number;
  antes_de?: string; // Timestamp para paginação
  limit?: number;
}

// ============================================================================
// REALTIME - SUPABASE
// ============================================================================

/**
 * Evento de presença do usuário no editor
 */
export interface PresencaUsuario {
  user_id: number;
  nome: string;
  email: string;
  cor: string;
  cursor?: {
    x: number;
    y: number;
  };
  ultima_atividade: string;
}

/**
 * Evento de broadcast para colaboração em tempo real
 */
export interface EventoColaboracao {
  tipo: "cursor" | "selection" | "typing" | "edit";
  usuario_id: number;
  documento_id: number;
  dados: unknown;
  timestamp: string;
}

/**
 * Payload para auto-save
 */
export interface AutoSavePayload {
  documento_id: number;
  conteudo: Value;
  titulo?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Resposta padrão de sucesso
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Resposta padrão de erro
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// SCHEMAS
// ============================================================================

export const documentoSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório").max(500),
  conteudo: z.custom<Value>().optional(), // PlateContent
  pasta_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const criarDocumentoSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório").max(500),
  conteudo: z.custom<Value>().optional(),
  pasta_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const atualizarDocumentoSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório").max(500).optional(),
  conteudo: z.custom<Value>().optional(),
  pasta_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const pastaSchema = z.object({
  nome: z.string().min(1, "Nome da pasta obrigatório").max(255),
  pasta_pai_id: z.number().nullable().optional(),
  tipo: z.nativeEnum(TIPOS_PASTA),
  descricao: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
  icone: z.string().nullable().optional(),
});

export const criarPastaSchema = z.object({
  nome: z.string().min(1, "Nome da pasta obrigatório").max(255),
  pasta_pai_id: z.number().nullable().optional(),
  tipo: z.nativeEnum(TIPOS_PASTA).default(TIPOS_PASTA.comum),
  descricao: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
  icone: z.string().nullable().optional(),
});

export const atualizarPastaSchema = z.object({
  nome: z.string().min(1, "Nome da pasta obrigatório").max(255).optional(),
  pasta_pai_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
  icone: z.string().nullable().optional(),
});

export const compartilhamentoSchema = z.object({
  documento_id: z.number(),
  usuario_id: z.number(),
  permissao: z.enum(PERMISSAO_VALUES),
  pode_deletar: z.boolean().optional(),
});

export const criarCompartilhamentoSchema = z.object({
  documento_id: z.number(),
  usuario_id: z.number(),
  permissao: z.enum(PERMISSAO_VALUES),
  pode_deletar: z.boolean().optional().default(false),
});

export const atualizarPermissaoCompartilhamentoSchema = z.object({
  permissao: z.enum(PERMISSAO_VALUES).optional(), // Optional now
  pode_deletar: z.boolean().optional(),
});

export const templateSchema = z.object({
  titulo: z.string().min(1, "Título do template obrigatório").max(500),
  descricao: z.string().nullable().optional(),
  conteudo: z.custom<Value>(),
  visibilidade: z.nativeEnum(VISIBILIDADE_TEMPLATE),
  categoria: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

export const criarTemplateSchema = z.object({
  titulo: z.string().min(1, "Título do template obrigatório").max(500),
  descricao: z.string().nullable().optional(),
  conteudo: z.custom<Value>(),
  visibilidade: z
    .nativeEnum(VISIBILIDADE_TEMPLATE)
    .default(VISIBILIDADE_TEMPLATE.privado),
  categoria: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

export const atualizarTemplateSchema = z.object({
  titulo: z
    .string()
    .min(1, "Título do template obrigatório")
    .max(500)
    .optional(),
  descricao: z.string().nullable().optional(),
  conteudo: z.custom<Value>().optional(),
  visibilidade: z.nativeEnum(VISIBILIDADE_TEMPLATE).optional(),
  categoria: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

export const uploadSchema = z.object({
  documento_id: z.number().optional(), // Pode ser nulo se for upload avulso
  nome_arquivo: z.string().min(1, "Nome do arquivo obrigatório"),
  tipo_mime: z.string().min(1, "Tipo MIME obrigatório"),
  tamanho_bytes: z.number().min(0, "Tamanho do arquivo deve ser positivo"),
  b2_key: z.string().min(1, "B2 Key obrigatória"),
  b2_url: z.string().url("URL inválida para B2").min(1, "B2 URL obrigatória"),
  tipo_media: z.nativeEnum(TIPOS_MEDIA),
});

export const criarUploadSchema = z.object({
  documento_id: z.number().nullable().optional(),
  nome_arquivo: z.string().min(1, "Nome do arquivo obrigatório"),
  tipo_mime: z.string().min(1, "Tipo MIME obrigatório"),
  tamanho_bytes: z.number().min(0, "Tamanho do arquivo deve ser positivo"),
  b2_key: z.string().min(1, "B2 Key obrigatória"),
  b2_url: z.string().url("URL inválida para B2").min(1, "B2 URL obrigatória"),
  tipo_media: z.nativeEnum(TIPOS_MEDIA),
});

export const autoSavePayloadSchema = z.object({
  documento_id: z.number(),
  conteudo: z.custom<Value>().optional(),
  titulo: z.string().optional(),
});

export const criarVersaoSchema = z.object({
  documento_id: z.number(),
  versao: z.number().min(1),
  conteudo: z.custom<Value>(),
  titulo: z.string(),
});

export const criarSalaChatSchema = z.object({
  nome: z.string().min(1, "Nome da sala obrigatório").max(255),
  tipo: z.enum(["geral", "documento", "privado", "grupo"]),
  documento_id: z.number().nullable().optional(),
  participante_id: z.number().nullable().optional(),
});

export const criarMensagemChatSchema = z.object({
  sala_id: z.number(),
  conteudo: z.string().min(1, "Mensagem não pode ser vazia"),
  tipo: z.enum(["texto", "arquivo", "sistema"]).default("texto"),
});

export const atualizarMensagemChatSchema = z.object({
  conteudo: z.string().min(1, "Mensagem não pode ser vazia"),
});

// ============================================================================
// ARQUIVOS GENÉRICOS - SCHEMAS
// ============================================================================

export const arquivoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(255),
  tipo_mime: z.string(),
  tamanho_bytes: z.number().min(0),
  pasta_id: z.number().nullable().optional(),
  b2_key: z.string(),
  b2_url: z.string().url(),
  tipo_media: z.enum([
    "imagem",
    "video",
    "audio",
    "pdf",
    "documento",
    "outros",
  ]),
});

export const criarArquivoSchema = arquivoSchema;

export const atualizarArquivoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(255).optional(),
  pasta_id: z.number().nullable().optional(),
});
