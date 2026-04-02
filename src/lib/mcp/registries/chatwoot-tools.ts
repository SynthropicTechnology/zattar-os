/**
 * Registro de Ferramentas MCP - Chatwoot Contacts & Conversations
 *
 * Tools disponíveis - Contatos:
 * - chatwoot_listar_contatos: Lista contatos do Chatwoot
 * - chatwoot_buscar_contato: Busca contato por ID ou termo
 * - chatwoot_criar_contato: Cria novo contato
 * - chatwoot_atualizar_contato: Atualiza contato existente
 * - chatwoot_excluir_contato: Remove contato
 * - chatwoot_sincronizar_parte: Sincroniza parte local com Chatwoot
 * - chatwoot_vincular_parte_contato: Vincula parte a contato existente
 * - chatwoot_listar_labels_contato: Lista labels de um contato
 * - chatwoot_atualizar_labels_contato: Atualiza labels de um contato
 * - chatwoot_mesclar_contatos: Mescla dois contatos
 *
 * Tools disponíveis - Conversas:
 * - chatwoot_listar_conversas: Lista conversas com filtros
 * - chatwoot_buscar_conversas_contato: Busca conversas de um contato
 * - chatwoot_ver_mensagens: Visualiza mensagens de uma conversa
 * - chatwoot_metricas_conversas: Obtém métricas de conversas
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';
import {
  isChatwootConfigured,
  listContacts,
  getContact,
  searchContacts,
  createContact,
  updateContact,
  deleteContact,
  mergeContacts,
  listContactLabels,
  updateContactLabels,
  ChatwootContactSortField,
  // Conversations
  listConversations,
  getConversationCounts,
  getContactConversations,
  // Messages
  getTextMessages,
  formatConversationForAI,
  ChatwootConversationStatus,
} from '@/lib/chatwoot';
import {
  sincronizarParteComChatwoot,
  vincularParteAContato,
  findMapeamentoPorEntidade,
  listarMapeamentos,
} from '@/lib/chatwoot';
import { findClienteById, findParteContrariaById, findTerceiroById } from '@/app/app/partes/server';

/**
 * Registra ferramentas MCP do módulo Chatwoot
 */
export async function registerChatwootTools(): Promise<void> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    console.warn('[MCP] Chatwoot não configurado - tools não serão registradas');
    return;
  }

  /**
   * Lista contatos do Chatwoot com paginação
   */
  registerMcpTool({
    name: 'chatwoot_listar_contatos',
    description: 'Lista contatos do Chatwoot com paginação e ordenação',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().int().min(1).default(1).describe('Número da página (começa em 1)'),
      ordenar_por: z
        .enum(['name', 'email', 'phone_number', 'last_activity_at', '-name', '-email', '-phone_number', '-last_activity_at'])
        .optional()
        .describe('Campo para ordenação (prefixo - para decrescente)'),
    }),
    handler: async (args) => {
      try {
        const { pagina, ordenar_por } = args as { pagina: number; ordenar_por?: string };

        const result = await listContacts({
          page: pagina,
          sort: ordenar_por as ChatwootContactSortField | undefined,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          contatos: result.data.payload.map((c) => ({
            id: c.id,
            nome: c.name,
            email: c.email,
            telefone: c.phone_number,
            identifier: c.identifier,
            bloqueado: c.blocked,
            ultima_atividade: c.last_activity_at,
            custom_attributes: c.custom_attributes,
          })),
          paginacao: {
            total: result.data.meta.count,
            pagina_atual: result.data.meta.current_page,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar contatos');
      }
    },
  });

  /**
   * Busca contato por ID ou termo
   */
  registerMcpTool({
    name: 'chatwoot_buscar_contato',
    description: 'Busca contato no Chatwoot por ID numérico ou termo de pesquisa (nome, email, telefone, CPF/CNPJ)',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().optional().describe('ID numérico do contato no Chatwoot'),
      termo: z.string().optional().describe('Termo de busca (nome, email, telefone, CPF/CNPJ)'),
    }),
    handler: async (args) => {
      try {
        const { id, termo } = args as { id?: number; termo?: string };

        if (!id && !termo) {
          return errorResult('Forneça id ou termo para busca');
        }

        if (id) {
          const result = await getContact(id);

          if (!result.success) {
            return errorResult(result.error.message);
          }

          return jsonResult({
            contato: {
              id: result.data.id,
              nome: result.data.name,
              email: result.data.email,
              telefone: result.data.phone_number,
              identifier: result.data.identifier,
              bloqueado: result.data.blocked,
              ultima_atividade: result.data.last_activity_at,
              criado_em: result.data.created_at,
              custom_attributes: result.data.custom_attributes,
              inboxes: result.data.contact_inboxes.map((ci) => ({
                id: ci.inbox.id,
                nome: ci.inbox.name,
                tipo: ci.inbox.channel_type,
              })),
            },
          });
        }

        // Busca por termo
        const result = await searchContacts({ q: termo! });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        if (result.data.payload.length === 0) {
          return jsonResult({
            mensagem: 'Nenhum contato encontrado',
            contatos: [],
          });
        }

        return jsonResult({
          contatos: result.data.payload.map((c) => ({
            id: c.id,
            nome: c.name,
            email: c.email,
            telefone: c.phone_number,
            identifier: c.identifier,
          })),
          total: result.data.meta.count,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar contato');
      }
    },
  });

  /**
   * Cria novo contato no Chatwoot
   */
  registerMcpTool({
    name: 'chatwoot_criar_contato',
    description: 'Cria novo contato no Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      nome: z.string().min(1).describe('Nome do contato'),
      email: z.string().email().optional().describe('Email do contato'),
      telefone: z.string().optional().describe('Telefone (formato +55DDDNUMERO)'),
      identifier: z.string().optional().describe('Identificador único (CPF/CNPJ)'),
      inbox_id: z.number().int().positive().optional().describe('ID do inbox (usa padrão se não informado)'),
    }),
    handler: async (args) => {
      try {
        const { nome, email, telefone, identifier, inbox_id } = args as {
          nome: string;
          email?: string;
          telefone?: string;
          identifier?: string;
          inbox_id?: number;
        };

        const result = await createContact({
          inbox_id,
          name: nome,
          email,
          phone_number: telefone,
          identifier,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          mensagem: 'Contato criado com sucesso',
          contato: {
            id: result.data.id,
            nome: result.data.name,
            email: result.data.email,
            telefone: result.data.phone_number,
            identifier: result.data.identifier,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar contato');
      }
    },
  });

  /**
   * Atualiza contato existente
   */
  registerMcpTool({
    name: 'chatwoot_atualizar_contato',
    description: 'Atualiza dados de um contato existente no Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do contato no Chatwoot'),
      nome: z.string().optional().describe('Novo nome'),
      email: z.string().email().optional().describe('Novo email'),
      telefone: z.string().optional().describe('Novo telefone'),
      identifier: z.string().optional().describe('Novo identifier'),
      bloqueado: z.boolean().optional().describe('Bloquear/desbloquear contato'),
    }),
    handler: async (args) => {
      try {
        const { id, nome, email, telefone, identifier, bloqueado } = args as {
          id: number;
          nome?: string;
          email?: string;
          telefone?: string;
          identifier?: string;
          bloqueado?: boolean;
        };

        const result = await updateContact(id, {
          name: nome,
          email,
          phone_number: telefone,
          identifier,
          blocked: bloqueado,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          mensagem: 'Contato atualizado com sucesso',
          contato: {
            id: result.data.id,
            nome: result.data.name,
            email: result.data.email,
            telefone: result.data.phone_number,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar contato');
      }
    },
  });

  /**
   * Exclui contato
   */
  registerMcpTool({
    name: 'chatwoot_excluir_contato',
    description: 'Remove um contato do Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do contato a ser excluído'),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };

        const result = await deleteContact(id);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          mensagem: `Contato ${id} excluído com sucesso`,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao excluir contato');
      }
    },
  });

  /**
   * Sincroniza parte local com Chatwoot
   */
  registerMcpTool({
    name: 'chatwoot_sincronizar_parte',
    description: 'Sincroniza uma parte local (cliente, parte contrária ou terceiro) com o Chatwoot. Cria ou atualiza o contato correspondente.',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      tipo_entidade: z.enum(['cliente', 'parte_contraria', 'terceiro']).describe('Tipo da entidade local'),
      entidade_id: z.number().int().positive().describe('ID da entidade no sistema local'),
    }),
    handler: async (args) => {
      try {
        const { tipo_entidade, entidade_id } = args as {
          tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
          entidade_id: number;
        };

        // Busca a parte local
        let parteResult;
        let terceiroInfo;

        switch (tipo_entidade) {
          case 'cliente':
            parteResult = await findClienteById(entidade_id);
            break;
          case 'parte_contraria':
            parteResult = await findParteContrariaById(entidade_id);
            break;
          case 'terceiro':
            parteResult = await findTerceiroById(entidade_id);
            if (parteResult.success && parteResult.data) {
              terceiroInfo = { tipo_parte: (parteResult.data as { tipo_parte?: string }).tipo_parte };
            }
            break;
        }

        if (!parteResult.success) {
          return errorResult(parteResult.error.message);
        }

        if (!parteResult.data) {
          return errorResult(`${tipo_entidade} com ID ${entidade_id} não encontrado`);
        }

        // Sincroniza com Chatwoot
        const syncResult = await sincronizarParteComChatwoot(
          parteResult.data as Parameters<typeof sincronizarParteComChatwoot>[0],
          tipo_entidade,
          terceiroInfo
        );

        if (!syncResult.success) {
          return errorResult(syncResult.error.message);
        }

        const { sucesso, chatwoot_contact_id, criado, erro } = syncResult.data;

        if (!sucesso) {
          return errorResult(erro ?? 'Falha na sincronização');
        }

        return jsonResult({
          mensagem: criado
            ? `Contato criado no Chatwoot (ID: ${chatwoot_contact_id})`
            : `Contato atualizado no Chatwoot (ID: ${chatwoot_contact_id})`,
          chatwoot_contact_id,
          criado,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao sincronizar parte');
      }
    },
  });

  /**
   * Vincula parte a contato existente
   */
  registerMcpTool({
    name: 'chatwoot_vincular_parte_contato',
    description: 'Vincula uma parte local a um contato já existente no Chatwoot (sem criar novo contato)',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      tipo_entidade: z.enum(['cliente', 'parte_contraria', 'terceiro']).describe('Tipo da entidade local'),
      entidade_id: z.number().int().positive().describe('ID da entidade no sistema local'),
      chatwoot_contact_id: z.number().int().positive().describe('ID do contato no Chatwoot'),
    }),
    handler: async (args) => {
      try {
        const { tipo_entidade, entidade_id, chatwoot_contact_id } = args as {
          tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
          entidade_id: number;
          chatwoot_contact_id: number;
        };

        const result = await vincularParteAContato(
          tipo_entidade,
          entidade_id,
          chatwoot_contact_id
        );

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          mensagem: `${tipo_entidade} ${entidade_id} vinculado ao contato Chatwoot ${chatwoot_contact_id}`,
          mapeamento_id: result.data.id,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao vincular parte a contato');
      }
    },
  });

  /**
   * Lista labels de um contato
   */
  registerMcpTool({
    name: 'chatwoot_listar_labels_contato',
    description: 'Lista todas as labels associadas a um contato no Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      contact_id: z.number().int().positive().describe('ID do contato no Chatwoot'),
    }),
    handler: async (args) => {
      try {
        const { contact_id } = args as { contact_id: number };

        const result = await listContactLabels(contact_id);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          contact_id,
          labels: result.data,
          total: result.data.length,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar labels');
      }
    },
  });

  /**
   * Atualiza labels de um contato
   */
  registerMcpTool({
    name: 'chatwoot_atualizar_labels_contato',
    description: 'Atualiza as labels de um contato no Chatwoot (substitui todas as labels existentes)',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      contact_id: z.number().int().positive().describe('ID do contato no Chatwoot'),
      labels: z.array(z.string()).describe('Nova lista de labels'),
    }),
    handler: async (args) => {
      try {
        const { contact_id, labels } = args as { contact_id: number; labels: string[] };

        const result = await updateContactLabels(contact_id, labels);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          mensagem: 'Labels atualizadas com sucesso',
          contact_id,
          labels: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar labels');
      }
    },
  });

  /**
   * Mescla dois contatos
   */
  registerMcpTool({
    name: 'chatwoot_mesclar_contatos',
    description: 'Mescla dois contatos do Chatwoot. O contato base recebe os dados do contato mesclado, que é excluído.',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      base_contact_id: z.number().int().positive().describe('ID do contato que permanecerá (base)'),
      mergee_contact_id: z.number().int().positive().describe('ID do contato a ser mesclado e excluído'),
    }),
    handler: async (args) => {
      try {
        const { base_contact_id, mergee_contact_id } = args as {
          base_contact_id: number;
          mergee_contact_id: number;
        };

        const result = await mergeContacts({
          base_contact_id,
          mergee_contact_id,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          mensagem: `Contato ${mergee_contact_id} mesclado ao contato ${base_contact_id}`,
          contato_resultante: {
            id: result.data.id,
            nome: result.data.name,
            email: result.data.email,
            telefone: result.data.phone_number,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao mesclar contatos');
      }
    },
  });

  /**
   * Verifica mapeamento de uma parte
   */
  registerMcpTool({
    name: 'chatwoot_verificar_vinculo',
    description: 'Verifica se uma parte local está vinculada a um contato no Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      tipo_entidade: z.enum(['cliente', 'parte_contraria', 'terceiro']).describe('Tipo da entidade local'),
      entidade_id: z.number().int().positive().describe('ID da entidade no sistema local'),
    }),
    handler: async (args) => {
      try {
        const { tipo_entidade, entidade_id } = args as {
          tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
          entidade_id: number;
        };

        const result = await findMapeamentoPorEntidade(tipo_entidade, entidade_id);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        if (!result.data) {
          return jsonResult({
            vinculado: false,
            mensagem: `${tipo_entidade} ${entidade_id} não está vinculado ao Chatwoot`,
          });
        }

        return jsonResult({
          vinculado: true,
          chatwoot_contact_id: result.data.chatwoot_contact_id,
          ultima_sincronizacao: result.data.ultima_sincronizacao,
          sincronizado: result.data.sincronizado,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao verificar vínculo');
      }
    },
  });

  /**
   * Lista mapeamentos partes-chatwoot
   */
  registerMcpTool({
    name: 'chatwoot_listar_mapeamentos',
    description: 'Lista todos os mapeamentos entre partes locais e contatos do Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().int().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().int().min(0).default(0).describe('Offset para paginação'),
      tipo_entidade: z.enum(['cliente', 'parte_contraria', 'terceiro']).optional().describe('Filtrar por tipo de entidade'),
      sincronizado: z.boolean().optional().describe('Filtrar por status de sincronização'),
    }),
    handler: async (args) => {
      try {
        const { limite, offset, tipo_entidade, sincronizado } = args as {
          limite: number;
          offset: number;
          tipo_entidade?: 'cliente' | 'parte_contraria' | 'terceiro';
          sincronizado?: boolean;
        };

        const result = await listarMapeamentos({
          limite,
          offset,
          tipo_entidade,
          sincronizado,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          mapeamentos: result.data.data.map((m) => ({
            id: m.id,
            tipo_entidade: m.tipo_entidade,
            entidade_id: m.entidade_id,
            chatwoot_contact_id: m.chatwoot_contact_id,
            sincronizado: m.sincronizado,
            ultima_sincronizacao: m.ultima_sincronizacao,
          })),
          paginacao: {
            total: result.data.pagination.total,
            pagina: result.data.pagination.page,
            por_pagina: result.data.pagination.limit,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar mapeamentos');
      }
    },
  });

  // =========================================================================
  // CONVERSATIONS TOOLS
  // =========================================================================

  /**
   * Lista conversas do Chatwoot
   */
  registerMcpTool({
    name: 'chatwoot_listar_conversas',
    description: 'Lista conversas do Chatwoot com filtros por status, inbox, team e labels',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      status: z
        .enum(['open', 'resolved', 'pending', 'snoozed', 'all'])
        .default('open')
        .describe('Status da conversa'),
      assignee_type: z
        .enum(['me', 'unassigned', 'all', 'assigned'])
        .default('all')
        .describe('Tipo de atribuição'),
      inbox_id: z.number().int().positive().optional().describe('ID do inbox'),
      team_id: z.number().int().positive().optional().describe('ID do time'),
      pagina: z.number().int().min(1).default(1).describe('Número da página'),
    }),
    handler: async (args) => {
      try {
        const { status, assignee_type, inbox_id, team_id, pagina } = args as {
          status: ChatwootConversationStatus;
          assignee_type: 'me' | 'unassigned' | 'all' | 'assigned';
          inbox_id?: number;
          team_id?: number;
          pagina: number;
        };

        const result = await listConversations({
          status,
          assignee_type,
          inbox_id,
          team_id,
          page: pagina,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          conversas: result.data.conversations.map((c) => ({
            id: c.id,
            uuid: c.uuid,
            status: c.status,
            labels: c.labels,
            contato: {
              id: c.meta.sender.id,
              nome: c.meta.sender.name,
              email: c.meta.sender.email,
              telefone: c.meta.sender.phone_number,
            },
            agente: c.meta.assignee ? {
              id: c.meta.assignee.id,
              nome: c.meta.assignee.name,
            } : null,
            mensagens_nao_lidas: c.unread_count,
            ultima_atividade: c.last_activity_at,
            criado_em: c.created_at,
          })),
          metricas: {
            minhas: result.data.meta.mine_count,
            nao_atribuidas: result.data.meta.unassigned_count,
            atribuidas: result.data.meta.assigned_count,
            todas: result.data.meta.all_count,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar conversas');
      }
    },
  });

  /**
   * Busca conversas de um contato específico
   */
  registerMcpTool({
    name: 'chatwoot_buscar_conversas_contato',
    description: 'Busca todas as conversas de um contato específico no Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      contact_id: z.number().int().positive().describe('ID do contato no Chatwoot'),
      status: z
        .enum(['open', 'resolved', 'pending', 'all'])
        .default('all')
        .describe('Filtrar por status'),
    }),
    handler: async (args) => {
      try {
        const { contact_id, status } = args as {
          contact_id: number;
          status: 'open' | 'resolved' | 'pending' | 'all';
        };

        const result = await getContactConversations(contact_id, status);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        if (result.data.length === 0) {
          return jsonResult({
            mensagem: 'Nenhuma conversa encontrada para este contato',
            conversas: [],
          });
        }

        return jsonResult({
          contact_id,
          total: result.data.length,
          conversas: result.data.map((c) => ({
            id: c.id,
            status: c.status,
            labels: c.labels,
            mensagens_nao_lidas: c.unread_count,
            ultima_mensagem: c.last_non_activity_message?.content?.substring(0, 100),
            ultima_atividade: c.last_activity_at,
            criado_em: c.created_at,
          })),
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar conversas do contato');
      }
    },
  });

  /**
   * Visualiza mensagens de uma conversa
   */
  registerMcpTool({
    name: 'chatwoot_ver_mensagens',
    description: 'Visualiza as mensagens de uma conversa específica no Chatwoot',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      conversation_id: z.number().int().positive().describe('ID da conversa'),
      limite: z.number().int().min(1).max(100).default(50).describe('Número máximo de mensagens'),
      formato: z
        .enum(['detalhado', 'resumido', 'texto'])
        .default('resumido')
        .describe('Formato de saída: detalhado (todos os campos), resumido (principais), texto (formatado para leitura)'),
    }),
    handler: async (args) => {
      try {
        const { conversation_id, limite, formato } = args as {
          conversation_id: number;
          limite: number;
          formato: 'detalhado' | 'resumido' | 'texto';
        };

        if (formato === 'texto') {
          const result = await formatConversationForAI(conversation_id, limite);

          if (!result.success) {
            return errorResult(result.error.message);
          }

          return jsonResult({
            conversation_id,
            formato: 'texto',
            historico: result.data,
          });
        }

        const result = await getTextMessages(conversation_id, limite);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        if (formato === 'resumido') {
          return jsonResult({
            conversation_id,
            total: result.data.length,
            mensagens: result.data.map((m) => ({
              id: m.id,
              tipo: m.message_type === 0 ? 'entrada' : 'saida',
              remetente: m.sender_type === 'contact' ? 'cliente' : 'agente',
              conteudo: m.content,
              data: new Date(m.created_at * 1000).toLocaleString('pt-BR'),
            })),
          });
        }

        // Formato detalhado
        return jsonResult({
          conversation_id,
          total: result.data.length,
          mensagens: result.data.map((m) => ({
            id: m.id,
            message_type: m.message_type,
            sender_type: m.sender_type,
            sender_id: m.sender_id,
            content: m.content,
            content_type: m.content_type,
            status: m.status,
            private: m.private,
            attachment: m.attachment,
            created_at: m.created_at,
            updated_at: m.updated_at,
          })),
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar mensagens');
      }
    },
  });

  /**
   * Métricas de conversas
   */
  registerMcpTool({
    name: 'chatwoot_metricas_conversas',
    description: 'Obtém métricas e contagens de conversas do Chatwoot por status',
    feature: 'chatwoot',
    requiresAuth: true,
    schema: z.object({
      inbox_id: z.number().int().positive().optional().describe('Filtrar por inbox'),
      team_id: z.number().int().positive().optional().describe('Filtrar por time'),
    }),
    handler: async (args) => {
      try {
        const { inbox_id, team_id } = args as {
          inbox_id?: number;
          team_id?: number;
        };

        const result = await getConversationCounts({ inbox_id, team_id });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          metricas: {
            minhas: result.data.mine_count,
            nao_atribuidas: result.data.unassigned_count,
            atribuidas: result.data.assigned_count,
            todas: result.data.all_count,
          },
          filtros_aplicados: {
            inbox_id: inbox_id ?? null,
            team_id: team_id ?? null,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar métricas');
      }
    },
  });
}
