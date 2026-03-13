import { z } from "zod";

// --- Tipos de Assistente ---

export const TIPO_ASSISTENTE = {
  IFRAME: "iframe",
  DIFY: "dify",
} as const;

export type TipoAssistente = (typeof TIPO_ASSISTENTE)[keyof typeof TIPO_ASSISTENTE];

export const TIPO_ASSISTENTE_LABELS: Record<TipoAssistente, string> = {
  iframe: "Iframe",
  dify: "IA",
};

export const STATUS_LABELS = {
  true: "Ativo",
  false: "Inativo",
} as const;

// --- Schema Principal ---

export const assistenteSchema = z.object({
  id: z.number().optional(),
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  descricao: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  tipo: z.enum(["iframe", "dify"]).default("iframe"),
  iframe_code: z.string().optional().nullable(),
  dify_app_id: z.string().uuid().optional().nullable(),
  ativo: z.boolean().default(true),
  criado_por: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// --- Schemas de Criação ---

export const criarAssistenteIframeSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  descricao: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  iframe_code: z
    .string({ required_error: "Código do iframe é obrigatório" })
    .min(1, "Código do iframe é obrigatório"),
});

// Schema para criação automática via Dify (usado internamente)
export const criarAssistenteDifySchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  dify_app_id: z.string().uuid(),
});

// Alias para retrocompatibilidade
export const criarAssistenteSchema = criarAssistenteIframeSchema;

export const atualizarAssistenteSchema = assistenteSchema
  .pick({
    nome: true,
    descricao: true,
    iframe_code: true,
    ativo: true,
  })
  .partial();

// --- Types ---

export type AssistenteSchema = z.infer<typeof assistenteSchema>;
export type CriarAssistenteInput = z.infer<typeof criarAssistenteSchema>;
export type CriarAssistenteDifyInput = z.infer<typeof criarAssistenteDifySchema>;
export type AtualizarAssistenteInput = z.infer<typeof atualizarAssistenteSchema>;

export type Assistente = z.infer<typeof assistenteSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};

export interface AssistentesParams {
  busca?: string;
  ativo?: boolean;
}
