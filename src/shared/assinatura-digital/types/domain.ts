/**
 * ASSINATURA DIGITAL - Tipos de Domínio
 *
 * Tipos centrais que definem as entidades do módulo de assinatura digital.
 * Estes tipos são usados em toda a aplicação (frontend e backend).
 *
 * CONVENÇÕES:
 * - Schemas Zod para validação de entrada
 * - Interfaces TypeScript para tipos estáticos
 * - Nomenclatura alinhada com banco de dados (snake_case para campos)
 */

import { z } from 'zod';
import type { TemplateCampo } from './template.types';

// =============================================================================
// TIPOS BASE (ENUMS)
// =============================================================================

export type TipoTemplate = 'pdf' | 'markdown';
export type StatusTemplate = 'ativo' | 'inativo' | 'rascunho';
export type MetadadoSeguranca = 'ip' | 'user_agent' | 'device_info' | 'geolocation';

// =============================================================================
// SEGMENTO
// =============================================================================

export const createSegmentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
});

export const updateSegmentoSchema = createSegmentoSchema.partial();

export type CreateSegmentoInput = z.infer<typeof createSegmentoSchema>;
export type UpdateSegmentoInput = z.infer<typeof updateSegmentoSchema>;

export interface Segmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  formularios_count?: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TEMPLATE
// =============================================================================

export const createTemplateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tipo_template: z.enum(['pdf', 'markdown']).default('pdf'),
  conteudo_markdown: z.string().optional().nullable(),
  segmento_id: z.number().int().positive().optional().nullable(),
  contrato_id: z.number().int().positive().optional().nullable(),
  pdf_url: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  status: z.enum(['ativo', 'inativo', 'rascunho']).default('rascunho'),
  versao: z.number().int().positive().optional().default(1),
  arquivo_original: z.string().optional().nullable(),
  arquivo_nome: z.string().optional().nullable(),
  arquivo_tamanho: z.number().int().positive().optional().nullable(),
  criado_por: z.string().optional().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export interface Template {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  tipo_template: TipoTemplate;
  conteudo_markdown?: string | null;
  segmento_id?: number | null;
  contrato_id?: number | null;
  pdf_url?: string | null;
  ativo: boolean;
  status: StatusTemplate;
  versao: number;
  arquivo_original?: string | null;
  arquivo_nome?: string | null;
  arquivo_tamanho?: number | null;
  criado_por?: string | null;
  campos?: string | TemplateCampo[];
  created_at: string;
  updated_at: string;
}

// TemplateCampo é importado de ./template.types.ts (versão portuguesa, alinhada com DB)

// =============================================================================
// FORMULÁRIO
// =============================================================================

export const createFormularioSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .max(50, 'Slug deve ter no máximo 50 caracteres'),
  descricao: z.string().optional(),
  segmento_id: z.number().int().positive('Selecione um segmento'),
  form_schema: z.object({
    id: z.string().min(1, 'Schema deve ter um ID'),
    version: z.string().min(1, 'Schema deve ter uma versão'),
    sections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        fields: z.array(z.record(z.string(), z.unknown())),
        collapsible: z.boolean().optional(),
        defaultCollapsed: z.boolean().optional(),
      })
    ).min(0),
    globalValidations: z.array(
      z.object({
        id: z.string(),
        fields: z.array(z.string()),
        validator: z.string(),
        message: z.string(),
        params: z.record(z.string(), z.unknown()).optional(),
      })
    ).optional(),
  }),
  schema_version: z.string().optional(),
  template_ids: z.array(z.string()).min(1, 'Deve haver ao menos um template associado'),
  ativo: z.boolean().default(true),
  arquivado: z.boolean().optional(),
  ordem: z.number().optional(),
  foto_necessaria: z.boolean().optional(),
  geolocation_necessaria: z.boolean().optional(),
  metadados_seguranca: z.array(z.enum(['ip', 'user_agent', 'device_info', 'geolocation'])).optional(),
});

export const updateFormularioSchema = createFormularioSchema.partial();

export type CreateFormularioInput = z.infer<typeof createFormularioSchema>;
export type UpdateFormularioInput = z.infer<typeof updateFormularioSchema>;

export interface Formulario {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  segmento_id: number;
  form_schema?: DynamicFormSchema | null;
  schema_version?: string;
  template_ids?: string[];
  ativo: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: MetadadoSeguranca[];
  criado_por?: string | null;
  created_at: string;
  updated_at: string;
  segmento?: Segmento;
}

// =============================================================================
// DYNAMIC FORM SCHEMA
// =============================================================================

/**
 * Tipos de campo disponíveis no formulário dinâmico
 */
export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  CPF = 'cpf',
  CNPJ = 'cnpj',
  PHONE = 'phone',
  CEP = 'cep',
  CLIENT_SEARCH = 'client_search',
  PARTE_CONTRARIA_SEARCH = 'parte_contraria_search',
}

/**
 * Regras de validação para campos individuais
 */
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  email?: boolean;
  custom?: string;
  message?: string;
}

/**
 * Opções para campos de seleção (select, radio)
 */
export interface FormFieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

/**
 * Regras para renderização condicional de campos
 */
export interface ConditionalRule {
  field: string;
  operator: '=' | '!=' | '>' | '<' | 'contains' | 'empty' | 'notEmpty';
  value?: string | number | boolean;
}

/**
 * Configuração de busca de entidade para campos de busca
 */
export interface EntitySearchConfig {
  entityType: 'cliente' | 'parte_contraria';
  searchBy: ('cpf' | 'cnpj' | 'nome')[];
  autoFill?: Record<string, string>; // Mapeamento campo_entidade -> campo_formulario
}

/**
 * Definição completa de um campo do formulário
 */
export interface FormFieldSchema {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  validation?: ValidationRule;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: FormFieldOption[];
  conditional?: ConditionalRule;
  gridColumns?: 1 | 2 | 3;
  helpText?: string;
  disabled?: boolean;
  hidden?: boolean; // Campo não aparece no formulário público
  entitySearch?: EntitySearchConfig;
}

/**
 * Agrupamento de campos em seções
 */
export interface FormSectionSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldSchema[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Validações entre múltiplos campos
 */
export interface CrossFieldValidation {
  id: string;
  fields: string[];
  validator: string;
  message: string;
  params?: Record<string, unknown>;
}

/**
 * Schema completo do formulário dinâmico
 */
export interface DynamicFormSchema {
  id: string;
  version: string;
  sections: FormSectionSchema[];
  globalValidations?: CrossFieldValidation[];
}

/**
 * Union type para valores possíveis de campos do formulário
 */
export type FormFieldValue = string | number | boolean | Date | null | undefined;

/**
 * Dados do formulário preenchido
 */
export type DynamicFormData = Record<string, FormFieldValue>;

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function fieldRequiresOptions(type: FormFieldType): boolean {
  return type === FormFieldType.SELECT || type === FormFieldType.RADIO;
}

export function isFormattedBRField(type: FormFieldType): boolean {
  return [
    FormFieldType.CPF,
    FormFieldType.CNPJ,
    FormFieldType.PHONE,
    FormFieldType.CEP,
  ].includes(type);
}

// =============================================================================
// UPLOAD PDF SCHEMA
// =============================================================================

/**
 * Schema para validação de upload de PDF
 * Usado pelo PdfUploadField component
 */
export const uploadPdfSchema = z.object({
  url: z.string().url('URL inválida'),
  nome: z.string().min(1, 'Nome do arquivo é obrigatório'),
  tamanho: z.number().int().positive('Tamanho deve ser positivo').max(10 * 1024 * 1024, 'Arquivo muito grande. Máximo 10MB'),
});

export type UploadPdfResult = z.infer<typeof uploadPdfSchema>;

/**
 * Schema wrapper para UI do formulário de template
 * Inclui campo tipo_template para controle condicional
 */
export const templateFormSchema = createTemplateSchema.refine(
  (data) => {
    if (data.tipo_template === 'pdf') {
      return !!data.pdf_url || !!data.arquivo_original;
    }
    return true;
  },
  {
    message: 'PDF é obrigatório para templates do tipo PDF',
    path: ['pdf_url'],
  }
).refine(
  (data) => {
    if (data.tipo_template === 'markdown') {
      return !!data.conteudo_markdown && data.conteudo_markdown.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Conteúdo Markdown é obrigatório para templates do tipo Markdown',
    path: ['conteudo_markdown'],
  }
);

// TemplateFormData deve ser compatível com react-hook-form, onde campos com default são opcionais
export type TemplateFormData = Omit<z.infer<typeof templateFormSchema>, 'ativo' | 'status' | 'versao' | 'tipo_template'> & {
  ativo?: boolean;
  status?: StatusTemplate;
  versao?: number;
  tipo_template?: 'pdf' | 'markdown';
};

// =============================================================================
// ASSINATURA DIGITAL (Registro)
// =============================================================================

export const createAssinaturaDigitalSchema = z.object({
  formulario_id: z.number(),
  template_id: z.number(),
  segmento_id: z.number().nullable(),
  contrato_id: z.number().optional().nullable(),
  signatario_email: z.string().email('Email inválido'),
  signatario_nome: z.string().min(1, 'Nome do signatário é obrigatório'),
  status: z.enum(['pendente', 'assinado', 'cancelado', 'erro']).default('pendente'),
  token: z.string().optional(),
  documento_url: z.string().optional(),
  metadados: z.record(z.unknown()).optional(),
});

export const updateAssinaturaDigitalSchema = createAssinaturaDigitalSchema.partial();

export type CreateAssinaturaDigitalInput = z.infer<typeof createAssinaturaDigitalSchema>;
export type UpdateAssinaturaDigitalInput = z.infer<typeof updateAssinaturaDigitalSchema>;

export interface AssinaturaDigital {
  id: number;
  formulario_id: number;
  template_id: number;
  segmento_id: number | null;
  contrato_id?: number | null;
  signatario_email: string;
  signatario_nome: string;
  status: 'pendente' | 'assinado' | 'cancelado' | 'erro';
  token?: string;
  documento_url?: string;
  metadados?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
