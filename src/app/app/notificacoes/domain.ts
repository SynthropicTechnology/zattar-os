/**
 * NOTIFICAÇÕES DOMAIN - Entidades e Schemas de Validação
 *
 * Módulo para gerenciamento de notificações de usuários.
 *
 * CONVENÇÕES:
 * - Prefixar schemas de criação com "create" (ex: createNotificacaoSchema)
 * - Prefixar schemas de atualização com "update" (ex: updateNotificacaoSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 * - NUNCA importar React/Next.js aqui
 */

import { z } from "zod";

// =============================================================================
// TIPOS BASE (ENUMS)
// =============================================================================

/**
 * Tipo de notificação de usuário
 */
export type TipoNotificacaoUsuario =
  | "processo_atribuido"
  | "processo_movimentacao"
  | "audiencia_atribuida"
  | "audiencia_alterada"
  | "expediente_atribuido"
  | "expediente_alterado"
  | "prazo_vencendo"
  | "prazo_vencido";

/**
 * Tipo de entidade relacionada à notificação
 */
export type EntidadeTipo = "processo" | "audiencia" | "expediente" | "pericia";

// =============================================================================
// SCHEMAS ZOD
// =============================================================================

/**
 * Schema para criar notificação
 */
export const createNotificacaoSchema = z.object({
  usuario_id: z.number().int().positive(),
  tipo: z.enum([
    "processo_atribuido",
    "processo_movimentacao",
    "audiencia_atribuida",
    "audiencia_alterada",
    "expediente_atribuido",
    "expediente_alterado",
    "prazo_vencendo",
    "prazo_vencido",
  ]),
  titulo: z.string().min(1).max(200),
  descricao: z.string().min(1).max(1000),
  entidade_tipo: z.enum(["processo", "audiencia", "expediente", "pericia"]),
  entidade_id: z.number().int().positive(),
  dados_adicionais: z.record(z.unknown()).optional().default({}),
});

/**
 * Schema para atualizar notificação (marcar como lida)
 */
export const updateNotificacaoSchema = z.object({
  lida: z.boolean().optional(),
  lida_em: z.date().optional(),
});

/**
 * Schema para listar notificações
 */
export const listarNotificacoesSchema = z.object({
  pagina: z.number().int().positive().optional(),
  limite: z.number().int().positive().max(100).optional(),
  lida: z.boolean().optional(),
  tipo: z
    .enum([
      "processo_atribuido",
      "processo_movimentacao",
      "audiencia_atribuida",
      "audiencia_alterada",
      "expediente_atribuido",
      "expediente_alterado",
      "prazo_vencendo",
      "prazo_vencido",
    ])
    .optional(),
});

// =============================================================================
// TIPOS TYPESCRIPT
// =============================================================================

/**
 * Notificação completa do banco de dados
 */
export interface Notificacao {
  id: number;
  usuario_id: number;
  tipo: TipoNotificacaoUsuario;
  titulo: string;
  descricao: string;
  entidade_tipo: EntidadeTipo;
  entidade_id: number;
  lida: boolean;
  lida_em: string | null;
  dados_adicionais: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Input para criar notificação
 */
export type CreateNotificacaoInput = z.infer<typeof createNotificacaoSchema>;

/**
 * Input para atualizar notificação
 */
export type UpdateNotificacaoInput = z.infer<typeof updateNotificacaoSchema>;

/**
 * Parâmetros para listar notificações
 */
export type ListarNotificacoesParams = z.infer<
  typeof listarNotificacoesSchema
>;

/**
 * Resposta paginada de notificações
 */
export interface NotificacoesPaginadas {
  notificacoes: Notificacao[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

/**
 * Contador de notificações não lidas
 */
export interface ContadorNotificacoes {
  total: number;
  por_tipo: Record<TipoNotificacaoUsuario, number>;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * Labels para tipos de notificação
 */
export const TIPO_NOTIFICACAO_LABELS: Record<
  TipoNotificacaoUsuario,
  string
> = {
  processo_atribuido: "Processo Atribuído",
  processo_movimentacao: "Movimentação em Processo",
  audiencia_atribuida: "Audiência Atribuída",
  audiencia_alterada: "Audiência Alterada",
  expediente_atribuido: "Expediente Atribuído",
  expediente_alterado: "Expediente Alterado",
  prazo_vencendo: "Prazo Vencendo",
  prazo_vencido: "Prazo Vencido",
};

/**
 * Ícones para tipos de notificação (lucide-react)
 */
export const TIPO_NOTIFICACAO_ICONES: Record<
  TipoNotificacaoUsuario,
  string
> = {
  processo_atribuido: "FileText",
  processo_movimentacao: "FileCheck",
  audiencia_atribuida: "Calendar",
  audiencia_alterada: "CalendarClock",
  expediente_atribuido: "Inbox",
  expediente_alterado: "InboxCheck",
  prazo_vencendo: "Clock",
  prazo_vencido: "AlertCircle",
};

