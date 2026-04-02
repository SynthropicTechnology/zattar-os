/**
 * CHATWOOT DOMAIN - Tipos e Schemas
 *
 * Define tipos, schemas Zod e utilitários para integração com Chatwoot.
 */

import { z } from 'zod';

// =============================================================================
// Tipos de Entidade
// =============================================================================

export type TipoEntidadeChatwoot = 'cliente' | 'parte_contraria' | 'terceiro';

export const tipoEntidadeChatwootSchema = z.enum([
  'cliente',
  'parte_contraria',
  'terceiro',
]);

// Status de conversa
export type StatusConversa = 'open' | 'resolved' | 'pending' | 'snoozed';
export const statusConversaSchema = z.enum(['open', 'resolved', 'pending', 'snoozed']);

// Role de usuário
export type RoleUsuario = 'agent' | 'supervisor' | 'admin';
export const roleUsuarioSchema = z.enum(['agent', 'supervisor', 'admin']);

// =============================================================================
// PartesChatwoot (mapeamento local)
// =============================================================================

export interface PartesChatwoot {
  id: number;
  tipo_entidade: TipoEntidadeChatwoot;
  entidade_id: number;
  chatwoot_contact_id: number;
  chatwoot_account_id: number;
  ultima_sincronizacao: string;
  dados_sincronizados: Record<string, unknown>;
  sincronizado: boolean;
  erro_sincronizacao: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ConversasChatwoot (rastreamento de conversas)
// =============================================================================

export interface ConversaChatwoot {
  id: bigint;
  chatwoot_conversation_id: bigint;
  chatwoot_account_id: bigint;
  chatwoot_inbox_id: bigint;
  mapeamento_partes_chatwoot_id: number | null;
  status: StatusConversa;
  assignee_id: bigint | null;
  assignee_chatwoot_id: bigint | null;
  ultima_mensagem_em: string | null;
  contador_mensagens_nao_lidas: bigint;
  contador_mensagens_total: bigint;
  ultima_sincronizacao: string | null;
  sincronizado: boolean;
  erro_sincronizacao: string | null;
  dados_sincronizados: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// UsuariosChatwoot (mapeamento usuário-agente)
// =============================================================================

export interface UsuarioChatwoot {
  id: bigint;
  usuario_id: string; // UUID
  chatwoot_agent_id: bigint;
  chatwoot_account_id: bigint;
  email: string | null;
  nome_chatwoot: string | null;
  role: RoleUsuario;
  disponivel: boolean;
  disponivel_em: string | null;
  skills: string[] | null;
  contador_conversas_ativas: bigint;
  max_conversas_simultaneas: bigint;
  ultima_sincronizacao: string | null;
  sincronizado: boolean;
  erro_sincronizacao: string | null;
  dados_sincronizados: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Input Schemas - PartesChatwoot
// =============================================================================

export const createPartesChatwootSchema = z.object({
  tipo_entidade: tipoEntidadeChatwootSchema,
  entidade_id: z.number().int().positive(),
  chatwoot_contact_id: z.number().int().positive(),
  chatwoot_account_id: z.number().int().positive(),
  dados_sincronizados: z.record(z.unknown()).optional().default({}),
});

export type CreatePartesChatwootInput = z.infer<typeof createPartesChatwootSchema>;

export const updatePartesChatwootSchema = z.object({
  ultima_sincronizacao: z.string().datetime().optional(),
  dados_sincronizados: z.record(z.unknown()).optional(),
  sincronizado: z.boolean().optional(),
  erro_sincronizacao: z.string().nullable().optional(),
});

export type UpdatePartesChatwootInput = z.infer<typeof updatePartesChatwootSchema>;

// =============================================================================
// Input Schemas - ConversasChatwoot
// =============================================================================

export const createConversaChatwootSchema = z.object({
  chatwoot_conversation_id: z.bigint(),
  chatwoot_account_id: z.bigint(),
  chatwoot_inbox_id: z.bigint(),
  mapeamento_partes_chatwoot_id: z.number().int().positive().optional(),
  status: statusConversaSchema.default('open'),
  assignee_chatwoot_id: z.bigint().optional(),
  dados_sincronizados: z.record(z.unknown()).optional().default({}),
});

export type CreateConversaChatwootInput = z.infer<typeof createConversaChatwootSchema>;

export const updateConversaChatwootSchema = z.object({
  status: statusConversaSchema.optional(),
  assignee_chatwoot_id: z.bigint().nullable().optional(),
  contador_mensagens_nao_lidas: z.bigint().optional(),
  contador_mensagens_total: z.bigint().optional(),
  ultima_mensagem_em: z.string().datetime().nullable().optional(),
  ultima_sincronizacao: z.string().datetime().optional(),
  sincronizado: z.boolean().optional(),
  erro_sincronizacao: z.string().nullable().optional(),
  dados_sincronizados: z.record(z.unknown()).optional(),
});

export type UpdateConversaChatwootInput = z.infer<typeof updateConversaChatwootSchema>;

// =============================================================================
// Input Schemas - UsuariosChatwoot
// =============================================================================

export const createUsuarioChatwootSchema = z.object({
  usuario_id: z.string().uuid().optional(),
  chatwoot_agent_id: z.bigint(),
  chatwoot_account_id: z.bigint(),
  role: roleUsuarioSchema.default('agent'),
  skills: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  nome_chatwoot: z.string().optional(),
  max_conversas_simultaneas: z.number().int().positive().default(10),
  dados_sincronizados: z.record(z.unknown()).optional().default({}),
});

export type CreateUsuarioChatwootInput = z.infer<typeof createUsuarioChatwootSchema>;

export const updateUsuarioChatwootSchema = z.object({
  role: roleUsuarioSchema.optional(),
  disponivel: z.boolean().optional(),
  disponivel_em: z.string().datetime().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  contador_conversas_ativas: z.bigint().optional(),
  max_conversas_simultaneas: z.number().int().positive().optional(),
  ultima_sincronizacao: z.string().datetime().optional(),
  sincronizado: z.boolean().optional(),
  erro_sincronizacao: z.string().nullable().optional(),
  dados_sincronizados: z.record(z.unknown()).optional(),
});

export type UpdateUsuarioChatwootInput = z.infer<typeof updateUsuarioChatwootSchema>;

// =============================================================================
// Query Params
// =============================================================================

export interface ListarMapeamentosParams {
  limite?: number;
  offset?: number;
  tipo_entidade?: TipoEntidadeChatwoot;
  sincronizado?: boolean;
  chatwoot_account_id?: number;
}

export const listarMapeamentosSchema = z.object({
  limite: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  tipo_entidade: tipoEntidadeChatwootSchema.optional(),
  sincronizado: z.boolean().optional(),
  chatwoot_account_id: z.number().int().positive().optional(),
});

export interface ListarConversasParams {
  limite?: number;
  offset?: number;
  status?: StatusConversa;
  sincronizado?: boolean;
  chatwoot_account_id?: number;
  mapeamento_partes_chatwoot_id?: number;
}

export interface ListarUsuariosParams {
  limite?: number;
  offset?: number;
  role?: RoleUsuario;
  disponivel?: boolean;
  chatwoot_account_id?: number;
  sincronizado?: boolean;
}

// =============================================================================
// Dados de sincronização
// =============================================================================

export interface DadosSincronizados {
  nome: string;
  email: string | null;
  telefone: string | null;
  identifier: string | null;
  tipo_pessoa: 'pf' | 'pj';
  tipo_entidade: TipoEntidadeChatwoot;
  labels: string[];
  custom_attributes: Record<string, unknown>;
  sincronizado_em: string;
}

// =============================================================================
// Resultado de sincronização
// =============================================================================

export interface SincronizacaoResult {
  sucesso: boolean;
  mapeamento: PartesChatwoot | null;
  chatwoot_contact_id: number | null;
  criado: boolean;
  erro?: string;
}

// =============================================================================
// Funções utilitárias
// =============================================================================

/**
 * Normaliza número de telefone para formato internacional
 * @example formatarTelefoneInternacional('11', '999999999') => '+5511999999999'
 */
export function formatarTelefoneInternacional(
  ddd: string | null | undefined,
  numero: string | null | undefined
): string | null {
  if (!ddd || !numero) return null;

  // Remove caracteres não numéricos
  const dddLimpo = ddd.replace(/\D/g, '');
  const numeroLimpo = numero.replace(/\D/g, '');

  if (!dddLimpo || !numeroLimpo) return null;

  // Formato: +55DDDNUMERO
  return `+55${dddLimpo}${numeroLimpo}`;
}

/**
 * Normaliza documento (CPF/CNPJ) para uso como identifier
 * Remove pontuação e mantém apenas dígitos
 */
export function normalizarDocumentoParaIdentifier(
  documento: string | null | undefined
): string | null {
  if (!documento) return null;
  return documento.replace(/\D/g, '');
}

/**
 * Obtém primeiro email de um array de emails
 */
export function obterPrimeiroEmail(
  emails: string[] | null | undefined
): string | null {
  if (!emails || emails.length === 0) return null;
  return emails[0];
}

/**
 * Verifica se dois objetos de dados sincronizados são diferentes
 * Usado para detectar mudanças e decidir se precisa sincronizar
 */
export function dadosModificados(
  anterior: Record<string, unknown>,
  atual: Record<string, unknown>
): boolean {
  const camposComparar = ['nome', 'email', 'telefone', 'identifier'];

  for (const campo of camposComparar) {
    if (anterior[campo] !== atual[campo]) {
      return true;
    }
  }

  return false;
}
