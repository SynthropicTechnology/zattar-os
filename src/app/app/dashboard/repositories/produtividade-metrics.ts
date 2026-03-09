/**
 * DASHBOARD FEATURE - Produtividade Metrics Repository
 *
 * Métricas de produtividade do usuário.
 * Responsabilidades:
 * - Baixas diárias/semanais/mensais
 * - Tendências e comparativos
 */

import { createClient } from '@/lib/supabase/server';
import { toDateString } from '@/lib/date-utils';
import type { ProdutividadeResumo } from '../domain';

/**
 * Obtém métricas de produtividade do usuário
 */
export async function buscarProdutividadeUsuario(
  usuarioId: number
): Promise<ProdutividadeResumo> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());

  const inicioSemanaAnterior = new Date(inicioSemana);
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  // Baixas de hoje
  const { count: baixasHoje } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', hoje.toISOString());

  // Baixas da semana
  const { count: baixasSemana } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', inicioSemana.toISOString());

  // Baixas do mês
  const { count: baixasMes } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', inicioMes.toISOString());

  // Baixas da semana anterior (para comparativo)
  const { count: baixasSemanaAnterior } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', inicioSemanaAnterior.toISOString())
    .lt('baixado_em', inicioSemana.toISOString());

  // Calcular comparativo
  const comparativoSemanaAnterior = baixasSemanaAnterior
    ? Math.round(
        (((baixasSemana || 0) - baixasSemanaAnterior) / baixasSemanaAnterior) * 100
      )
    : 0;

  // Calcular média diária
  const diasNoMes = Math.ceil(
    (hoje.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24)
  ) || 1;
  const mediaDiaria = Math.round(((baixasMes || 0) / diasNoMes) * 10) / 10;

  // Buscar baixas por dia (últimos 7 dias)
  const porDia: { data: string; baixas: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const diaStr = toDateString(dia);

    const proximoDia = new Date(dia);
    proximoDia.setDate(proximoDia.getDate() + 1);

    const { count } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId)
      .gte('baixado_em', dia.toISOString())
      .lt('baixado_em', proximoDia.toISOString());

    porDia.push({
      data: diaStr,
      baixas: count || 0,
    });
  }

  return {
    baixasHoje: baixasHoje || 0,
    baixasSemana: baixasSemana || 0,
    baixasMes: baixasMes || 0,
    mediaDiaria,
    comparativoSemanaAnterior,
    porDia,
  };
}
