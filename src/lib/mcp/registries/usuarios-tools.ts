/**
 * Registro de Ferramentas MCP - Usuários
 *
 * Tools disponíveis:
 * - listar_usuarios: Lista usuários com filtros (busca, ativo, cargo)
 * - buscar_usuario_por_email: Busca usuário por email corporativo
 * - buscar_usuario_por_cpf: Busca usuário por CPF
 * - listar_permissoes_usuario: Lista permissões de um usuário
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Usuários
 */
export async function registerUsuariosTools(): Promise<void> {
  const {
    actionListarUsuarios,
    actionBuscarPorEmail,
    actionBuscarPorCpf,
  } = await import('@/app/(authenticated)/usuarios/actions/usuarios-actions');

  const {
    actionListarPermissoes,
  } = await import('@/app/(authenticated)/usuarios/actions/permissoes-actions');

  /**
   * Lista usuários do sistema com filtros por busca, status ativo e cargo
   */
  registerMcpTool({
    name: 'listar_usuarios',
    description: 'Lista usuários do sistema com filtros por busca, status ativo e cargo',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de usuários'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome, email ou CPF'),
      ativo: z.boolean().optional().describe('Filtrar por status ativo/inativo'),
      cargoId: z.number().optional().describe('Filtrar por cargo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarUsuarios(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar usuários');
      }
    },
  });

  /**
   * Busca usuário específico por endereço de email corporativo
   */
  registerMcpTool({
    name: 'buscar_usuario_por_email',
    description: 'Busca usuário específico por endereço de email corporativo',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      email: z.string().email().describe('Email corporativo do usuário'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarPorEmail(args.email);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar usuário por email');
      }
    },
  });

  /**
   * Busca usuário específico por CPF (apenas números)
   */
  registerMcpTool({
    name: 'buscar_usuario_por_cpf',
    description: 'Busca usuário específico por CPF (apenas números)',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().regex(/^\d{11}$/).describe('CPF do usuário (11 dígitos, apenas números)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarPorCpf(args.cpf);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar usuário por CPF');
      }
    },
  });

  /**
   * Lista todas as permissões de um usuário específico (recursos e operações)
   */
  registerMcpTool({
    name: 'listar_permissoes_usuario',
    description: 'Lista todas as permissões de um usuário específico (recursos e operações)',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      usuarioId: z.number().describe('ID do usuário'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarPermissoes(args.usuarioId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar permissões do usuário');
      }
    },
  });
}
