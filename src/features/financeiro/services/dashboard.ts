/**
 * Serviço de Dashboard Financeiro
 *
 * Consolida métricas para widgets do dashboard (receitas/despesas, pendências,
 * vencidos, evolução mensal e top categorias) e também fornece uma projeção
 * simples de fluxo de caixa (por mês).
 *
 * Observação: este módulo substitui o serviço legado (migrado para FSD).
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { toDateString } from '@/lib/date-utils';
import type { StatusLancamento, TipoLancamento } from '../types/lancamentos';

export interface DashboardFinanceiroData {
  receitasMes: number;
  despesasMes: number;
  saldoMes: number;
  receitasPendentes: number;
  qtdReceitasPendentes: number;
  despesasPendentes: number;
  contasVencidas: number;
  valorVencido: number;
  evolucaoMensal: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    saldo: number;
  }>;
  topCategorias: Array<{
    categoria: string;
    valor: number;
    percentual: number;
  }>;
}

export interface FluxoCaixaProjetadoItem {
  mes: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

type LancamentoMinimal = {
  tipo: TipoLancamento;
  status: StatusLancamento;
  valor: number;
  data_competencia: string;
  data_vencimento: string | null;
  categoria: string | null;
};

type LancamentoJanela = {
  tipo: TipoLancamento;
  status: StatusLancamento;
  valor: number;
  data_competencia: string;
};

type LancamentoProjetado = {
  tipo: TipoLancamento;
  valor: number;
  data_competencia: string;
};

function isoDate(d: Date): string {
  return toDateString(d);
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, months: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function clampNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function getDashboardFinanceiro(usuarioId: string): Promise<DashboardFinanceiroData> {
  // Ainda não existe escopo por usuário definido para o dashboard.
  // Mantemos o parâmetro para compatibilidade futura.
  void usuarioId;

  const supabase = createServiceClient();

  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const inicioProxMes = addMonths(inicioMes, 1);

  // Pega dados do mês atual (confirmados e pendentes) num payload leve.
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('tipo, status, valor, data_competencia, data_vencimento, categoria')
    .gte('data_competencia', isoDate(inicioMes))
    .lt('data_competencia', isoDate(inicioProxMes));

  if (error) throw new Error(error.message);

  const lancamentos = (data ?? []) as unknown as LancamentoMinimal[];

  const confirmados = lancamentos.filter((l) => l.status === 'confirmado');
  const pendentes = lancamentos.filter((l) => l.status === 'pendente');

  const receitasMes = confirmados
    .filter((l) => l.tipo === 'receita')
    .reduce((acc, l) => acc + clampNumber(l.valor), 0);
  const despesasMes = confirmados
    .filter((l) => l.tipo === 'despesa')
    .reduce((acc, l) => acc + clampNumber(l.valor), 0);

  const qtdReceitasPendentes = pendentes
    .filter((l) => l.tipo === 'receita')
    .length;
  const receitasPendentes = pendentes
    .filter((l) => l.tipo === 'receita')
    .reduce((acc, l) => acc + clampNumber(l.valor), 0);
  const despesasPendentes = pendentes
    .filter((l) => l.tipo === 'despesa')
    .reduce((acc, l) => acc + clampNumber(l.valor), 0);

  const hojeIso = isoDate(hoje);
  const pendentesVencidas = pendentes.filter((l) => l.data_vencimento && l.data_vencimento < hojeIso);
  const contasVencidas = pendentesVencidas.length;
  const valorVencido = pendentesVencidas.reduce((acc, l) => acc + clampNumber(l.valor), 0);

  // Evolução mensal: últimos 12 meses (inclui o mês atual).
  const meses = 12;
  const inicioJanela = addMonths(inicioMes, -(meses - 1));
  const fimJanela = addMonths(inicioMes, 1);

  const { data: dataJanela, error: errorJanela } = await supabase
    .from('lancamentos_financeiros')
    .select('tipo, status, valor, data_competencia')
    .gte('data_competencia', isoDate(inicioJanela))
    .lt('data_competencia', isoDate(fimJanela));

  if (errorJanela) throw new Error(errorJanela.message);

  const byMes = new Map<string, { receitas: number; despesas: number }>();
  for (let i = 0; i < meses; i++) {
    const k = monthKey(addMonths(inicioJanela, i));
    byMes.set(k, { receitas: 0, despesas: 0 });
  }

  const janela = (dataJanela ?? []) as unknown as LancamentoJanela[];

  for (const row of janela) {
    if (row.status !== 'confirmado') continue;
    const key = String(row.data_competencia).slice(0, 7);
    if (!byMes.has(key)) continue;
    const bucket = byMes.get(key)!;
    if (row.tipo === 'receita') bucket.receitas += clampNumber(row.valor);
    if (row.tipo === 'despesa') bucket.despesas += clampNumber(row.valor);
  }

  const evolucaoMensal = Array.from(byMes.entries()).map(([mes, v]) => ({
    mes,
    receitas: v.receitas,
    despesas: v.despesas,
    saldo: v.receitas - v.despesas,
  }));

  // Top categorias (despesas confirmadas do mês)
  const despesasPorCategoria = new Map<string, number>();
  const despesasConfirmadasMes = confirmados.filter((l) => l.tipo === 'despesa');
  const totalDespesas = despesasConfirmadasMes.reduce((acc, l) => acc + clampNumber(l.valor), 0);

  for (const l of despesasConfirmadasMes) {
    const categoria = l.categoria || 'sem_categoria';
    despesasPorCategoria.set(categoria, (despesasPorCategoria.get(categoria) || 0) + clampNumber(l.valor));
  }

  const topCategorias = Array.from(despesasPorCategoria.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0,
    }));

  return {
    receitasMes,
    despesasMes,
    saldoMes: receitasMes - despesasMes,
    receitasPendentes,
    qtdReceitasPendentes,
    despesasPendentes,
    contasVencidas,
    valorVencido,
    evolucaoMensal,
    topCategorias,
  };
}

/**
 * Projeção simples de fluxo de caixa mensal com base em lançamentos pendentes.
 */
export async function getFluxoCaixaProjetadoDashboard(meses: number): Promise<FluxoCaixaProjetadoItem[]> {
  const supabase = createServiceClient();

  const mesesLimit = Math.min(Math.max(meses, 1), 24);
  const hoje = new Date();
  const inicio = startOfMonth(hoje);
  const fim = addMonths(inicio, mesesLimit);

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('tipo, status, valor, data_competencia, data_vencimento')
    .eq('status', 'pendente')
    .gte('data_competencia', isoDate(inicio))
    .lt('data_competencia', isoDate(fim));

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as LancamentoProjetado[];

  const buckets = new Map<string, { entradas: number; saidas: number }>();
  for (let i = 0; i < mesesLimit; i++) {
    const k = monthKey(addMonths(inicio, i));
    buckets.set(k, { entradas: 0, saidas: 0 });
  }

  for (const r of rows) {
    const key = String(r.data_competencia).slice(0, 7);
    if (!buckets.has(key)) continue;
    const b = buckets.get(key)!;
    const v = clampNumber(r.valor);
    if (r.tipo === 'receita') b.entradas += v;
    if (r.tipo === 'despesa') b.saidas += v;
  }

  let saldoAcumulado = 0;
  return Array.from(buckets.entries()).map(([mesKeyStr, v]) => {
    const saldo = v.entradas - v.saidas;
    saldoAcumulado += saldo;
    return {
      mes: mesKeyStr,
      entradas: v.entradas,
      saidas: v.saidas,
      saldo,
      saldoAcumulado,
    };
  });
}


