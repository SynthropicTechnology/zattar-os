/**
 * DASHBOARD FEATURE - Produtividade Metrics Repository
 *
 * Métricas de produtividade do usuário.
 * Responsabilidades:
 * - Baixas diárias/semanais/mensais
 * - Tendências e comparativos
 *
 * OTIMIZAÇÃO: Todas as queries são executadas em paralelo com Promise.all()
 * em vez de sequencialmente. O histórico de 7 dias usa uma única query
 * com range de datas em vez de 7 queries individuais.
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

  // Início do range de 7 dias (para histórico diário)
  const inicio7dias = new Date(hoje);
  inicio7dias.setDate(inicio7dias.getDate() - 6);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // Executar TODAS as queries em paralelo
  const [
    { count: baixasHoje },
    { count: baixasSemana },
    { count: baixasMes },
    { count: baixasSemanaAnterior },
    { data: baixas7dias },
  ] = await Promise.all([
    // Baixas de hoje
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId)
      .gte('baixado_em', hoje.toISOString()),

    // Baixas da semana
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId)
      .gte('baixado_em', inicioSemana.toISOString()),

    // Baixas do mês
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId)
      .gte('baixado_em', inicioMes.toISOString()),

    // Baixas da semana anterior (para comparativo)
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId)
      .gte('baixado_em', inicioSemanaAnterior.toISOString())
      .lt('baixado_em', inicioSemana.toISOString()),

    // Baixas dos últimos 7 dias — UMA query com range, agrupamento em JS
    supabase
      .from('expedientes')
      .select('baixado_em')
      .eq('responsavel_id', usuarioId)
      .gte('baixado_em', inicio7dias.toISOString())
      .lt('baixado_em', amanha.toISOString())
      .not('baixado_em', 'is', null),
  ]);

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

  // Agrupar baixas por dia a partir dos dados brutos (substitui 7 queries individuais)
  const contagemPorDia = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    contagemPorDia.set(toDateString(dia), 0);
  }

  (baixas7dias || []).forEach((b) => {
    if (b.baixado_em) {
      const diaStr = toDateString(new Date(b.baixado_em));
      if (contagemPorDia.has(diaStr)) {
        contagemPorDia.set(diaStr, (contagemPorDia.get(diaStr) || 0) + 1);
      }
    }
  });

  const porDia = Array.from(contagemPorDia.entries()).map(([data, baixas]) => ({
    data,
    baixas,
  }));

  return {
    baixasHoje: baixasHoje || 0,
    baixasSemana: baixasSemana || 0,
    baixasMes: baixasMes || 0,
    mediaDiaria,
    comparativoSemanaAnterior,
    porDia,
  };
}
