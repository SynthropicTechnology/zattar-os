/**
 * Registro de Ferramentas MCP - Financeiro
 *
 * Tools disponíveis:
 * PLANO DE CONTAS:
 * - listar_plano_contas: Lista plano de contas
 * - criar_conta: Cria nova conta contábil
 * - atualizar_conta: Atualiza conta existente
 * - excluir_conta: Remove conta
 *
 * LANÇAMENTOS:
 * - listar_lancamentos: Lista lançamentos com filtros
 * - criar_lancamento: Cria novo lançamento
 * - atualizar_lancamento: Atualiza lançamento
 * - excluir_lancamento: Remove lançamento
 * - confirmar_lancamento: Confirma lançamento pendente
 * - cancelar_lancamento: Cancela lançamento
 * - estornar_lancamento: Estorna lançamento
 *
 * DRE:
 * - gerar_dre: Gera Demonstração de Resultado
 * - obter_evolucao_dre: Evolução temporal da DRE
 * - exportar_dre_csv: Exporta DRE em CSV
 * - exportar_dre_pdf: Exporta DRE em PDF
 *
 * FLUXO DE CAIXA:
 * - obter_fluxo_caixa_unificado: Fluxo de caixa consolidado
 * - obter_fluxo_caixa_diario: Fluxo de caixa diário
 * - obter_fluxo_caixa_por_periodo: Fluxo por período
 * - obter_indicadores_saude: Indicadores de saúde financeira
 * - obter_alertas_caixa: Alertas de fluxo de caixa
 * - obter_resumo_dashboard: Resumo do dashboard
 * - obter_saldo_inicial: Saldo inicial
 * - listar_contas_bancarias: Contas bancárias
 * - listar_centros_custo: Centros de custo
 *
 * CONCILIAÇÃO:
 * - listar_transacoes: Lista transações bancárias
 * - conciliar_manual: Concilia transação manualmente
 * - obter_sugestoes: Obtém sugestões de conciliação
 * - buscar_lancamentos_candidatos: Busca lançamentos para conciliação
 * - desconciliar: Desfaz conciliação
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Financeiro
 */
export async function registerFinanceiroTools(): Promise<void> {
  // Plano de Contas
  const {
    actionListarPlanoContas,
    actionCriarConta,
    actionAtualizarConta,
    actionExcluirConta,
  } = await import('@/app/(authenticated)/financeiro/actions/plano-contas');

  // Lançamentos
  const {
    actionListarLancamentos,
    actionCriarLancamento,
    actionAtualizarLancamento,
    actionExcluirLancamento,
    actionConfirmarLancamento,
    actionCancelarLancamento,
    actionEstornarLancamento,
  } = await import('@/app/(authenticated)/financeiro/actions/lancamentos');

  // DRE
  const {
    actionGerarDRE,
    actionObterEvolucaoDRE,
    actionExportarDRECSV,
    actionExportarDREPDF,
  } = await import('@/app/(authenticated)/financeiro/actions/dre');

  // Fluxo de Caixa
  const {
    actionObterFluxoCaixaUnificado,
    actionObterFluxoCaixaDiario,
    actionObterFluxoCaixaPorPeriodo,
    actionObterIndicadoresSaude,
    actionObterAlertasCaixa,
    actionObterResumoDashboard,
    actionObterSaldoInicial,
    actionListarContasBancarias,
    actionListarCentrosCusto,
  } = await import('@/app/(authenticated)/financeiro/actions/fluxo-caixa');

  // Conciliação
  const {
    actionListarTransacoes,
    actionConciliarManual,
    actionObterSugestoes,
    actionDesconciliar,
    actionBuscarLancamentosManuais,
  } = await import('@/app/(authenticated)/financeiro/actions/conciliacao');

  // ===== PLANO DE CONTAS =====

  registerMcpTool({
    name: 'listar_plano_contas',
    description: 'Lista plano de contas do sistema com hierarquia',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      tipoConta: z
        .enum(['ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido'])
        .optional()
        .describe('Filtrar por tipo de conta contábil'),
      nivel: z.enum(['sintetica', 'analitica']).optional().describe('Filtrar por nível'),
      ativo: z.boolean().optional().describe('Filtrar por contas ativas/inativas'),
      busca: z.string().optional().describe('Busca textual por código/nome'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarPlanoContas(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar plano de contas');
      }
    },
  });

  registerMcpTool({
    name: 'criar_conta',
    description: 'Cria nova conta no plano de contas',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      codigo: z.string().describe('Código da conta'),
      nome: z.string().describe('Nome da conta'),
      descricao: z.string().optional().describe('Descrição da conta'),
      tipoConta: z.enum(['ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido']).describe('Tipo da conta'),
      natureza: z.enum(['devedora', 'credora']).describe('Natureza da conta'),
      nivel: z.enum(['sintetica', 'analitica']).describe('Nível (sintética/analítica)'),
      contaPaiId: z.number().nullable().optional().describe('ID da conta pai (para subconta)'),
      ordemExibicao: z.number().nullable().optional().describe('Ordem de exibição'),
      ativo: z.boolean().optional().describe('Conta ativa/inativa'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarConta(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar conta');
      }
    },
  });

  registerMcpTool({
    name: 'atualizar_conta',
    description: 'Atualiza conta existente no plano de contas',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da conta'),
      nome: z.string().optional().describe('Nome da conta'),
      descricao: z.string().optional().describe('Descrição da conta'),
      ativa: z.boolean().optional().describe('Status ativo/inativo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionAtualizarConta(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar conta');
      }
    },
  });

  registerMcpTool({
    name: 'excluir_conta',
    description: 'Remove conta do plano de contas',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da conta'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExcluirConta(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao excluir conta');
      }
    },
  });

  // ===== LANÇAMENTOS =====

  registerMcpTool({
    name: 'listar_lancamentos',
    description: 'Lista lançamentos financeiros com filtros por período, tipo, status, busca textual',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(50).describe('Número máximo de lançamentos'),
      pagina: z.number().min(1).default(1).describe('Número da página'),
      dataVencimentoInicio: z.string().optional().describe('Data início vencimento (YYYY-MM-DD)'),
      dataVencimentoFim: z.string().optional().describe('Data fim vencimento (YYYY-MM-DD)'),
      dataCompetenciaInicio: z.string().optional().describe('Data início competência (YYYY-MM-DD)'),
      dataCompetenciaFim: z.string().optional().describe('Data fim competência (YYYY-MM-DD)'),
      tipo: z.enum(['receita', 'despesa']).optional().describe('Tipo de lançamento'),
      status: z.enum(['pendente', 'confirmado', 'cancelado', 'estornado']).optional().describe('Status'),
      busca: z.string().optional().describe('Busca textual por descrição'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
      contaContabilId: z.number().optional().describe('ID da conta contábil'),
      centroCustoId: z.number().optional().describe('ID do centro de custo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarLancamentos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar lançamentos');
      }
    },
  });

  registerMcpTool({
    name: 'criar_lancamento',
    description: 'Cria novo lançamento financeiro',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      tipo: z.enum(['receita', 'despesa']).describe('Tipo de lançamento'),
      valor: z.number().positive().describe('Valor do lançamento'),
      data: z.string().describe('Data do lançamento (YYYY-MM-DD)'),
      descricao: z.string().describe('Descrição do lançamento'),
      contaId: z.number().describe('ID da conta contábil'),
      categoriaId: z.number().optional().describe('ID da categoria'),
      processoId: z.number().optional().describe('ID do processo relacionado'),
      clienteId: z.number().optional().describe('ID do cliente relacionado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarLancamento(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'atualizar_lancamento',
    description: 'Atualiza lançamento financeiro existente',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
      valor: z.number().positive().optional().describe('Valor do lançamento'),
      dataLancamento: z.string().optional().describe('Data do lançamento (YYYY-MM-DD)'),
      dataCompetencia: z.string().optional().describe('Data de competência (YYYY-MM-DD)'),
      dataVencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
      descricao: z.string().optional().describe('Descrição do lançamento'),
      contaContabilId: z.number().optional().describe('ID da conta contábil'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
      centroCustoId: z.number().optional().describe('ID do centro de custo'),
    }),
    handler: async (args) => {
      try {
        const { id, ...dados } = args;
        const result = await actionAtualizarLancamento(id, dados);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'excluir_lancamento',
    description: 'Remove lançamento financeiro',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExcluirLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao excluir lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'confirmar_lancamento',
    description: 'Confirma lançamento pendente',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionConfirmarLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao confirmar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'cancelar_lancamento',
    description: 'Cancela lançamento',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCancelarLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao cancelar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'estornar_lancamento',
    description: 'Estorna lançamento confirmado',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionEstornarLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao estornar lançamento');
      }
    },
  });

  // ===== DRE =====

  registerMcpTool({
    name: 'gerar_dre',
    description: 'Gera Demonstração de Resultado do Exercício para um período',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      tipo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional().describe('Tipo de período'),
      incluirComparativo: z.boolean().optional().describe('Incluir comparativo com período anterior'),
      incluirOrcado: z.boolean().optional().describe('Incluir comparativo com orçado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionGerarDRE(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao gerar DRE');
      }
    },
  });

  registerMcpTool({
    name: 'obter_evolucao_dre',
    description: 'Obtém evolução mensal da DRE para um ano específico',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      ano: z.number().min(2020).max(2100).describe('Ano para análise (ex: 2024)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterEvolucaoDRE(args.ano);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter evolução DRE');
      }
    },
  });

  registerMcpTool({
    name: 'exportar_dre_csv',
    description: 'Exporta DRE em formato CSV',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExportarDRECSV(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao exportar DRE CSV');
      }
    },
  });

  registerMcpTool({
    name: 'exportar_dre_pdf',
    description: 'Exporta DRE em formato PDF (retorna Base64)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      tipo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional().describe('Tipo de período'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExportarDREPDF(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao exportar DRE PDF');
      }
    },
  });

  // ===== FLUXO DE CAIXA =====

  registerMcpTool({
    name: 'obter_fluxo_caixa_unificado',
    description: 'Obtém fluxo de caixa consolidado com entradas, saídas e saldo',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterFluxoCaixaUnificado(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter fluxo de caixa');
      }
    },
  });

  registerMcpTool({
    name: 'obter_fluxo_caixa_diario',
    description: 'Obtém fluxo de caixa diário para análise detalhada de uma conta bancária',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      contaBancariaId: z.number().describe('ID da conta bancária'),
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterFluxoCaixaDiario(
          args.contaBancariaId,
          args.dataInicio,
          args.dataFim
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter fluxo de caixa diário');
      }
    },
  });

  registerMcpTool({
    name: 'obter_fluxo_caixa_por_periodo',
    description: 'Obtém fluxo de caixa agrupado por período (dia/semana/mês)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      agrupamento: z.enum(['dia', 'semana', 'mes']).default('mes').describe('Tipo de agrupamento'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
      incluirProjetado: z.boolean().optional().describe('Incluir valores projetados'),
    }),
    handler: async (args) => {
      try {
        const { agrupamento, ...filtros } = args;
        const result = await actionObterFluxoCaixaPorPeriodo(filtros, agrupamento);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter fluxo de caixa por período');
      }
    },
  });

  registerMcpTool({
    name: 'obter_indicadores_saude',
    description: 'Obtém indicadores de saúde financeira (liquidez, cobertura, tendência)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterIndicadoresSaude(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter indicadores de saúde');
      }
    },
  });

  registerMcpTool({
    name: 'obter_alertas_caixa',
    description: 'Obtém alertas de fluxo de caixa (saldo baixo, vencimentos, variações)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterAlertasCaixa(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter alertas de caixa');
      }
    },
  });

  registerMcpTool({
    name: 'obter_resumo_dashboard',
    description: 'Obtém resumo consolidado para dashboard de fluxo de caixa',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterResumoDashboard(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter resumo dashboard');
      }
    },
  });

  registerMcpTool({
    name: 'obter_saldo_inicial',
    description: 'Obtém saldo inicial de uma conta bancária em uma data específica',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      contaBancariaId: z.number().describe('ID da conta bancária'),
      data: z.string().describe('Data de referência (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterSaldoInicial(args.contaBancariaId, args.data);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter saldo inicial');
      }
    },
  });

  registerMcpTool({
    name: 'listar_contas_bancarias',
    description: 'Lista todas as contas bancárias disponíveis no sistema',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarContasBancarias();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar contas bancárias');
      }
    },
  });

  registerMcpTool({
    name: 'listar_centros_custo',
    description: 'Lista todos os centros de custo disponíveis no sistema',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarCentrosCusto();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar centros de custo');
      }
    },
  });

  // ===== CONCILIAÇÃO =====

  registerMcpTool({
    name: 'listar_transacoes',
    description: 'Lista transações bancárias importadas para conciliação',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de transações'),
      pagina: z.number().min(1).default(1).describe('Número da página'),
      statusConciliacao: z.enum(['pendente', 'conciliado', 'divergente', 'ignorado']).optional().describe('Status da conciliação'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
      dataInicio: z.string().optional().describe('Data início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim (YYYY-MM-DD)'),
      tipoTransacao: z.enum(['credito', 'debito']).optional().describe('Tipo da transação'),
      busca: z.string().optional().describe('Busca por descrição ou documento'),
      ordenarPor: z.string().optional().describe('Campo para ordenação'),
      ordem: z.enum(['asc', 'desc']).optional().describe('Ordem da ordenação'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarTransacoes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar transações');
      }
    },
  });

  registerMcpTool({
    name: 'conciliar_manual',
    description: 'Concilia transação bancária com lançamento manualmente',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      transacaoImportadaId: z.number().describe('ID da transação bancária importada'),
      lancamentoFinanceiroId: z.number().nullable().describe('ID do lançamento financeiro (null para ignorar ou criar novo)'),
      criarNovoLancamento: z.boolean().optional().describe('Se deve criar um novo lançamento'),
      dadosNovoLancamento: z.object({}).passthrough().optional().describe('Dados do novo lançamento a ser criado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionConciliarManual(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao conciliar transação');
      }
    },
  });

  registerMcpTool({
    name: 'obter_sugestoes',
    description: 'Obtém sugestões de conciliação automática',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number().describe('ID da transação bancária'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterSugestoes(args.transacaoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter sugestões');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_lancamentos_candidatos',
    description: 'Busca lançamentos candidatos para conciliação manual com uma transação bancária',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      valor: z.number().describe('Valor da transação'),
      dataInicio: z.string().describe('Data início da busca (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim da busca (YYYY-MM-DD)'),
      tipo: z.enum(['receita', 'despesa']).describe('Tipo de lançamento'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarLancamentosManuais(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar lançamentos candidatos');
      }
    },
  });

  registerMcpTool({
    name: 'desconciliar',
    description: 'Desfaz conciliação de transação',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number().describe('ID da transação bancária'),
    }),
    handler: async (args) => {
      try {
        const result = await actionDesconciliar(args.transacaoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao desconciliar');
      }
    },
  });
}
