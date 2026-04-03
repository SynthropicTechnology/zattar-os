/**
 * ASSINATURA DIGITAL DOMAIN - Entidades e Schemas de Validação
 * 
 * CONVENÇÕES:
 * - Prefixar schemas com "create" ou "update" (createDocumentoSchema)
 * - Interfaces em camelCase espelhando o banco de dados
 * - NUNCA importar React/Next.js aqui
 * - Schemas Zod para validação de entrada
 * - Tipos base e enums
 * 
 * FLUXOS SUPORTADOS:
 * 1. Fluxo antigo: Templates + Formulários (simulador/preview)
 * 2. Fluxo novo: Documentos via upload de PDF + links públicos
 */

import { z } from "zod";
import type { ClienteBase, ParteContraria } from "@/app/(authenticated)/partes";

// =============================================================================
// TIPOS BASE E ENUMS
// =============================================================================

export type StatusTemplate = "ativo" | "inativo" | "rascunho";

export type AssinaturaDigitalDocumentoStatus =
  | "rascunho"
  | "pronto"
  | "concluido"
  | "cancelado";

export type AssinaturaDigitalDocumentoAssinanteTipo =
  | "cliente"
  | "parte_contraria"
  | "representante"
  | "terceiro"
  | "usuario"
  | "convidado";

export type AssinaturaDigitalDocumentoAncoraTipo = "assinatura" | "rubrica";

// =============================================================================
// SCHEMAS ZOD - DOCUMENTOS (NOVO FLUXO)
// =============================================================================

export const createAssinaturaDigitalDocumentoAssinanteSchema = z.object({
  assinante_tipo: z.enum([
    "cliente",
    "parte_contraria",
    "representante",
    "terceiro",
    "usuario",
    "convidado",
  ]),
  assinante_entidade_id: z.number().int().positive().optional().nullable(),
  dados_snapshot: z.record(z.unknown()).optional(),
});

export const createAssinaturaDigitalDocumentoSchema = z.object({
  titulo: z.string().min(1).max(200).optional().nullable(),
  selfie_habilitada: z.boolean().default(false),
  pdf_original_url: z.string().url(),
  hash_original_sha256: z.string().optional().nullable(),
  created_by: z.number().int().positive().optional().nullable(),
  assinantes: z
    .array(createAssinaturaDigitalDocumentoAssinanteSchema)
    .max(50)
    .default([]), // Assinantes podem ser adicionados depois na tela de edição
});

export const upsertAssinaturaDigitalDocumentoAncoraSchema = z.object({
  documento_assinante_id: z.number().int().positive(),
  tipo: z.enum(["assinatura", "rubrica"]),
  pagina: z.number().int().positive(),
  x_norm: z.number().min(0).max(1),
  y_norm: z.number().min(0).max(1),
  w_norm: z.number().min(0).max(1),
  h_norm: z.number().min(0).max(1),
});

export const updatePublicSignerIdentificationSchema = z.object({
  nome_completo: z.string().min(3).max(200).optional(),
  cpf: z.string().regex(/^\d{11}$/).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(10).max(15).optional(),
});

export const finalizePublicSignerSchema = z.object({
  selfie_base64: z.string().optional().nullable(),
  assinatura_base64: z.string().min(1),
  rubrica_base64: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  geolocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional()
    .nullable(),
  termos_aceite_versao: z.string().default("v1.0-MP2200-2"),
  dispositivo_fingerprint_raw: z.record(z.unknown()).optional().nullable(),
});

// =============================================================================
// SCHEMAS ZOD - TEMPLATES (FLUXO ANTIGO)
// =============================================================================

export const createTemplateSchema = z.object({
  nome: z.string().min(1).max(200),
  arquivo_original: z.string().url(),
  arquivo_nome: z.string().min(1).max(255),
  arquivo_tamanho: z.number().int().positive(),
  template_uuid: z.string().uuid().optional(),
  descricao: z.string().max(1000).optional().nullable(),
  status: z.enum(["ativo", "inativo", "rascunho"]).optional(),
  versao: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
  campos: z.string().optional(),
  conteudo_markdown: z.string().optional().nullable(),
  criado_por: z.string().optional().nullable(),
  pdf_url: z.string().optional().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const listTemplatesSchema = z.object({
  search: z.string().optional(),
  ativo: z.boolean().optional(),
  status: z.enum(["ativo", "inativo", "rascunho"]).optional(),
  segmento_id: z.number().int().positive().optional(),
});

// =============================================================================
// SCHEMAS ZOD - FORMULÁRIOS
// =============================================================================

export const createFormularioSchema = z.object({
  nome: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  segmento_id: z.number().int().positive(),
  descricao: z.string().max(1000).optional().nullable(),
  form_schema: z.unknown().optional(),
  schema_version: z.string().optional(),
  template_ids: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional().nullable(),
  foto_necessaria: z.boolean().optional(),
  geolocation_necessaria: z.boolean().optional(),
  metadados_seguranca: z.string().optional(),
  criado_por: z.string().optional().nullable(),
});

export const updateFormularioSchema = createFormularioSchema.partial();

export const listFormulariosSchema = z.object({
  segmento_id: z.union([z.number().int().positive(), z.array(z.number().int().positive())]).optional(),
  ativo: z.boolean().optional(),
  search: z.string().optional(),
  foto_necessaria: z.boolean().optional(),
  geolocation_necessaria: z.boolean().optional(),
});

// =============================================================================
// SCHEMAS ZOD - SEGMENTOS
// =============================================================================

export const createSegmentoSchema = z.object({
  nome: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  descricao: z.string().max(500).optional().nullable(),
  ativo: z.boolean().optional(),
});

export const updateSegmentoSchema = createSegmentoSchema.partial();

export const listSegmentosSchema = z.object({
  ativo: z.boolean().optional(),
  search: z.string().optional(),
});

// =============================================================================
// SCHEMAS ZOD - ASSINATURA (FLUXO ANTIGO)
// =============================================================================

export const previewPayloadSchema = z.object({
  cliente_id: z.number().int().positive(),
  contrato_id: z.number().int().positive().optional().nullable(),
  template_id: z.string().uuid(),
  foto_base64: z.string().optional().nullable(),
  request_id: z.string().optional().nullable(),
  parte_contraria_dados: z
    .array(
      z.object({
        id: z.number().int().positive(),
        nome: z.string(),
        cpf: z.string().optional().nullable(),
        cnpj: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const finalizePayloadSchema = z.object({
  cliente_id: z.number().int().positive(),
  contrato_id: z.number().int().positive().optional().nullable(),
  template_id: z.string().uuid(),
  segmento_id: z.number().int().positive(),
  segmento_nome: z.string().optional(),
  formulario_id: z.number().int().positive(),
  cliente_dados: z
    .object({
      id: z.number().int().positive(),
      nome: z.string(),
      cpf: z.string().optional().nullable(),
      cnpj: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      endereco: z.string().optional(),
    })
    .optional(),
  parte_contraria_dados: z
    .array(
      z.object({
        id: z.number().int().positive(),
        nome: z.string(),
        cpf: z.string().optional().nullable(),
        cnpj: z.string().optional().nullable(),
      })
    )
    .optional(),
  assinatura_base64: z.string().min(1),
  foto_base64: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  geolocation_accuracy: z.number().optional().nullable(),
  geolocation_timestamp: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  sessao_id: z.string().optional().nullable(),
  request_id: z.string().optional().nullable(),
  termos_aceite: z.boolean().refine((val) => val === true, {
    message: "Termos devem ser aceitos",
  }),
  termos_aceite_versao: z.string().default("v1.0-MP2200-2"),
  dispositivo_fingerprint_raw: z.record(z.unknown()).optional().nullable(),
});

export const listSessoesSchema = z.object({
  segmento_id: z.number().int().positive().optional(),
  formulario_id: z.number().int().positive().optional(),
  status: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

// =============================================================================
// INTERFACES TYPESCRIPT - DOCUMENTOS (NOVO FLUXO)
// =============================================================================

export interface AssinaturaDigitalDocumento {
  id: number;
  documento_uuid: string;
  titulo?: string | null;
  status: AssinaturaDigitalDocumentoStatus;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  pdf_final_url?: string | null;
  hash_original_sha256?: string | null;
  hash_final_sha256?: string | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalDocumentoAssinante {
  id: number;
  documento_id: number;
  assinante_tipo: AssinaturaDigitalDocumentoAssinanteTipo;
  assinante_entidade_id?: number | null;
  dados_snapshot: Record<string, unknown>;
  dados_confirmados: boolean;
  token: string;
  status: "pendente" | "concluido";
  expires_at?: string | null;
  selfie_url?: string | null;
  assinatura_url?: string | null;
  rubrica_url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  geolocation?: Record<string, unknown> | null;
  termos_aceite_versao?: string | null;
  termos_aceite_data?: string | null;
  dispositivo_fingerprint_raw?: Record<string, unknown> | null;
  concluido_em?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalDocumentoAncora {
  id: number;
  documento_id: number;
  documento_assinante_id: number;
  tipo: AssinaturaDigitalDocumentoAncoraTipo;
  pagina: number;
  x_norm: number;
  y_norm: number;
  w_norm: number;
  h_norm: number;
  created_at?: string;
}

export interface AssinaturaDigitalDocumentoCompleto
  extends AssinaturaDigitalDocumento {
  assinantes: AssinaturaDigitalDocumentoAssinante[];
  ancoras: AssinaturaDigitalDocumentoAncora[];
}

// =============================================================================
// INTERFACES TYPESCRIPT - TEMPLATES
// =============================================================================

export interface AssinaturaDigitalTemplate {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  pdf_url?: string | null;
  status: string;
  versao: number;
  ativo: boolean;
  campos: string;
  conteudo_markdown?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalTemplateList {
  templates: AssinaturaDigitalTemplate[];
  total: number;
}

// =============================================================================
// INTERFACES TYPESCRIPT - SEGMENTOS
// =============================================================================

export interface AssinaturaDigitalSegmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  formularios_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalSegmentoList {
  segmentos: AssinaturaDigitalSegmento[];
  total: number;
}

// =============================================================================
// INTERFACES TYPESCRIPT - FORMULÁRIOS
// =============================================================================

export interface AssinaturaDigitalFormulario {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  segmento_id: number;
  form_schema?: unknown;
  schema_version?: string;
  template_ids?: string[];
  ativo: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: string;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
  segmento?: AssinaturaDigitalSegmento;
}

export interface AssinaturaDigitalFormularioList {
  formularios: AssinaturaDigitalFormulario[];
  total: number;
}

// =============================================================================
// INTERFACES TYPESCRIPT - ASSINATURA (FLUXO ANTIGO)
// =============================================================================

export interface DeviceFingerprintData {
  screen_resolution?: string;
  color_depth?: number;
  timezone_offset?: number;
  timezone_name?: string;
  language?: string;
  platform?: string;
  hardware_concurrency?: number;
  device_memory?: number;
  touch_support?: boolean;
  battery_level?: number;
  battery_charging?: boolean;
  canvas_hash?: string;
  webgl_hash?: string;
  plugins?: string[];
  fonts?: string[];
  user_agent?: string;
  [key: string]: unknown;
}

export interface AssinaturaDigitalRecord {
  id: number;
  cliente_id: number;
  contrato_id?: number | null;
  template_uuid: string;
  segmento_id: number;
  formulario_id: number;
  sessao_uuid: string;
  assinatura_url: string;
  foto_url: string | null;
  pdf_url: string;
  protocolo: string;
  ip_address: string | null;
  user_agent: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocation_accuracy: number | null;
  geolocation_timestamp: string | null;
  data_assinatura: string;
  status: string;
  enviado_sistema_externo: boolean;
  data_envio_externo: string | null;
  hash_original_sha256: string;
  hash_final_sha256: string | null;
  termos_aceite_versao: string;
  termos_aceite_data: string;
  dispositivo_fingerprint_raw: DeviceFingerprintData | null;
  created_at: string;
  updated_at: string;
  cliente_dados?: ClienteBase;
  parte_contraria_dados?: ParteContraria[];
}

export interface SessaoAssinaturaRecord {
  id: number;
  contrato_id: number | null;
  sessao_uuid: string;
  status: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: Record<string, unknown> | null;
  geolocation?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  expires_at?: string | null;
}

export interface AuditResult {
  assinatura_id: number;
  protocolo: string;
  status: "valido" | "invalido" | "erro";
  hashes_validos: boolean;
  hash_original_registrado: string;
  hash_original_recalculado?: string;
  hash_final_registrado: string;
  hash_final_recalculado: string;
  entropia_suficiente: boolean;
  entropia_detalhes?: {
    campos_presentes: number;
    campos_obrigatorios: number;
    campos_recomendados: number;
  };
  foto_embedada?: boolean;
  avisos: string[];
  erros: string[];
  auditado_em: string;
}

// =============================================================================
// TYPES INFERIDOS DOS SCHEMAS ZOD
// =============================================================================

export type CreateAssinaturaDigitalDocumentoAssinanteInput = z.infer<
  typeof createAssinaturaDigitalDocumentoAssinanteSchema
>;
export type CreateAssinaturaDigitalDocumentoInput = z.infer<
  typeof createAssinaturaDigitalDocumentoSchema
>;
export type UpsertAssinaturaDigitalDocumentoAncoraInput = z.infer<
  typeof upsertAssinaturaDigitalDocumentoAncoraSchema
>;
export type UpdatePublicSignerIdentificationInput = z.infer<
  typeof updatePublicSignerIdentificationSchema
>;
export type FinalizePublicSignerInput = z.infer<
  typeof finalizePublicSignerSchema
>;

export type UpsertTemplateInput = z.infer<typeof createTemplateSchema>;
export type ListTemplatesParams = z.infer<typeof listTemplatesSchema>;

export type UpsertFormularioInput = z.infer<typeof createFormularioSchema>;
export type ListFormulariosParams = z.infer<typeof listFormulariosSchema>;

export type UpsertSegmentoInput = z.infer<typeof createSegmentoSchema>;
export type ListSegmentosParams = z.infer<typeof listSegmentosSchema>;

export type PreviewPayload = z.infer<typeof previewPayloadSchema>;
export type FinalizePayload = z.infer<typeof finalizePayloadSchema>;
export type ListSessoesParams = z.infer<typeof listSessoesSchema>;

// =============================================================================
// CONSTANTES E LABELS
// =============================================================================

export const STATUS_DOCUMENTO_LABELS: Record<
  AssinaturaDigitalDocumentoStatus,
  string
> = {
  rascunho: "Rascunho",
  pronto: "Pronto para Assinatura",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const TIPO_ASSINANTE_LABELS: Record<
  AssinaturaDigitalDocumentoAssinanteTipo,
  string
> = {
  cliente: "Cliente",
  parte_contraria: "Parte Contrária",
  representante: "Representante",
  terceiro: "Terceiro",
  usuario: "Usuário",
  convidado: "Convidado",
};

export const TIPO_ANCORA_LABELS: Record<
  AssinaturaDigitalDocumentoAncoraTipo,
  string
> = {
  assinatura: "Assinatura",
  rubrica: "Rubrica",
};

export const STATUS_TEMPLATE_LABELS: Record<StatusTemplate, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  rascunho: "Rascunho",
};
