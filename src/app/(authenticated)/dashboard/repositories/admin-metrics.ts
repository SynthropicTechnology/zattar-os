/**
 * DASHBOARD FEATURE - Admin Metrics Repository
 *
 * Métricas administrativas do escritório.
 * Responsabilidades:
 * - Métricas gerais do escritório
 * - Carga de trabalho por usuário
 * - Status de capturas
 * - Performance de advogados
 * - Dados de usuário
 *
 * OTIMIZAÇÃO:
 * - buscarMetricasEscritorio: queries paralelizadas com Promise.all()
 * - buscarCargaUsuarios: eliminado N+1 (queries por usuário em paralelo)
 * - buscarPerformanceAdvogados: eliminado N+1 (queries por usuário em paralelo)
 */

import { createClient } from '@/lib/supabase/server';
import type {
  MetricasEscritorio,
  CargaUsuario,
  StatusCaptura,
  PerformanceAdvogado,
} from '../domain';

/**
 * Obtém métricas consolidadas do escritório
 *
 * IMPORTANTE: Contagem de processos baseada em número CNJ único (numero_processo),
 * pois um mesmo processo pode ter múltiplos registros em instâncias diferentes.
 */
export async function buscarMetricasEscritorio(): Promise<MetricasEscritorio> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const inicioMesAnterior = new Date(inicioMes);
  inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

  const fimMesAnterior = new Date(inicioMes);

  // Executar TODAS as queries em paralelo
  const [
    totalProcessosResult,
    processosAtivosResult,
    processosArquivadosResult,
    audienciasTotalResult,
    audienciasMesResult,
    pendentesResult,
    manuaisResult,
    pendentesVencidosResult,
    manuaisVencidosResult,
    totalUsuariosResult,
    totalBaixadosResult,
    baixadosNoPrazoResult,
    processosNovosResult,
    processosNovosAnteriorResult,
    audienciasMesAnteriorResult,
  ] = await Promise.all([
    // Total de processos (únicos por número CNJ)
    supabase.rpc('count_processos_unicos', {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }),
    // Processos ativos
    supabase.rpc('count_processos_unicos', {
      p_origem: 'acervo_geral',
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }),
    // Processos arquivados
    supabase.rpc('count_processos_unicos', {
      p_origem: 'arquivado',
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }),
    // Total de audiências
    supabase
      .from('audiencias')
      .select('id', { count: 'exact', head: true }),
    // Audiências do mês
    supabase
      .from('audiencias')
      .select('id', { count: 'exact', head: true })
      .gte('data_inicio', inicioMes.toISOString()),
    // Expedientes pendentes
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .is('baixado_em', null),
    // Expedientes manuais pendentes
    supabase
      .from('expedientes_manuais')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'concluido'),
    // Expedientes vencidos
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .is('baixado_em', null)
      .lt('data_prazo_legal_parte', hoje.toISOString()),
    // Expedientes manuais vencidos
    supabase
      .from('expedientes_manuais')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'concluido')
      .lt('prazo_fatal', hoje.toISOString()),
    // Total de usuários ativos
    supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true),
    // Total de expedientes baixados
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .not('baixado_em', 'is', null),
    // Baixados no prazo
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .not('baixado_em', 'is', null)
      .eq('prazo_vencido', false),
    // Processos novos este mês
    supabase.rpc('count_processos_unicos', {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: inicioMes.toISOString(),
      p_data_fim: null,
    }),
    // Processos novos mês anterior
    supabase.rpc('count_processos_unicos', {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: inicioMesAnterior.toISOString(),
      p_data_fim: fimMesAnterior.toISOString(),
    }),
    // Audiências mês anterior
    supabase
      .from('audiencias')
      .select('id', { count: 'exact', head: true })
      .gte('data_inicio', inicioMesAnterior.toISOString())
      .lt('data_inicio', fimMesAnterior.toISOString()),
  ]);

  const totalProcessos = totalProcessosResult.error ? 0 : (totalProcessosResult.data as number) || 0;
  const processosAtivos = processosAtivosResult.error ? 0 : (processosAtivosResult.data as number) || 0;
  const processosArquivados = processosArquivadosResult.error ? 0 : (processosArquivadosResult.data as number) || 0;

  const totalExpedientes = (pendentesResult.count || 0) + (manuaisResult.count || 0);
  const expedientesVencidos = (pendentesVencidosResult.count || 0) + (manuaisVencidosResult.count || 0);

  const totalBaixados = totalBaixadosResult.count || 0;
  const baixadosNoPrazo = baixadosNoPrazoResult.count || 0;
  const taxaResolucao = totalBaixados
    ? Math.round((baixadosNoPrazo / totalBaixados) * 100)
    : 100;

  const processosNovos = processosNovosResult.error ? 0 : (processosNovosResult.data as number) || 0;
  const processosNovosAnterior = processosNovosAnteriorResult.error
    ? 0
    : (processosNovosAnteriorResult.data as number) || 0;

  const comparativoProcessos = processosNovosAnterior
    ? Math.round(
        ((processosNovos - processosNovosAnterior) / processosNovosAnterior) * 100
      )
    : 0;

  const audienciasMes = audienciasMesResult.count || 0;
  const audienciasMesAnterior = audienciasMesAnteriorResult.count || 0;
  const comparativoAudiencias = audienciasMesAnterior
    ? Math.round(
        ((audienciasMes - audienciasMesAnterior) / audienciasMesAnterior) * 100
      )
    : 0;

  return {
    totalProcessos,
    processosAtivos,
    processosArquivados,
    processosAtivosUnicos: processosAtivos,
    totalAudiencias: audienciasTotalResult.count || 0,
    audienciasMes,
    totalExpedientes,
    expedientesPendentes: totalExpedientes,
    expedientesVencidos,
    totalUsuarios: totalUsuariosResult.count || 0,
    taxaResolucao,
    comparativoMesAnterior: {
      processos: comparativoProcessos,
      audiencias: comparativoAudiencias,
      expedientes: 0,
    },
    evolucaoMensal: [],
  };
}

/**
 * Obtém carga de trabalho por usuário
 *
 * OTIMIZAÇÃO: Em vez de 4 queries por usuário (N+1), busca todos os usuários
 * e depois executa as 4 queries de cada usuário em paralelo com Promise.all().
 */
export async function buscarCargaUsuarios(): Promise<CargaUsuario[]> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('ativo', true);

  if (!usuarios?.length) return [];

  // Buscar dados de TODOS os usuários em paralelo
  const cargas = await Promise.all(
    usuarios.map(async (usuario) => {
      const [processosResult, pendentesResult, manuaisResult, audienciasResult] =
        await Promise.all([
          supabase.rpc('count_processos_unicos', {
            p_origem: 'acervo_geral',
            p_responsavel_id: usuario.id,
            p_data_inicio: null,
            p_data_fim: null,
          }),
          supabase
            .from('expedientes')
            .select('id', { count: 'exact', head: true })
            .eq('responsavel_id', usuario.id)
            .is('baixado_em', null),
          supabase
            .from('expedientes_manuais')
            .select('id', { count: 'exact', head: true })
            .eq('responsavel_id', usuario.id)
            .neq('status', 'concluido'),
          supabase
            .from('audiencias')
            .select('id', { count: 'exact', head: true })
            .or(`responsavel_id.eq.${usuario.id},responsavel_id.is.null`)
            .gte('data_inicio', hoje.toISOString())
            .lt('data_inicio', em7dias.toISOString()),
        ]);

      const processosAtivos = processosResult.error
        ? 0
        : (processosResult.data as number) || 0;
      const expedientesPendentes =
        (pendentesResult.count || 0) + (manuaisResult.count || 0);
      const audienciasProximas = audienciasResult.count || 0;

      return {
        usuario_id: usuario.id,
        usuario_nome: usuario.nome_exibicao,
        processosAtivos,
        expedientesPendentes,
        audienciasProximas,
        cargaTotal:
          processosAtivos + expedientesPendentes * 2 + audienciasProximas * 3,
      };
    })
  );

  return cargas.sort((a, b) => b.cargaTotal - a.cargaTotal);
}

/**
 * Obtém status das últimas capturas por TRT
 */
export async function buscarStatusCapturas(): Promise<StatusCaptura[]> {
  const supabase = await createClient();

  const { data: capturas } = await supabase
    .from('capturas_log')
    .select('*')
    .order('iniciado_em', { ascending: false })
    .limit(50);

  if (!capturas?.length) return [];

  const statusMap = new Map<string, StatusCaptura>();

  capturas.forEach((cap) => {
    const resultado = cap.resultado as Record<string, unknown> | null;
    const trt = (resultado?.tribunal as string) || 'N/A';
    const grau = (resultado?.grau as string) || 'primeiro_grau';
    const key = `${trt}-${grau}`;

    if (!statusMap.has(key)) {
      statusMap.set(key, {
        trt,
        grau,
        ultimaExecucao: cap.concluido_em || cap.iniciado_em,
        status: cap.status === 'completed' ? 'sucesso' : cap.status === 'failed' ? 'erro' : 'pendente',
        mensagemErro: cap.erro || null,
        processosCapturados: (resultado?.processosCapturados as number) || 0,
        audienciasCapturadas: (resultado?.audienciasCapturadas as number) || 0,
        expedientesCapturados: (resultado?.expedientesCapturados as number) || 0,
      });
    }
  });

  return Array.from(statusMap.values());
}

/**
 * Obtém performance dos advogados
 *
 * OTIMIZAÇÃO: Em vez de 5 queries por usuário (N+1), executa as queries
 * de cada usuário em paralelo com Promise.all().
 */
export async function buscarPerformanceAdvogados(): Promise<PerformanceAdvogado[]> {
  const supabase = await createClient();

  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('ativo', true);

  if (!usuarios?.length) return [];

  // Buscar performance de TODOS os usuários em paralelo
  const performances = await Promise.all(
    usuarios.map(async (usuario) => {
      const [
        baixasSemanaResult,
        baixasMesResult,
        totalBaixadosResult,
        baixadosNoPrazoResult,
        expedientesVencidosResult,
      ] = await Promise.all([
        supabase
          .from('expedientes')
          .select('id', { count: 'exact', head: true })
          .eq('responsavel_id', usuario.id)
          .gte('baixado_em', inicioSemana.toISOString()),
        supabase
          .from('expedientes')
          .select('id', { count: 'exact', head: true })
          .eq('responsavel_id', usuario.id)
          .gte('baixado_em', inicioMes.toISOString()),
        supabase
          .from('expedientes')
          .select('id', { count: 'exact', head: true })
          .eq('responsavel_id', usuario.id)
          .not('baixado_em', 'is', null),
        supabase
          .from('expedientes')
          .select('id', { count: 'exact', head: true })
          .eq('responsavel_id', usuario.id)
          .not('baixado_em', 'is', null)
          .eq('prazo_vencido', false),
        supabase
          .from('expedientes')
          .select('id', { count: 'exact', head: true })
          .eq('responsavel_id', usuario.id)
          .is('baixado_em', null)
          .lt('data_prazo_legal_parte', hoje.toISOString()),
      ]);

      const totalBaixados = totalBaixadosResult.count || 0;
      const baixadosNoPrazo = baixadosNoPrazoResult.count || 0;
      const taxaCumprimentoPrazo = totalBaixados
        ? Math.round((baixadosNoPrazo / totalBaixados) * 100)
        : 100;

      return {
        usuario_id: usuario.id,
        usuario_nome: usuario.nome_exibicao,
        baixasSemana: baixasSemanaResult.count || 0,
        baixasMes: baixasMesResult.count || 0,
        taxaCumprimentoPrazo,
        expedientesVencidos: expedientesVencidosResult.count || 0,
      };
    })
  );

  return performances.sort((a, b) => b.baixasMes - a.baixasMes);
}

/**
 * Busca dados do usuário
 */
export async function buscarUsuario(usuarioId: number): Promise<{
  id: number;
  nome: string;
}> {
  const supabase = await createClient();

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('id', usuarioId)
    .single();

  if (error || !usuario) {
    throw new Error('Usuário não encontrado');
  }

  return {
    id: usuario.id,
    nome: usuario.nome_exibicao,
  };
}
