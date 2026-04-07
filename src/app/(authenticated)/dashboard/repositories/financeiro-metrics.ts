/**
 * DASHBOARD FEATURE - Financeiro Metrics Repository
 *
 * Dados financeiros consolidados para o dashboard.
 * Responsabilidades:
 * - Saldo, contas a pagar/receber, alertas
 */

import { getDashboardFinanceiro } from '@/app/(authenticated)/financeiro/services/dashboard';
import { formatarMoeda } from './shared/formatters';
import { createClient } from '@/lib/supabase/server';
import type { SemanticTone } from '@/lib/design-system';
import type { DadosFinanceirosConsolidados } from '../domain';

/**
 * Busca dados financeiros consolidados para o dashboard
 * Consolida saldo, contas a pagar/receber e alertas em uma única chamada
 */
export async function buscarDadosFinanceirosConsolidados(
  usuarioId?: number
): Promise<DadosFinanceirosConsolidados> {
  try {
    // Buscar dados do dashboard financeiro
    const dashboardData = await getDashboardFinanceiro(usuarioId?.toString() || 'system');

    // Gerar alertas baseado nos dados
    const alertas: { tipo: string; mensagem: string }[] = [];

    if (dashboardData.contasVencidas > 0) {
      alertas.push({
        tipo: 'danger',
        mensagem: `${dashboardData.contasVencidas} conta(s) vencida(s) no valor de ${formatarMoeda(dashboardData.valorVencido)}`,
      });
    }

    if (dashboardData.despesasMes > dashboardData.receitasMes) {
      alertas.push({
        tipo: 'warning',
        mensagem: 'Despesas do mês superam as receitas',
      });
    }

    return {
      saldoTotal: dashboardData.saldoMes || 0,
      contasPagar: {
        quantidade: dashboardData.qtdDespesasPendentes || 0,
        valor: dashboardData.despesasPendentes || 0,
      },
      contasReceber: {
        quantidade: dashboardData.qtdReceitasPendentes || 0,
        valor: dashboardData.receitasPendentes || 0,
      },
      alertas,
    };
  } catch (error) {
    console.error('Erro ao buscar dados financeiros consolidados:', error);
    // Retornar dados zerados em caso de erro
    return {
      saldoTotal: 0,
      contasPagar: { quantidade: 0, valor: 0 },
      contasReceber: { quantidade: 0, valor: 0 },
      alertas: [],
    };
  }
}

/**
 * Busca métricas financeiras detalhadas para widgets secundários.
 * Inclui saldo trend, aging de contas, despesas por categoria, DRE e fluxo mensal.
 */
export async function buscarFinanceiroDetalhado(
  _usuarioId?: number
): Promise<{
  saldoTrend: number[];
  contasReceberAging: { faixa: string; valor: number; tone: SemanticTone }[];
  contasPagarAging: { faixa: string; valor: number; tone: SemanticTone }[];
  despesasPorCategoria: { categoria: string; valor: number; tone: SemanticTone }[];
  dreComparativo: { receita: number[]; despesa: number[]; resultado: number[] };
  fluxoCaixaMensal: { mes: string; receita: number; despesa: number }[];
}> {
  const supabase = await createClient();

  const hoje = new Date();
  const dozeAtras = new Date(hoje);
  dozeAtras.setMonth(dozeAtras.getMonth() - 12);

  // Buscar lançamentos dos últimos 12 meses
  const { data: lancamentos, error } = await supabase
    .from('lancamentos_financeiros')
    .select('id, tipo, valor, data_vencimento, data_efetivacao, categoria, status')
    .gte('data_vencimento', dozeAtras.toISOString());

  if (error) {
    console.error('[Dashboard] Erro ao buscar financeiro detalhado:', error);
    return {
      saldoTrend: [],
      contasReceberAging: [],
      contasPagarAging: [],
      despesasPorCategoria: [],
      dreComparativo: { receita: [], despesa: [], resultado: [] },
      fluxoCaixaMensal: [],
    };
  }

  const data = lancamentos || [];
  const mesesLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // --- Fluxo de caixa mensal e DRE (últimos 12 meses → último 6 para fluxo) ---
  const receitaMensal: number[] = [];
  const despesaMensal: number[] = [];
  const resultadoMensal: number[] = [];
  const fluxoCaixaMensal: { mes: string; receita: number; despesa: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ano = d.getFullYear();
    const mes = d.getMonth();

    const doMes = data.filter((l) => {
      const dv = new Date(l.data_vencimento);
      return dv.getFullYear() === ano && dv.getMonth() === mes;
    });

    const receita = doMes.filter((l) => l.tipo === 'receita').reduce((s, l) => s + (l.valor || 0), 0);
    const despesa = doMes.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + (l.valor || 0), 0);

    receitaMensal.push(receita);
    despesaMensal.push(despesa);
    resultadoMensal.push(receita - despesa);

    if (i < 6) {
      fluxoCaixaMensal.push({ mes: mesesLabel[mes], receita, despesa });
    }
  }

  // --- Saldo trend (acumulado 12 meses) ---
  let saldoAcumulado = 0;
  const saldoTrend = resultadoMensal.map((r) => {
    saldoAcumulado += r;
    return saldoAcumulado;
  });

  // --- Aging: tons semânticos (do menor ao maior risco) ---
  const AGING_TONES: Record<string, SemanticTone> = {
    avencer: 'success',
    ate30: 'chart-4',
    '30_60': 'warning',
    '60_90': 'chart-2',
    '90mais': 'destructive',
  };

  const contasReceber = data.filter((l) => l.tipo === 'receita' && l.status !== 'pago');
  const contasReceberAging = calcularAging(contasReceber, hoje, AGING_TONES);

  // --- Aging de contas a pagar ---
  const contasPagar = data.filter((l) => l.tipo === 'despesa' && l.status !== 'pago');
  const contasPagarAging = calcularAging(contasPagar, hoje, AGING_TONES);

  // --- Despesas por categoria (mês atual) ---
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  // Categorias são neutras — tributário é custo normal, não alerta.
  // Ver TONE-ACCURACY-REPORT.md para justificativa.
  const CATEGORIA_TONES: Record<string, SemanticTone> = {
    'Pessoal': 'primary',
    'Aluguel': 'chart-2',
    'Serviços': 'chart-3',
    'Tributário': 'chart-4',
    'Outros': 'neutral',
  };
  const despesasMes = data.filter((l) => {
    const dv = new Date(l.data_vencimento);
    return l.tipo === 'despesa' && dv.getFullYear() === anoAtual && dv.getMonth() === mesAtual;
  });
  const catMap = new Map<string, number>();
  despesasMes.forEach((l) => {
    const cat = l.categoria || 'Outros';
    catMap.set(cat, (catMap.get(cat) || 0) + (l.valor || 0));
  });
  const despesasPorCategoria = Array.from(catMap.entries())
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      tone: CATEGORIA_TONES[categoria] ?? 'neutral' as SemanticTone,
    }))
    .sort((a, b) => b.valor - a.valor);

  return {
    saldoTrend,
    contasReceberAging,
    contasPagarAging,
    despesasPorCategoria,
    dreComparativo: { receita: receitaMensal, despesa: despesaMensal, resultado: resultadoMensal },
    fluxoCaixaMensal,
  };
}

function calcularAging(
  contas: { data_vencimento: string; valor: number | null }[],
  hoje: Date,
  tones: Record<string, SemanticTone>
): { faixa: string; valor: number; tone: SemanticTone }[] {
  const faixas = { avencer: 0, ate30: 0, '30_60': 0, '60_90': 0, '90mais': 0 };

  contas.forEach((c) => {
    const venc = new Date(c.data_vencimento);
    const diasAtraso = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
    const valor = c.valor || 0;

    if (diasAtraso < 0) faixas.avencer += valor;
    else if (diasAtraso <= 30) faixas.ate30 += valor;
    else if (diasAtraso <= 60) faixas['30_60'] += valor;
    else if (diasAtraso <= 90) faixas['60_90'] += valor;
    else faixas['90mais'] += valor;
  });

  return [
    { faixa: 'A vencer', valor: faixas.avencer, tone: tones.avencer },
    { faixa: 'Até 30d', valor: faixas.ate30, tone: tones.ate30 },
    { faixa: '30–60d', valor: faixas['30_60'], tone: tones['30_60'] },
    { faixa: '60–90d', valor: faixas['60_90'], tone: tones['60_90'] },
    { faixa: '90+ dias', valor: faixas['90mais'], tone: tones['90mais'] },
  ].filter((f) => f.valor > 0);
}
