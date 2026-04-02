import { z } from 'zod';

// --- Enums ---

export enum TipoDifyApp {
  CHAT = 'chat',
  CHATFLOW = 'chatflow',
  WORKFLOW = 'workflow',
  COMPLETION = 'completion',
  AGENT = 'agent',
}

export enum StatusExecucaoDify {
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

// --- Schemas ---

export interface EnviarMensagemParams {
  query: string;
  conversation_id?: string;
  inputs: Record<string, unknown>;
  files?: unknown[];
  user?: string;
}

export const enviarMensagemSchema = z.object({
  query: z.string().min(1, 'A mensagem não pode estar vazia'),
  conversation_id: z.string().optional(),
  inputs: z.record(z.unknown()).default({}),
  files: z.array(z.unknown()).optional(), // Refinar tipo de arquivo se necessário
  user: z.string().optional(),
});

export interface ExecutarWorkflowParams {
  inputs: Record<string, unknown>;
  files?: unknown[];
  user?: string;
}

export const executarWorkflowSchema = z.object({
  inputs: z.record(z.unknown()).default({}),
  files: z.array(z.unknown()).optional(),
  user: z.string().optional(),
});

export const feedbackSchema = z.object({
  message_id: z.string(),
  rating: z.enum(['like', 'dislike']),
  content: z.string().optional(),
});

// --- Interfaces de Domínio ---

export interface DifyConversation {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

export interface DifyMessage {
  id: string;
  conversation_id: string;
  inputs: Record<string, unknown>;
  query: string;
  answer: string;
  created_at: number;
  feedback?: {
    rating: 'like' | 'dislike';
  };
}

export interface DifyWorkflowExecution {
  id: string;
  workflow_run_id: string;
  task_id?: string;
  status: StatusExecucaoDify;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error?: string;
  elapsed_time: number;
  total_tokens: number;
  total_steps: number;
  created_at: Date;
  finished_at?: Date;
  usuario_id: string | number;
}

export interface DifyApp {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  app_type: TipoDifyApp | string;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  metadata_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Schemas Adicionais ---

export const criarDatasetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

export const criarDocumentoSchema = z.object({
  datasetId: z.string().min(1, 'ID do dataset é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  texto: z.string().min(1, 'Texto é obrigatório'),
});

// --- Interfaces Adicionais ---

export interface DifyExecucaoWorkflow {
  id: string;
  workflow_id: string;
  workflow_run_id?: string;
  status: StatusExecucaoDify;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  created_at: string;
  finished_at: string | null;
  error?: string;
  elapsed_time?: number;
  total_tokens?: number;
  total_steps?: number;
}

// --- Schemas de Conversas ---

export const renomearConversaSchema = z.object({
  conversationId: z.string().min(1, 'ID da conversa é obrigatório'),
  nome: z.string().optional(),
  autoGenerate: z.boolean().optional().default(false),
});

export const deletarConversaSchema = z.object({
  conversationId: z.string().min(1, 'ID da conversa é obrigatório'),
});

// --- Schemas de Anotações ---

export const criarAnotacaoSchema = z.object({
  pergunta: z.string().min(1, 'Pergunta é obrigatória'),
  resposta: z.string().min(1, 'Resposta é obrigatória'),
});

export const atualizarAnotacaoSchema = z.object({
  anotacaoId: z.string().min(1, 'ID da anotação é obrigatório'),
  pergunta: z.string().min(1, 'Pergunta é obrigatória'),
  resposta: z.string().min(1, 'Resposta é obrigatória'),
});

export const deletarAnotacaoSchema = z.object({
  anotacaoId: z.string().min(1, 'ID da anotação é obrigatório'),
});

export const habilitarRespostaAnotacaoSchema = z.object({
  embeddingProviderName: z.string().min(1),
  embeddingModelName: z.string().min(1),
  scoreThreshold: z.number().min(0).max(1).default(0.7),
});

// --- Schemas de Knowledge Base ---

export const buscarDatasetSchema = z.object({
  datasetId: z.string().min(1, 'ID do dataset é obrigatório'),
  query: z.string().min(1, 'Query de busca é obrigatória'),
  searchMethod: z
    .enum(['keyword_search', 'semantic_search', 'full_text_search', 'hybrid_search'])
    .optional()
    .default('semantic_search'),
  topK: z.number().int().min(1).max(100).optional().default(5),
  scoreThreshold: z.number().min(0).max(1).optional(),
});

export const atualizarDocumentoTextoSchema = z.object({
  documentId: z.string().min(1, 'ID do documento é obrigatório'),
  nome: z.string().optional(),
  texto: z.string().optional(),
});

export const atualizarStatusDocumentosSchema = z.object({
  documentIds: z.array(z.string()).min(1, 'Ao menos um documento é obrigatório'),
  habilitado: z.boolean(),
});

// --- Schemas de Segmentos ---

export const criarSegmentosSchema = z.object({
  datasetId: z.string().min(1),
  documentId: z.string().min(1),
  segmentos: z
    .array(
      z.object({
        content: z.string().min(1),
        answer: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      })
    )
    .min(1),
});

export const atualizarSegmentoSchema = z.object({
  datasetId: z.string().min(1),
  documentId: z.string().min(1),
  segmentId: z.string().min(1),
  content: z.string().min(1),
  answer: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

export const deletarSegmentoSchema = z.object({
  datasetId: z.string().min(1),
  documentId: z.string().min(1),
  segmentId: z.string().min(1),
});

// --- Schemas de Tags ---

export const criarTagSchema = z.object({
  nome: z.string().min(1, 'Nome da tag é obrigatório'),
  tipo: z.string().optional(),
});

export const atualizarTagSchema = z.object({
  tagId: z.string().min(1),
  nome: z.string().min(1),
});

export const deletarTagSchema = z.object({
  tagId: z.string().min(1),
});

export const vincularTagDatasetSchema = z.object({
  datasetId: z.string().min(1),
  tagIds: z.array(z.string()).min(1),
});

export const desvincularTagDatasetSchema = z.object({
  datasetId: z.string().min(1),
  tagId: z.string().min(1),
});

// --- Tipos do User Input Form (metadados do app) ---

export interface DifyTextInputField {
  type: 'text-input';
  label: string;
  variable: string;
  required: boolean;
  max_length?: number;
  default?: string;
  options?: string[];
}

export interface DifyParagraphField {
  type: 'paragraph';
  label: string;
  variable: string;
  required: boolean;
  max_length?: number | null;
  hide?: boolean;
  options?: string[];
}

export interface DifyFileListField {
  type: 'file-list';
  label: string;
  variable: string;
  required: boolean;
  max_length?: number;
  allowed_file_types: string[];
  allowed_file_extensions: string[];
  allowed_file_upload_methods: string[];
  options?: string[];
}

export type DifyUserInputField = DifyTextInputField | DifyParagraphField | DifyFileListField;

/** Estrutura bruta: cada item é { "paragraph": {...} } ou { "text-input": {...} } etc. */
export type DifyUserInputFormRaw = Array<Record<string, DifyUserInputField>>;

export interface DifyAppParameters {
  opening_statement?: string;
  suggested_questions?: string[];
  user_input_form: DifyUserInputFormRaw;
  file_upload?: {
    enabled: boolean;
    number_limits?: number;
    allowed_file_types?: string[];
    allowed_file_extensions?: string[];
    allowed_file_upload_methods?: string[];
    image?: {
      enabled: boolean;
      number_limits?: number;
      transfer_methods?: string[];
    };
  };
  system_parameters?: {
    file_size_limit?: number;
    image_file_size_limit?: number;
    audio_file_size_limit?: number;
    video_file_size_limit?: number;
  };
}

/** Extrai campo tipado do formato raw { "paragraph": {...} } */
export function parseUserInputFormField(
  raw: Record<string, DifyUserInputField>
): DifyUserInputField | null {
  const keys = Object.keys(raw);
  if (keys.length === 0) return null;
  const fieldType = keys[0];
  const field = raw[fieldType];
  return { ...field, type: fieldType } as DifyUserInputField;
}

/** Extrai todos os campos do user_input_form raw */
export function parseUserInputForm(raw: DifyUserInputFormRaw): DifyUserInputField[] {
  return raw.map(parseUserInputFormField).filter((f): f is DifyUserInputField => f !== null);
}

// --- Labels ---

export const STATUS_EXECUCAO_LABELS: Record<StatusExecucaoDify, string> = {
  [StatusExecucaoDify.RUNNING]: 'Em execução',
  [StatusExecucaoDify.SUCCEEDED]: 'Concluído',
  [StatusExecucaoDify.FAILED]: 'Falhou',
  [StatusExecucaoDify.STOPPED]: 'Parado',
};
