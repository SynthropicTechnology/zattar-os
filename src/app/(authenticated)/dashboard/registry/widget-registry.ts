/**
 * WIDGET REGISTRY
 * ============================================================================
 * Fonte única de verdade para todos os widgets do dashboard.
 * Usado pelo sistema de personalização para listar, filtrar e renderizar
 * widgets com base em permissões, módulo e preferências do usuário.
 * ============================================================================
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS CONECTADOS (dados reais via useDashboard)
// Todos os 52 widgets consomem dados reais do DashboardProvider.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Processos (conectados) ─────────────────────────────────────────────────
import { WidgetSaudeProcessual } from '../widgets/processos/saude-processual';
import { WidgetHeatmapAtividade } from '../widgets/processos/heatmap-atividade';
import { WidgetStatusDistribuicao } from '../widgets/processos/status-distribuicao';
import { WidgetCasosTribunal } from '../widgets/processos/casos-tribunal';
import { WidgetTendenciaNovos } from '../widgets/processos/tendencia-novos';
import { WidgetAging } from '../widgets/processos/aging';
import { WidgetSegmento } from '../widgets/processos/segmento';
import { WidgetKpiPulse } from '../widgets/processos/kpi-pulse';
import { WidgetProcessosComTabs } from '../widgets/processos/processos-tabs';

// ─── Audiências (conectados) ────────────────────────────────────────────────
import { ProximasAudiencias } from '../widgets/audiencias/proximas-audiencias';
import { WidgetPreparacao } from '../widgets/audiencias/preparacao';
import { ModalidadeDistribution } from '../widgets/audiencias/modalidade';
import { StatusMensal } from '../widgets/audiencias/status-mensal';
import { KpiStrip } from '../widgets/audiencias/kpi-strip';
import { AudienciasPorTipo } from '../widgets/audiencias/por-tipo';
import { TrendMensal } from '../widgets/audiencias/trend-mensal';
import { WidgetComparativoMensal } from '../widgets/audiencias/comparativo-mensal';
import { WidgetHeatmapSemanal } from '../widgets/audiencias/heatmap-semanal';

// ─── Expedientes (conectados) ───────────────────────────────────────────────
import { UrgencyList } from '../widgets/expedientes/urgency-list';
import { AgingFunnel } from '../widgets/expedientes/aging-funnel';
import { SaudePrazos } from '../widgets/expedientes/saude-prazos';
import { OrigemDistribution } from '../widgets/expedientes/origem';
import { ResultadoDecisao } from '../widgets/expedientes/resultado-decisao';
import { VolumeSemanal } from '../widgets/expedientes/volume-semanal';
import { PrazoMedio } from '../widgets/expedientes/prazo-medio';
import { CalendarioPrazos } from '../widgets/expedientes/calendario-prazos';
import { TendenciaResponsividade } from '../widgets/expedientes/tendencia-responsividade';

// ─── Financeiro (conectados) ────────────────────────────────────────────────
import { WidgetSaúdeFinanceira } from '../widgets/financeiro/saude-financeira';
import { WidgetFluxoComTabs } from '../widgets/financeiro/fluxo-tabs';
import { WidgetDespesasTreemap } from '../widgets/financeiro/despesas-treemap';
import { WidgetInadimplencia } from '../widgets/financeiro/inadimplencia';
import { WidgetFluxoCaixa } from '../widgets/financeiro/fluxo-caixa';
import { WidgetSaldoTrend } from '../widgets/financeiro/saldo-trend';
import { WidgetContasReceber } from '../widgets/financeiro/contas-receber';
import { WidgetContasPagar } from '../widgets/financeiro/contas-pagar';
import { WidgetDespesasCategoria } from '../widgets/financeiro/despesas-categoria';
import { WidgetDREComparativo } from '../widgets/financeiro/dre-comparativo';

// ─── Contratos (conectados) ─────────────────────────────────────────────────
import { WidgetSaudeContratual } from '../widgets/contratos/saude-contratual';
import { WidgetObrigacoesTreemap } from '../widgets/contratos/obrigacoes-treemap';
import { WidgetStatusContratos } from '../widgets/contratos/status-contratos';
import { WidgetTiposContrato } from '../widgets/contratos/tipos-contrato';
import { WidgetObrigacoesVencer } from '../widgets/contratos/obrigacoes-vencer';
import { WidgetParcelasStatus } from '../widgets/contratos/parcelas-status';
import { WidgetRepassesPendentes } from '../widgets/contratos/repasses-pendentes';
import { WidgetModeloCobranca } from '../widgets/contratos/modelo-cobranca';

// ─── Pessoal (conectados) ───────────────────────────────────────────────────
import { WidgetScorePessoal } from '../widgets/pessoal/score-pessoal';
import { WidgetMeuDia } from '../widgets/pessoal/meu-dia';
import { WidgetFocoHoje } from '../widgets/pessoal/foco-hoje';
import { WidgetTarefasStatus } from '../widgets/pessoal/tarefas-status';
import { WidgetProdutividadeSemanal } from '../widgets/pessoal/produtividade-semanal';
import { WidgetLembretesAtivos } from '../widgets/pessoal/lembretes-ativos';
import { WidgetHeatmapProdutividade } from '../widgets/pessoal/heatmap-produtividade';
import { WidgetCapturaStatus } from '../widgets/pessoal/captura-status';
import { WidgetChatAtivo } from '../widgets/pessoal/chat-ativo';
import { WidgetDocumentosRecentes } from '../widgets/pessoal/documentos-recentes';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  module: 'processos' | 'audiencias' | 'expedientes' | 'financeiro' | 'contratos' | 'pessoal';
  permission: { recurso: string; operacao: string } | null;
  /** xs = 1/6, sm = 1/3, half = 1/2, md = 2/3, lg = 2/3 tall, full = 3/3 */
  size: 'xs' | 'sm' | 'half' | 'md' | 'lg' | 'full';
  defaultEnabled: boolean;
  component: React.ComponentType;
}

// ─── Permission shortcuts ────────────────────────────────────────────────────

const PERM = {
  processos:  { recurso: 'acervo',              operacao: 'listar' },
  audiencias: { recurso: 'audiencias',             operacao: 'listar' },
  expedientes:{ recurso: 'pendentes',              operacao: 'listar' },
  financeiro: { recurso: 'lancamentos_financeiros', operacao: 'listar' },
  contratos:  { recurso: 'contratos',              operacao: 'listar' },
  pessoal:    null,
} as const;

// ─── Registry ────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // ── Processos ──────────────────────────────────────────────────────────────
  {
    id: 'processos-status-distribuicao',
    title: 'Distribuição por Status',
    description: 'Donut e legenda mostrando a proporção de processos ativos, suspensos, arquivados e em recurso.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetStatusDistribuicao,
  },
  {
    id: 'processos-casos-tribunal',
    title: 'Casos por Tribunal',
    description: 'Barras horizontais com os top 5 TRTs por volume de processos ativos.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetCasosTribunal,
  },
  {
    id: 'processos-tendencia-novos',
    title: 'Novos Processos',
    description: 'MiniArea e valores mensais mostrando a tendência de novos processos nos últimos 8 meses.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetTendenciaNovos,
  },
  {
    id: 'processos-aging',
    title: 'Aging dos Processos',
    description: 'StackedBar e breakdown por faixas de tempo de duração dos processos.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetAging,
  },
  {
    id: 'processos-segmento',
    title: 'Por Segmento',
    description: 'Distribuição dos processos por área jurídica: trabalhista, cível, previdenciário e outros.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetSegmento,
  },
  {
    id: 'processos-kpi-pulse',
    title: 'Painel KPI',
    description: 'Resumo operacional com total, ativos, novos e resolvidos no mês, taxa de resolução e tendência.',
    module: 'processos',
    permission: PERM.processos,
    size: 'xs',
    defaultEnabled: false,
    component: WidgetKpiPulse,
  },
  {
    id: 'processos-saude-processual',
    title: 'Saúde do Portfólio',
    description: 'Score composto com gauge, comparações de ativos e encerrados, e insight de movimentação.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: true,
    component: WidgetSaudeProcessual,
  },
  {
    id: 'processos-heatmap-atividade',
    title: 'Movimentações Processuais',
    description: 'CalendarHeatmap de frequência diária de movimentações nas últimas 5 semanas.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetHeatmapAtividade,
  },
  {
    id: 'processos-com-tabs',
    title: 'Proporção de Processos',
    description: 'Treemap interativo com alternância entre agrupamento por status e por segmento.',
    module: 'processos',
    permission: PERM.processos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetProcessosComTabs,
  },

  // ── Audiências ─────────────────────────────────────────────────────────────
  {
    id: 'audiencias-proximas',
    title: 'Próximas Audiências',
    description: 'Timeline das próximas audiências dos próximos 30 dias com tipo, parte, data e local.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'half',
    defaultEnabled: true,
    component: ProximasAudiencias,
  },
  {
    id: 'audiencias-modalidade',
    title: 'Modalidade',
    description: 'MiniDonut com distribuição de audiências por formato: virtual, presencial e híbrida.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'sm',
    defaultEnabled: false,
    component: ModalidadeDistribution,
  },
  {
    id: 'audiencias-status-mensal',
    title: 'Status Mensal',
    description: 'MiniBar agrupado com marcadas, realizadas e canceladas nos últimos 6 meses.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'sm',
    defaultEnabled: false,
    component: StatusMensal,
  },
  {
    id: 'audiencias-kpi-strip',
    title: 'Resumo do Período',
    description: 'KPIs compactos: audiências no mês, próximas 7 dias, taxa de comparecimento e duração média.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'sm',
    defaultEnabled: false,
    component: KpiStrip,
  },
  {
    id: 'audiencias-por-tipo',
    title: 'Por Tipo',
    description: 'Barras horizontais com distribuição histórica por tipo: instrução, conciliação, julgamento e outros.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'sm',
    defaultEnabled: false,
    component: AudienciasPorTipo,
  },
  {
    id: 'audiencias-trend-mensal',
    title: 'Tendência Anual',
    description: 'Gráfico de área com tendência de audiências nos últimos 12 meses com destaque no mês atual.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'sm',
    defaultEnabled: false,
    component: TrendMensal,
  },
  {
    id: 'audiencias-comparativo-mensal',
    title: 'Comparativo Mensal',
    description: 'ComparisonStat com realizadas, canceladas, taxa de sucesso e duração média: mês atual vs anterior.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetComparativoMensal,
  },
  {
    id: 'audiencias-heatmap-semanal',
    title: 'Densidade Semanal',
    description: 'CalendarHeatmap com audiências por dia nas últimas 5 semanas e identificação do dia mais cheio.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetHeatmapSemanal,
  },
  {
    id: 'audiencias-preparacao',
    title: 'Preparação',
    description: 'Status documental das próximas audiências com ProgressRing por grau de preparo.',
    module: 'audiencias',
    permission: PERM.audiencias,
    size: 'half',
    defaultEnabled: false,
    component: WidgetPreparacao,
  },

  // ── Expedientes ────────────────────────────────────────────────────────────
  {
    id: 'expedientes-urgency-list',
    title: 'Expedientes Urgentes',
    description: 'Lista de expedientes ordenada por urgência de prazo com contexto processual resumido.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'half',
    defaultEnabled: true,
    component: UrgencyList,
  },
  {
    id: 'expedientes-saude-prazos',
    title: 'Saúde dos Prazos',
    description: 'Score consolidado de prazos com gauge, contagem de vencidos e alerta de prazo crítico do dia.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'md',
    defaultEnabled: false,
    component: SaudePrazos,
  },
  {
    id: 'expedientes-aging-funnel',
    title: 'Funil de Vencimentos',
    description: 'Barras horizontais com distribuição por janela de prazo: vencidos, hoje, 7 dias e 30 dias.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'half',
    defaultEnabled: false,
    component: AgingFunnel,
  },
  {
    id: 'expedientes-origem',
    title: 'Origem dos Expedientes',
    description: 'MiniDonut mostrando de onde os expedientes são capturados: PJE, Comunica CNJ e manual.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'sm',
    defaultEnabled: false,
    component: OrigemDistribution,
  },
  {
    id: 'expedientes-resultado-decisao',
    title: 'Resultado das Decisões',
    description: 'StackedBar e ProgressRings com favorável, parcialmente favorável e desfavorável no mês.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'sm',
    defaultEnabled: false,
    component: ResultadoDecisao,
  },
  {
    id: 'expedientes-volume-semanal',
    title: 'Volume Semanal',
    description: 'MiniBar duplo com expedientes recebidos vs baixados por dia da semana atual.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'sm',
    defaultEnabled: false,
    component: VolumeSemanal,
  },
  {
    id: 'expedientes-prazo-medio',
    title: 'Prazo Médio de Resposta',
    description: 'Stat com sparkline de tendência de prazo médio em 8 semanas e comparação com mês anterior.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'sm',
    defaultEnabled: false,
    component: PrazoMedio,
  },
  {
    id: 'expedientes-calendario-prazos',
    title: 'Calendário de Prazos',
    description: 'CalendarHeatmap de densidade de prazos por dia nas últimas 5 semanas com escala destrutiva.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'sm',
    defaultEnabled: false,
    component: CalendarioPrazos,
  },
  {
    id: 'expedientes-tendencia-responsividade',
    title: 'Tendência de Responsividade',
    description: 'ComparisonStat 2x2 com tempo de resposta, taxa de cumprimento, baixas por semana e backlog.',
    module: 'expedientes',
    permission: PERM.expedientes,
    size: 'sm',
    defaultEnabled: false,
    component: TendenciaResponsividade,
  },

  // ── Financeiro ─────────────────────────────────────────────────────────────
  {
    id: 'financeiro-saude-financeira',
    title: 'Saúde Financeira',
    description: 'Hero com gauge de saúde, saldo, a receber, a pagar, resultado do mês e projeção de receita.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'half',
    defaultEnabled: true,
    component: WidgetSaúdeFinanceira,
  },
  {
    id: 'financeiro-fluxo-caixa',
    title: 'Fluxo de Caixa',
    description: 'MiniBar duplo com receita vs despesa nos últimos 6 meses.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'md',
    defaultEnabled: false,
    component: WidgetFluxoCaixa,
  },
  {
    id: 'financeiro-saldo-trend',
    title: 'Saldo Atual',
    description: 'Stat com saldo disponível e MiniArea de evolução do saldo nos últimos 12 meses.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetSaldoTrend,
  },
  {
    id: 'financeiro-contas-receber',
    title: 'Contas a Receber',
    description: 'Aging de contas a receber por faixa de vencimento com barras coloridas por urgência.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetContasReceber,
  },
  {
    id: 'financeiro-contas-pagar',
    title: 'Contas a Pagar',
    description: 'Aging de contas a pagar por faixa de vencimento com valor total destacado.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetContasPagar,
  },
  {
    id: 'financeiro-despesas-categoria',
    title: 'Despesas',
    description: 'MiniDonut com composição de despesas por categoria: pessoal, aluguel, serviços e outros.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetDespesasCategoria,
  },
  {
    id: 'financeiro-dre-comparativo',
    title: 'DRE Comparativo',
    description: 'Receita, despesa e resultado do mês vs anterior com sparklines e margem líquida.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetDREComparativo,
  },
  {
    id: 'financeiro-inadimplencia',
    title: 'Inadimplência',
    description: 'ProgressRing com percentual e valor em atraso sobre a carteira total a receber.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetInadimplencia,
  },
  {
    id: 'financeiro-despesas-treemap',
    title: 'Composição de Despesas',
    description: 'Treemap visual de despesas por categoria com comparação ao mês anterior.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetDespesasTreemap,
  },
  {
    id: 'financeiro-fluxo-tabs',
    title: 'Resultado Operacional',
    description: 'Fluxo mensal e resultado acumulado com alternância de tab — receita vs despesa 6 meses.',
    module: 'financeiro',
    permission: PERM.financeiro,
    size: 'half',
    defaultEnabled: false,
    component: WidgetFluxoComTabs,
  },

  // ── Contratos ──────────────────────────────────────────────────────────────
  {
    id: 'contratos-saude-contratual',
    title: 'Saúde Contratual',
    description: 'Score composto com gauge e comparações de novos contratos, valor em carteira e inadimplência.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'md',
    defaultEnabled: true,
    component: WidgetSaudeContratual,
  },
  {
    id: 'contratos-status',
    title: 'Contratos por Status',
    description: 'MiniDonut com distribuição da carteira: em contratação, contratado, distribuído e desistência.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetStatusContratos,
  },
  {
    id: 'contratos-tipos',
    title: 'Contratos por Tipo',
    description: 'Barras horizontais com volume por modalidade contratual: ajuizamento, defesa, assessoria e outros.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetTiposContrato,
  },
  {
    id: 'contratos-obrigacoes-vencer',
    title: 'Obrigações a Vencer',
    description: 'Lista de obrigações ordenada por urgência com valor, tipo (acordo/condenação/custas) e data.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'md',
    defaultEnabled: false,
    component: WidgetObrigacoesVencer,
  },
  {
    id: 'contratos-parcelas-status',
    title: 'Parcelas — Status',
    description: 'StackedBar e breakdown de parcelas pagas, pendentes e atrasadas com valor total.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetParcelasStatus,
  },
  {
    id: 'contratos-repasses-pendentes',
    title: 'Repasses Pendentes',
    description: 'Lista de repasses com divisão cliente/escritório e status de cada processo.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetRepassesPendentes,
  },
  {
    id: 'contratos-obrigacoes-treemap',
    title: 'Distribuição de Obrigações',
    description: 'Treemap com valor acumulado por natureza jurídica: acordos, condenações, custas e honorários.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetObrigacoesTreemap,
  },
  {
    id: 'contratos-modelo-cobranca',
    title: 'Modelo de Cobrança',
    description: 'Comparativo Pro Labore vs Pro Êxito com taxa de realização e tendência dos últimos 3 meses.',
    module: 'contratos',
    permission: PERM.contratos,
    size: 'md',
    defaultEnabled: false,
    component: WidgetModeloCobranca,
  },

  // ── Pessoal ────────────────────────────────────────────────────────────────
  {
    id: 'pessoal-score-pessoal',
    title: 'Briefing do Dia',
    description: 'Hero com gauge de performance, tarefas, lembretes, audiências e documentos editados hoje.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'full',
    defaultEnabled: true,
    component: WidgetScorePessoal,
  },
  {
    id: 'pessoal-meu-dia',
    title: 'Meu Dia',
    description: 'Timeline do dia com tarefas, lembretes e audiências ordenados por horário.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'md',
    defaultEnabled: true,
    component: WidgetMeuDia,
  },
  {
    id: 'pessoal-foco-hoje',
    title: 'Foco Agora',
    description: 'Top 3 ações recomendadas baseadas em prazos, audiências e tarefas pendentes do dia.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'half',
    defaultEnabled: true,
    component: WidgetFocoHoje,
  },
  {
    id: 'pessoal-tarefas-status',
    title: 'Tarefas por Status',
    description: 'MiniDonut com distribuição da carteira pessoal: pendentes, em andamento e concluídas.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetTarefasStatus,
  },
  {
    id: 'pessoal-produtividade-semanal',
    title: 'Produtividade Semanal',
    description: 'Barras de itens concluídos por dia da semana atual com linha de média.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetProdutividadeSemanal,
  },
  {
    id: 'pessoal-heatmap-produtividade',
    title: 'Histórico de Produtividade',
    description: 'CalendarHeatmap de tarefas concluídas por dia nas últimas 5 semanas.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetHeatmapProdutividade,
  },
  {
    id: 'pessoal-lembretes',
    title: 'Lembretes Ativos',
    description: 'Lista de lembretes do dia com horário, urgência e próximo lembrete destacado.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'md',
    defaultEnabled: true,
    component: WidgetLembretesAtivos,
  },
  {
    id: 'pessoal-captura-status',
    title: 'Captura — Tribunais',
    description: 'Status de sincronização automática por tribunal com indicadores de erro e última atualização.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'sm',
    defaultEnabled: false,
    component: WidgetCapturaStatus,
  },
  {
    id: 'pessoal-chat',
    title: 'Chat',
    description: 'Contador de mensagens não lidas, salas ativas e preview da última mensagem recebida.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'sm',
    defaultEnabled: true,
    component: WidgetChatAtivo,
  },
  {
    id: 'pessoal-documentos-recentes',
    title: 'Documentos Recentes',
    description: 'Lista dos últimos arquivos editados com tipo (doc/pdf) e tempo desde a edição.',
    module: 'pessoal',
    permission: PERM.pessoal,
    size: 'sm',
    defaultEnabled: true,
    component: WidgetDocumentosRecentes,
  },
];

// ─── DEFAULT LAYOUT — Admin com todas as permissões ─────────────────────────
// Ordem define o posicionamento no grid de 6 colunas.
// Regra de encaixe: cada linha soma 6 colunas.
//   full=6 | md+sm=4+2 | half+half=3+3 | sm+sm+sm=2+2+2
//
// Layout visual (admin): progressão por módulo, sem intercalar áreas.
// ┌─────────────── full (6) ───────────────┐  Row 1: Briefing pessoal
// ├──── half (3) ────┤├──── half (3) ───┐   Row 2: Meu Dia + Foco
// ├── sm (2) ──┤├── sm (2) ──┤├── sm (2)┤   Row 3: Tarefas, Produtividade, Lembretes
// ├──── half (3) ────┤├──── half (3) ───┤   Row 4: Próximas Audiências + Preparação
// ├──── half (3) ────┤├──── half (3) ───┤   Row 5: Expedientes Urgentes + Funil
// ├──────── md (4) ──────────┤├── sm (2)┤   Row 6: Saúde Processual + Heatmap
// ├──────── md (4) ──────────┤├── sm (2)┤   Row 7: Saúde Contratual + Obrigações
// ├──────── md (4) ──────────┤├── sm (2)┤   Row 8: Saúde Financeira + Inadimplência
// ├── sm (2) ──┤├── sm (2) ──┤├── sm (2)┤   Row 9: Fluxo Tabs + Despesas + outro

export const DEFAULT_LAYOUT: string[] = [
  // Row 1: Hero pessoal (full — 6 cols)
  'pessoal-score-pessoal',

  // Row 2: Dia + Foco (half + half = 3+3)
  'pessoal-meu-dia',
  'pessoal-foco-hoje',

  // Row 3: Atalhos pessoais — chat, lembretes, documentos (sm+sm+sm = 2+2+2)
  // Pinados também via PINNED_TOP_IDS no widget-dashboard.tsx
  'pessoal-lembretes',
  'pessoal-chat',
  'pessoal-documentos-recentes',

  // Row 4: Pessoal complementar (sm + sm + sm = 2+2+2)
  'pessoal-tarefas-status',
  'pessoal-produtividade-semanal',
  'pessoal-heatmap-produtividade',

  // Row 4: Audiências (half + half = 3+3)
  'audiencias-proximas',
  'audiencias-preparacao',

  // Row 5: Expedientes (half + half = 3+3)
  'expedientes-urgency-list',
  'expedientes-aging-funnel',

  // Row 6: Processos (md + sm = 4+2)
  'processos-saude-processual',
  'processos-heatmap-atividade',

  // Row 7: Contratos (md + sm = 4+2)
  'contratos-saude-contratual',
  'contratos-obrigacoes-treemap',

  // Row 8: Saúde financeira + inadimplência (md + sm = 4+2)
  'financeiro-saude-financeira',
  'financeiro-inadimplencia',

  // Row 9: Financeiro detalhado (sm + sm + sm = 2+2+2)
  'financeiro-fluxo-tabs',
  'financeiro-despesas-treemap',
  'financeiro-fluxo-caixa',
];

// ─── Helper: label em português para cada módulo ─────────────────────────────

export function getModuleLabel(module: string): string {
  const labels: Record<string, string> = {
    processos:  'Processos',
    audiencias: 'Audiências',
    expedientes: 'Expedientes',
    financeiro: 'Financeiro',
    contratos:  'Contratos & Obrigações',
    pessoal:    'Pessoal & Produtividade',
  };
  return labels[module] ?? module;
}
