import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

const SYSTEM_USER_ID = process.env.SYSTEM_AGENT_USER_ID || '1';

/**
 * Registra todas as ferramentas MCP do Dify.
 * Inclui: chat, workflows, completion, knowledge base, e app info.
 */
export async function registerDifyTools(): Promise<void> {
  const { isDifyConfigured } = await import('@/lib/dify');

  if (!isDifyConfigured()) {
    console.warn('[MCP] Dify não configurado — tools não serão registradas');
    return;
  }

  // -------------------------------------------------------------------------
  // Chat Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_chat_enviar_mensagem',
    description:
      'Envia uma mensagem para o assistente de chat Dify e recebe a resposta. ' +
      'Pode continuar uma conversa existente passando o conversation_id.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      mensagem: z.string().min(1).describe('Mensagem para enviar ao assistente'),
      conversation_id: z.string().optional().describe('ID da conversa para continuar (vazio = nova conversa)'),
      inputs: z.record(z.string(), z.unknown()).optional().describe('Variáveis de entrada do app'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.enviarMensagemCompleta({
          query: args.mensagem,
          conversationId: args.conversation_id,
          inputs: args.inputs,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          resposta: result.value.answer,
          conversation_id: result.value.conversationId,
          message_id: result.value.messageId,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao enviar mensagem Dify');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_listar_conversas',
    description: 'Lista as conversas do usuário no Dify, ordenadas por data de atualização.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().int().min(1).max(100).default(20).describe('Máximo de conversas a retornar'),
      ordenar_por: z
        .enum(['created_at', '-created_at', 'updated_at', '-updated_at'])
        .default('-updated_at')
        .describe('Campo de ordenação'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarConversas({
          limite: args.limite || 20,
          ordenarPor: args.ordenar_por,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          conversas: result.value.conversas,
          tem_mais: result.value.temMais,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar conversas');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_obter_historico',
    description: 'Obtém o histórico de mensagens de uma conversa Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      conversation_id: z.string().min(1).describe('ID da conversa'),
      limite: z.number().int().min(1).max(100).default(20).describe('Máximo de mensagens a retornar'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterHistorico({
          conversationId: args.conversation_id,
          limite: args.limite || 20,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          mensagens: result.value.mensagens,
          tem_mais: result.value.temMais,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter histórico');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_enviar_feedback',
    description: 'Envia feedback (like/dislike) para uma mensagem do assistente Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      message_id: z.string().min(1).describe('ID da mensagem'),
      rating: z.enum(['like', 'dislike']).describe('Avaliação: like ou dislike'),
      conteudo: z.string().optional().describe('Comentário opcional sobre a resposta'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.enviarFeedback({
          message_id: args.message_id,
          rating: args.rating,
          content: args.conteudo,
        }, SYSTEM_USER_ID);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao enviar feedback');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_sugestoes',
    description: 'Obtém perguntas sugeridas após uma mensagem do assistente Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      message_id: z.string().min(1).describe('ID da mensagem para obter sugestões'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterSugestoes(args.message_id);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({ sugestoes: result.value });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter sugestões');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Workflow Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_workflow_executar',
    description:
      'Executa um workflow Dify com os parâmetros fornecidos. ' +
      'Retorna o resultado completo incluindo outputs, tokens usados e tempo de execução.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      inputs: z.record(z.string(), z.unknown()).describe('Variáveis de entrada do workflow'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.executarWorkflowCompleto({
          inputs: args.inputs,
        });

        if (result.isErr()) return errorResult(result.error.message);

        const exec = result.value;
        return jsonResult({
          workflow_run_id: exec.workflowRunId,
          status: exec.status,
          outputs: exec.outputs,
          total_tokens: exec.totalTokens,
          tempo_execucao: exec.tempoDecorrido,
          total_passos: exec.totalPassos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao executar workflow');
      }
    },
  });

  registerMcpTool({
    name: 'dify_workflow_parar',
    description: 'Para a execução de uma tarefa Dify em andamento.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      task_id: z.string().min(1).describe('ID da tarefa a ser parada'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.pararTarefa(args.task_id);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao parar tarefa');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Completion Tool
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_completion_gerar',
    description:
      'Gera uma completion de texto usando o Dify. ' +
      'Diferente do chat, não mantém contexto de conversa.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      inputs: z.record(z.string(), z.unknown()).describe('Variáveis de entrada para a completion'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.completar({ inputs: args.inputs });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          resposta: result.value.answer,
          message_id: result.value.messageId,
          uso: result.value.usage,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao gerar completion');
      }
    },
  });

  // -------------------------------------------------------------------------
  // App Info Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_app_info',
    description: 'Obtém informações do aplicativo Dify configurado (nome, descrição, tags).',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterInfoApp();

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter info do app');
      }
    },
  });

  registerMcpTool({
    name: 'dify_app_parametros',
    description:
      'Obtém os parâmetros do aplicativo Dify (formulários, mensagem de abertura, configurações).',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterParametrosApp();

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter parâmetros');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Knowledge Base Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_knowledge_listar_datasets',
    description: 'Lista os datasets (knowledge bases) disponíveis no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().int().min(1).default(1).describe('Número da página'),
      limite: z.number().int().min(1).max(100).default(20).describe('Itens por página'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarDatasets(args.pagina, args.limite);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          datasets: result.value.datasets,
          tem_mais: result.value.temMais,
          total: result.value.total,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar datasets');
      }
    },
  });

  registerMcpTool({
    name: 'dify_knowledge_criar_documento',
    description:
      'Cria um novo documento em um dataset (knowledge base) do Dify. ' +
      'O texto será indexado automaticamente para busca semântica.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset onde criar o documento'),
      nome: z.string().min(1).describe('Nome do documento'),
      texto: z.string().min(1).describe('Conteúdo do documento a ser indexado'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.criarDocumento({
          datasetId: args.dataset_id,
          nome: args.nome,
          texto: args.texto,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar documento');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Conversation Management Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_conversa_renomear',
    description: 'Renomeia uma conversa Dify ou auto-gera um nome baseado no conteúdo.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      conversation_id: z.string().min(1).describe('ID da conversa'),
      nome: z.string().optional().describe('Novo nome (vazio para auto-gerar)'),
      auto_generate: z.boolean().default(false).describe('Auto-gerar nome'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.renomearConversa(
          { conversationId: args.conversation_id, nome: args.nome, autoGenerate: args.auto_generate },
          SYSTEM_USER_ID
        );
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao renomear conversa');
      }
    },
  });

  registerMcpTool({
    name: 'dify_conversa_deletar',
    description: 'Exclui permanentemente uma conversa Dify e todo seu histórico.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      conversation_id: z.string().min(1).describe('ID da conversa a excluir'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.deletarConversa(args.conversation_id, SYSTEM_USER_ID);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar conversa');
      }
    },
  });

  registerMcpTool({
    name: 'dify_conversa_obter_variaveis',
    description: 'Obtém as variáveis de sessão de uma conversa Chatflow Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      conversation_id: z.string().min(1).describe('ID da conversa'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterVariaveisConversa(args.conversation_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter variáveis');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Completion Extended
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_completion_parar',
    description: 'Para uma geração de completion Dify em andamento.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      task_id: z.string().min(1).describe('ID da tarefa de completion'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.pararCompletion(args.task_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao parar completion');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Workflow Logs
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_workflow_listar_logs',
    description: 'Lista logs de execução de workflows Dify com filtros opcionais.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      keyword: z.string().optional().describe('Filtro por palavra-chave'),
      status: z.enum(['succeeded', 'failed', 'stopped', 'running']).optional().describe('Filtro por status'),
      pagina: z.number().int().min(1).default(1).describe('Página'),
      limite: z.number().int().min(1).max(100).default(20).describe('Itens por página'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarLogsWorkflow({
          keyword: args.keyword,
          status: args.status,
          page: args.pagina,
          limit: args.limite,
        });
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar logs');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Annotation Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_anotacao_listar',
    description: 'Lista todas as anotações (respostas diretas) configuradas no app Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().int().min(1).default(1).describe('Página'),
      limite: z.number().int().min(1).max(100).default(20).describe('Itens por página'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarAnotacoes(args.pagina, args.limite);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar anotações');
      }
    },
  });

  registerMcpTool({
    name: 'dify_anotacao_criar',
    description: 'Cria uma nova anotação (resposta direta) no Dify. Quando detectada similaridade, retorna essa resposta.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      pergunta: z.string().min(1).describe('Pergunta que ativa esta resposta'),
      resposta: z.string().min(1).describe('Resposta configurada'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.criarAnotacao(args);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar anotação');
      }
    },
  });

  registerMcpTool({
    name: 'dify_anotacao_atualizar',
    description: 'Atualiza uma anotação existente no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      anotacao_id: z.string().min(1).describe('ID da anotação'),
      pergunta: z.string().min(1).describe('Nova pergunta'),
      resposta: z.string().min(1).describe('Nova resposta'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.atualizarAnotacao(args.anotacao_id, {
          pergunta: args.pergunta,
          resposta: args.resposta,
        });
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar anotação');
      }
    },
  });

  registerMcpTool({
    name: 'dify_anotacao_deletar',
    description: 'Exclui uma anotação do Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      anotacao_id: z.string().min(1).describe('ID da anotação a excluir'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.deletarAnotacao(args.anotacao_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar anotação');
      }
    },
  });

  registerMcpTool({
    name: 'dify_anotacao_habilitar_reply',
    description: 'Habilita o sistema de resposta automática por anotações no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      embedding_provider: z.string().min(1).describe('Nome do provedor de embedding'),
      embedding_model: z.string().min(1).describe('Nome do modelo de embedding'),
      score_threshold: z.number().min(0).max(1).default(0.7).describe('Limiar de similaridade (0-1)'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.habilitarRespostaAnotacao({
          embeddingProviderName: args.embedding_provider,
          embeddingModelName: args.embedding_model,
          scoreThreshold: args.score_threshold ?? 0.7,
        });
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao habilitar anotação reply');
      }
    },
  });

  registerMcpTool({
    name: 'dify_anotacao_desabilitar_reply',
    description: 'Desabilita o sistema de resposta automática por anotações no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.desabilitarRespostaAnotacao();
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao desabilitar anotação reply');
      }
    },
  });

  registerMcpTool({
    name: 'dify_anotacao_status_reply',
    description: 'Consulta o status do job de habilitação/desabilitação de anotações Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      action: z.enum(['enable', 'disable']).describe('Ação do job'),
      job_id: z.string().min(1).describe('ID do job'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterStatusRespostaAnotacao(args.action, args.job_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter status');
      }
    },
  });

  // -------------------------------------------------------------------------
  // App Feedbacks
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_app_listar_feedbacks',
    description: 'Lista todos os feedbacks recebidos pelo app Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().int().min(1).default(1).describe('Página'),
      limite: z.number().int().min(1).max(100).default(20).describe('Itens por página'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarFeedbacksApp(args.pagina, args.limite);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar feedbacks');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Knowledge Base Extended
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_knowledge_buscar_dataset',
    description: 'Busca semântica em um dataset Dify. Testa a recuperação de chunks por similaridade.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      query: z.string().min(1).describe('Texto de busca'),
      search_method: z.enum(['keyword_search', 'semantic_search', 'full_text_search', 'hybrid_search']).default('semantic_search').describe('Método de busca'),
      top_k: z.number().int().min(1).max(100).default(5).describe('Número máximo de resultados'),
      score_threshold: z.number().min(0).max(1).optional().describe('Limiar de score mínimo'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.buscarDataset({
          datasetId: args.dataset_id,
          query: args.query,
          searchMethod: args.search_method,
          topK: args.top_k,
          scoreThreshold: args.score_threshold,
        });
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar no dataset');
      }
    },
  });

  registerMcpTool({
    name: 'dify_knowledge_obter_documento',
    description: 'Obtém detalhes de um documento específico na knowledge base Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      document_id: z.string().min(1).describe('ID do documento'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterDetalheDocumento(args.document_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter documento');
      }
    },
  });

  registerMcpTool({
    name: 'dify_knowledge_atualizar_documento_texto',
    description: 'Atualiza o conteúdo de texto de um documento na knowledge base Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      document_id: z.string().min(1).describe('ID do documento'),
      nome: z.string().optional().describe('Novo nome do documento'),
      texto: z.string().optional().describe('Novo conteúdo de texto'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.atualizarDocumentoTexto(args.document_id, {
          nome: args.nome,
          texto: args.texto,
        });
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar documento');
      }
    },
  });

  registerMcpTool({
    name: 'dify_knowledge_status_embedding',
    description: 'Consulta o status de embedding/indexação de um batch de documentos Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      batch: z.string().min(1).describe('ID do batch'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterStatusEmbedding(args.dataset_id, args.batch);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter status embedding');
      }
    },
  });

  registerMcpTool({
    name: 'dify_knowledge_atualizar_status_batch',
    description: 'Habilita ou desabilita documentos em batch na knowledge base Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      document_ids: z.array(z.string()).min(1).describe('IDs dos documentos'),
      habilitado: z.boolean().describe('true para habilitar, false para desabilitar'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.atualizarStatusDocumentos(args.document_ids, args.habilitado);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar status');
      }
    },
  });

  registerMcpTool({
    name: 'dify_knowledge_deletar_documento',
    description: 'Exclui permanentemente um documento da knowledge base Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      document_id: z.string().min(1).describe('ID do documento a excluir'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.deletarDocumento(args.dataset_id, args.document_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar documento');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Segment Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_segmento_listar',
    description: 'Lista os segmentos (chunks) de um documento na knowledge base Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      document_id: z.string().min(1).describe('ID do documento'),
      keyword: z.string().optional().describe('Filtro por palavra-chave'),
      status: z.string().optional().describe('Filtro por status (completed, indexing, error)'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarSegmentos(args.dataset_id, args.document_id, {
          keyword: args.keyword,
          status: args.status,
        });
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar segmentos');
      }
    },
  });

  registerMcpTool({
    name: 'dify_segmento_criar',
    description: 'Adiciona novos segmentos a um documento na knowledge base Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      document_id: z.string().min(1).describe('ID do documento'),
      segmentos: z.array(z.object({
        content: z.string().min(1).describe('Conteúdo do segmento'),
        answer: z.string().optional().describe('Resposta (modo Q&A)'),
        keywords: z.array(z.string()).optional().describe('Palavras-chave'),
      })).min(1).describe('Lista de segmentos a criar'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.criarSegmentos(args.dataset_id, args.document_id, args.segmentos);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar segmentos');
      }
    },
  });

  registerMcpTool({
    name: 'dify_segmento_atualizar',
    description: 'Atualiza um segmento específico de um documento no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      document_id: z.string().min(1).describe('ID do documento'),
      segment_id: z.string().min(1).describe('ID do segmento'),
      content: z.string().min(1).describe('Novo conteúdo'),
      answer: z.string().optional().describe('Nova resposta (modo Q&A)'),
      keywords: z.array(z.string()).optional().describe('Novas palavras-chave'),
      enabled: z.boolean().optional().describe('Habilitar/desabilitar segmento'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.atualizarSegmento(
          args.dataset_id, args.document_id, args.segment_id,
          { content: args.content, answer: args.answer, keywords: args.keywords, enabled: args.enabled }
        );
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar segmento');
      }
    },
  });

  registerMcpTool({
    name: 'dify_segmento_deletar',
    description: 'Exclui um segmento de um documento no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      document_id: z.string().min(1).describe('ID do documento'),
      segment_id: z.string().min(1).describe('ID do segmento a excluir'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.deletarSegmento(args.dataset_id, args.document_id, args.segment_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar segmento');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Chunk Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_chunk_obter',
    description: 'Obtém detalhes de um chunk específico no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      chunk_id: z.string().min(1).describe('ID do chunk'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterDetalheChunk(args.chunk_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter chunk');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chunk_atualizar',
    description: 'Atualiza o conteúdo de um chunk no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      chunk_id: z.string().min(1).describe('ID do chunk'),
      content: z.string().min(1).describe('Novo conteúdo do chunk'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.atualizarChunk(args.chunk_id, args.content);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar chunk');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chunk_deletar',
    description: 'Exclui um chunk no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      chunk_id: z.string().min(1).describe('ID do chunk a excluir'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.deletarChunk(args.chunk_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar chunk');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chunk_filho_criar',
    description: 'Cria um chunk filho dentro de um chunk pai no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      chunk_id: z.string().min(1).describe('ID do chunk pai'),
      content: z.string().min(1).describe('Conteúdo do chunk filho'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.criarChunkFilho(args.chunk_id, args.content);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar chunk filho');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chunk_filho_listar',
    description: 'Lista os chunks filhos de um chunk pai no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      chunk_id: z.string().min(1).describe('ID do chunk pai'),
      pagina: z.number().int().min(1).default(1).describe('Página'),
      limite: z.number().int().min(1).max(100).default(20).describe('Itens por página'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarChunksFilhos(args.chunk_id, args.pagina, args.limite);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar chunks filhos');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chunk_filho_atualizar',
    description: 'Atualiza um chunk filho no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      parent_chunk_id: z.string().min(1).describe('ID do chunk pai'),
      child_chunk_id: z.string().min(1).describe('ID do chunk filho'),
      content: z.string().min(1).describe('Novo conteúdo'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.atualizarChunkFilho(args.parent_chunk_id, args.child_chunk_id, args.content);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar chunk filho');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chunk_filho_deletar',
    description: 'Exclui um chunk filho no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      parent_chunk_id: z.string().min(1).describe('ID do chunk pai'),
      child_chunk_id: z.string().min(1).describe('ID do chunk filho a excluir'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.deletarChunkFilho(args.parent_chunk_id, args.child_chunk_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar chunk filho');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Tag Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_tag_listar',
    description: 'Lista todas as tags de knowledge base no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      tipo: z.string().optional().describe('Filtrar por tipo de tag'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarTags(args.tipo);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar tags');
      }
    },
  });

  registerMcpTool({
    name: 'dify_tag_criar',
    description: 'Cria uma nova tag de knowledge base no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      nome: z.string().min(1).describe('Nome da tag'),
      tipo: z.string().optional().describe('Tipo da tag'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.criarTag({ nome: args.nome, tipo: args.tipo });
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar tag');
      }
    },
  });

  registerMcpTool({
    name: 'dify_tag_atualizar',
    description: 'Renomeia uma tag de knowledge base no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      tag_id: z.string().min(1).describe('ID da tag'),
      nome: z.string().min(1).describe('Novo nome da tag'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.atualizarTag(args.tag_id, args.nome);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar tag');
      }
    },
  });

  registerMcpTool({
    name: 'dify_tag_deletar',
    description: 'Exclui uma tag de knowledge base no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      tag_id: z.string().min(1).describe('ID da tag a excluir'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.deletarTag(args.tag_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar tag');
      }
    },
  });

  registerMcpTool({
    name: 'dify_tag_vincular_dataset',
    description: 'Associa tags a um dataset (knowledge base) no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      tag_ids: z.array(z.string()).min(1).describe('IDs das tags a vincular'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.vincularTagDataset(args.dataset_id, args.tag_ids);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao vincular tag');
      }
    },
  });

  registerMcpTool({
    name: 'dify_tag_listar_dataset',
    description: 'Lista as tags associadas a um dataset específico no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarTagsDataset(args.dataset_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar tags do dataset');
      }
    },
  });

  registerMcpTool({
    name: 'dify_tag_desvincular_dataset',
    description: 'Remove a associação de uma tag com um dataset no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset'),
      tag_id: z.string().min(1).describe('ID da tag a desvincular'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.desvincularTagDataset(args.dataset_id, args.tag_id);
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao desvincular tag');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Model Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_modelo_listar_embedding',
    description: 'Lista os modelos de embedding disponíveis no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { createDifyServiceForUser } = await import('@/lib/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarModelosEmbedding();
        if (result.isErr()) return errorResult(result.error.message);
        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar modelos');
      }
    },
  });

  console.log('[MCP] 50 ferramentas Dify registradas com sucesso');
}
