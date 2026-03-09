/**
 * Registro de Ferramentas MCP - Tarefas
 *
 * Tools disponíveis:
 * - listar_tarefas: Lista tarefas com filtros
 * - buscar_tarefa: Busca tarefa por ID
 * - criar_tarefa: Cria nova tarefa (suporta quadroId)
 * - atualizar_tarefa: Atualiza tarefa existente
 * - deletar_tarefa: Remove uma tarefa
 * - agendar_reuniao_zoom: Cria tarefa de reunião Zoom com cliente
 * - listar_horarios_disponiveis: Lista horários disponíveis para reuniões
 * - listar_quadros: Lista quadros Kanban (sistema + custom)
 * - criar_quadro_custom: Cria quadro personalizado
 * - excluir_quadro_custom: Exclui quadro personalizado
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';
import { todayDateString, addDays } from '@/lib/date-utils';

/**
 * ID do usuário do sistema para operações do agente de atendimento
 * Este ID deve corresponder a um usuário de serviço no banco de dados
 */
const SYSTEM_AGENT_USER_ID = Number(process.env.SYSTEM_AGENT_USER_ID) || 1;

/**
 * Registra ferramentas MCP do módulo Tarefas
 */
export async function registerTarefasTools(): Promise<void> {
  const { 
    listarTarefas, 
    buscarTarefa, 
    criarTarefa, 
    atualizarTarefa, 
    removerTarefa,
    listarQuadros,
    criarQuadroCustom,
    excluirQuadroCustom,
  } = await import('@/app/app/tarefas/service');

  /**
   * Lista tarefas do sistema com filtros
   */
  registerMcpTool({
    name: 'listar_tarefas',
    description: 'Lista tarefas do sistema com filtros por status, prioridade e busca textual',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      search: z.string().optional().describe('Busca textual no título'),
      status: z
        .enum(['backlog', 'todo', 'in progress', 'done', 'canceled'])
        .optional()
        .describe('Filtrar por status'),
      label: z.enum(['bug', 'feature', 'documentation']).optional().describe('Filtrar por label'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Filtrar por prioridade'),
      limite: z.number().min(1).max(50).default(20).describe('Número máximo de tarefas'),
    }),
    handler: async (args) => {
      try {
        const result = await listarTarefas(SYSTEM_AGENT_USER_ID, {
          search: args.search,
          status: args.status,
          label: args.label,
          priority: args.priority,
          limit: args.limite,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: `${result.data.length} tarefa(s) encontrada(s)`,
          total: result.data.length,
          tarefas: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar tarefas');
      }
    },
  });

  /**
   * Busca tarefa por ID
   */
  registerMcpTool({
    name: 'buscar_tarefa',
    description: 'Busca uma tarefa específica pelo ID',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      id: z.string().min(1).describe('ID da tarefa (ex: TASK-0001)'),
    }),
    handler: async (args) => {
      try {
        const result = await buscarTarefa(SYSTEM_AGENT_USER_ID, args.id);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        if (!result.data) {
          return errorResult('Tarefa não encontrada');
        }

        return jsonResult(result.data);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar tarefa');
      }
    },
  });

  /**
   * Cria nova tarefa
   */
  registerMcpTool({
    name: 'criar_tarefa',
    description: 'Cria uma nova tarefa no sistema',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      title: z.string().min(1).describe('Título da tarefa'),
      status: z
        .enum(['backlog', 'todo', 'in progress', 'done', 'canceled'])
        .default('todo')
        .describe('Status inicial'),
      label: z.enum(['bug', 'feature', 'documentation']).default('feature').describe('Label da tarefa'),
      priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Prioridade'),
      quadroId: z.string().uuid().optional().nullable().describe('ID do quadro personalizado (opcional)'),
    }),
    handler: async (args) => {
      try {
        const result = await criarTarefa(SYSTEM_AGENT_USER_ID, {
          title: args.title,
          status: args.status ?? 'todo',
          label: args.label ?? 'feature',
          priority: args.priority ?? 'medium',
          quadroId: args.quadroId,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: 'Tarefa criada com sucesso',
          tarefa: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar tarefa');
      }
    },
  });

  /**
   * Atualiza tarefa existente
   */
  registerMcpTool({
    name: 'atualizar_tarefa',
    description: 'Atualiza uma tarefa existente',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      id: z.string().min(1).describe('ID da tarefa'),
      title: z.string().min(1).optional().describe('Novo título'),
      status: z.enum(['backlog', 'todo', 'in progress', 'done', 'canceled']).optional().describe('Novo status'),
      label: z.enum(['bug', 'feature', 'documentation']).optional().describe('Nova label'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Nova prioridade'),
    }),
    handler: async (args) => {
      try {
        const result = await atualizarTarefa(SYSTEM_AGENT_USER_ID, {
          id: args.id,
          title: args.title,
          status: args.status,
          label: args.label,
          priority: args.priority,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: 'Tarefa atualizada com sucesso',
          tarefa: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
      }
    },
  });

  /**
   * Remove uma tarefa
   */
  registerMcpTool({
    name: 'deletar_tarefa',
    description: 'Remove uma tarefa do sistema',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      id: z.string().min(1).describe('ID da tarefa a ser removida'),
    }),
    handler: async (args) => {
      try {
        const result = await removerTarefa(SYSTEM_AGENT_USER_ID, args.id);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: 'Tarefa removida com sucesso',
          id: args.id,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao remover tarefa');
      }
    },
  });

  /**
   * Agenda reunião Zoom com cliente (cria tarefa formatada)
   */
  registerMcpTool({
    name: 'agendar_reuniao_zoom',
    description:
      'Agenda uma reunião via Zoom com cliente para discutir caso jurídico. Cria uma tarefa de alta prioridade para a equipe entrar em contato e confirmar.',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      nome_cliente: z.string().min(1).describe('Nome completo do cliente'),
      telefone: z.string().min(10).describe('Telefone do cliente para contato'),
      cpf: z.string().optional().describe('CPF do cliente (se disponível)'),
      assunto: z
        .enum(['acao_aplicativo', 'acao_trabalhista', 'consulta_processo', 'outros'])
        .describe('Assunto da reunião'),
      data_sugerida: z.string().describe('Data sugerida pelo cliente (formato: DD/MM/YYYY)'),
      horario_sugerido: z.string().describe('Horário sugerido (formato: HH:MM)'),
      observacoes: z.string().optional().describe('Observações adicionais sobre o caso'),
    }),
    handler: async (args) => {
      try {
        const assuntoMap: Record<string, string> = {
          acao_aplicativo: 'Ação contra Aplicativo de Transporte',
          acao_trabalhista: 'Ação Trabalhista',
          consulta_processo: 'Consulta de Processo',
          outros: 'Consulta Geral',
        };

        const titulo = `[REUNIÃO ZOOM] ${args.nome_cliente} - ${assuntoMap[args.assunto]} - ${args.data_sugerida} ${args.horario_sugerido}`;

        const descricaoCompleta = [
          titulo,
          `\n📞 Telefone: ${args.telefone}`,
          args.cpf ? `📋 CPF: ${args.cpf}` : '',
          `📅 Data sugerida: ${args.data_sugerida}`,
          `🕐 Horário sugerido: ${args.horario_sugerido}`,
          `📝 Assunto: ${assuntoMap[args.assunto]}`,
          args.observacoes ? `\n💬 Observações: ${args.observacoes}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const result = await criarTarefa(SYSTEM_AGENT_USER_ID, {
          title: descricaoCompleta,
          status: 'todo',
          label: 'feature',
          priority: 'high',
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: 'Reunião agendada com sucesso! A equipe entrará em contato para confirmar.',
          reuniao: {
            id: result.data.id,
            cliente: args.nome_cliente,
            telefone: args.telefone,
            data_sugerida: args.data_sugerida,
            horario_sugerido: args.horario_sugerido,
            assunto: assuntoMap[args.assunto],
          },
          instrucoes:
            'A equipe do escritório entrará em contato pelo telefone informado para confirmar a reunião e enviar o link do Zoom.',
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao agendar reunião');
      }
    },
  });

  /**
   * Lista horários disponíveis para reuniões
   * Retorna slots de horários disponíveis baseado nas tarefas existentes
   */
  registerMcpTool({
    name: 'listar_horarios_disponiveis',
    description:
      'Lista horários disponíveis para agendamento de reuniões Zoom. Retorna slots de horários livres na semana.',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      data_inicio: z.string().optional().describe('Data inicial para busca (formato: YYYY-MM-DD). Padrão: hoje'),
      dias: z.number().min(1).max(14).default(7).describe('Quantidade de dias para verificar disponibilidade'),
    }),
    handler: async (args) => {
      try {
        // Buscar tarefas de reunião já agendadas
        const tarefasResult = await listarTarefas(SYSTEM_AGENT_USER_ID, {
          search: '[REUNIÃO ZOOM]',
          limit: 50,
        });

        const reunioesAgendadas = tarefasResult.success ? tarefasResult.data : [];

        // Gerar slots disponíveis
        // Horário comercial: 9h às 18h, slots de 1 hora
        // Excluindo almoço: 12h às 14h
        const horariosDisponiveis = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

        const hojeStr = args.data_inicio ?? todayDateString();
        const slots: Array<{ data: string; horario: string; disponivel: boolean }> = [];
        const diasParaVerificar = args.dias ?? 7;

        for (let i = 0; i < diasParaVerificar; i++) {
          const dataIso = addDays(hojeStr, i);
          // Parse YYYY-MM-DD to check day of week (local)
          const [y, m, d] = dataIso.split('-').map(Number);
          const dataObj = new Date(y, m - 1, d);

          // Pular finais de semana
          if (dataObj.getDay() === 0 || dataObj.getDay() === 6) continue;

          // Format as DD/MM/YYYY for pt-BR display
          const dataStr = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;

          for (const horario of horariosDisponiveis) {
            // Verificar se já existe reunião neste horário
            const ocupado = reunioesAgendadas.some(
              (t) => t.title.includes(dataStr) && t.title.includes(horario) && t.status !== 'done' && t.status !== 'canceled'
            );

            slots.push({
              data: dataStr,
              horario,
              disponivel: !ocupado,
            });
          }
        }

        const slotsDisponiveis = slots.filter((s) => s.disponivel);

        // Format inicio as DD/MM/YYYY
        const [iy, im, id] = hojeStr.split('-').map(Number);
        const inicioStr = `${String(id).padStart(2, '0')}/${String(im).padStart(2, '0')}/${iy}`;

        return jsonResult({
          message: `${slotsDisponiveis.length} horário(s) disponível(is) encontrado(s)`,
          periodo: {
            inicio: inicioStr,
            dias: diasParaVerificar,
          },
          horarios_disponiveis: slotsDisponiveis.slice(0, 20), // Limitar a 20 slots
          instrucoes:
            'Escolha um dos horários disponíveis. A equipe entrará em contato para confirmar a reunião.',
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar horários disponíveis');
      }
    },
  });

  /**
   * Lista todos os quadros disponíveis (sistema + custom)
   */
  registerMcpTool({
    name: 'listar_quadros',
    description: 'Lista todos os quadros Kanban disponíveis (quadros do sistema e personalizados)',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await listarQuadros(SYSTEM_AGENT_USER_ID);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: `${result.data.length} quadro(s) encontrado(s)`,
          quadros: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar quadros');
      }
    },
  });

  /**
   * Cria um quadro personalizado
   */
  registerMcpTool({
    name: 'criar_quadro_custom',
    description: 'Cria um novo quadro Kanban personalizado para organizar tarefas',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      titulo: z.string().min(1).max(100).describe('Título do quadro'),
      icone: z.string().optional().describe('Ícone do quadro (emoji ou nome do ícone)'),
    }),
    handler: async (args) => {
      try {
        const result = await criarQuadroCustom(SYSTEM_AGENT_USER_ID, {
          titulo: args.titulo,
          icone: args.icone,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: 'Quadro criado com sucesso',
          quadro: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar quadro');
      }
    },
  });

  /**
   * Exclui um quadro personalizado
   */
  registerMcpTool({
    name: 'excluir_quadro_custom',
    description: 'Exclui um quadro Kanban personalizado. Não é possível excluir quadros do sistema.',
    feature: 'tarefas',
    requiresAuth: true,
    schema: z.object({
      quadroId: z.string().uuid().describe('ID do quadro a ser excluído'),
    }),
    handler: async (args) => {
      try {
        const result = await excluirQuadroCustom(SYSTEM_AGENT_USER_ID, {
          quadroId: args.quadroId,
        });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: 'Quadro excluído com sucesso',
          quadroId: args.quadroId,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao excluir quadro');
      }
    },
  });
}
