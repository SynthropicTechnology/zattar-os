/**
 * DASHBOARD FEATURE - Expedientes Metrics Repository
 *
 * Métricas e estatísticas de expedientes.
 * Responsabilidades:
 * - Resumo de expedientes pendentes
 * - Listagem de expedientes urgentes
 * - Total de expedientes pendentes do escritório
 */

import { createClient } from '@/lib/supabase/server';
import { toDateString } from '@/lib/date-utils';
import type { SemanticTone } from '@/lib/design-system';
import type { ExpedientesResumo, ExpedienteUrgente } from '../domain';

/**
 * Obtém resumo de expedientes do usuário
 *
 * NOTA: Usa LEFT JOIN implícito para não excluir expedientes sem tipo definido.
 * Inclui expedientes com prazo próximo mesmo sem responsável (para admins).
 */
export async function buscarExpedientesResumo(
  responsavelId?: number
): Promise<ExpedientesResumo> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  // Buscar expedientes (não baixados)
  // Nota: o join com tipos_expedientes é opcional (left join implícito no Supabase)
  let pendentesQuery = supabase
    .from('expedientes')
    .select(`
      id,
      data_prazo_legal_parte,
      tipo_expediente_id,
      responsavel_id,
      tipos_expedientes:tipo_expediente_id (tipo_expediente)
    `)
    .is('baixado_em', null);

  if (responsavelId) {
    pendentesQuery = pendentesQuery.eq('responsavel_id', responsavelId);
  }

  const { data: pendentes, error: pendentesError } = await pendentesQuery;

  if (pendentesError) {
    console.error('[Dashboard] Erro ao buscar expedientes pendentes:', pendentesError);
    console.error('[Dashboard] Query params:', { responsavelId });
    throw new Error(`Erro ao buscar pendentes: ${pendentesError.message}`);
  }

  // Log de debug para diagnóstico
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Expedientes encontrados:', {
      pendentes: pendentes?.length || 0,
      responsavelId,
    });
  }

  // Consolidar todos os expedientes
  const todosExpedientes = (pendentes || []).map((p) => ({
    prazo: p.data_prazo_legal_parte,
    tipo: (p.tipos_expedientes as { tipo_expediente?: string })?.tipo_expediente || 'Sem tipo',
  }));

  const total = todosExpedientes.length;

  const hojeStr = toDateString(hoje);
  const amanhaStr = toDateString(amanha);

  let vencidos = 0;
  let venceHoje = 0;
  let venceAmanha = 0;
  let proximos7dias = 0;

  todosExpedientes.forEach((exp) => {
    if (!exp.prazo) return;

    const prazoDate = new Date(exp.prazo);
    prazoDate.setHours(0, 0, 0, 0);
    const prazoStr = toDateString(prazoDate);

    if (prazoDate < hoje) {
      vencidos++;
    } else if (prazoStr === hojeStr) {
      venceHoje++;
    } else if (prazoStr === amanhaStr) {
      venceAmanha++;
    }

    if (prazoDate >= hoje && prazoDate < em7dias) {
      proximos7dias++;
    }
  });

  // Agrupar por tipo
  const porTipoMap = new Map<string, number>();
  todosExpedientes.forEach((exp) => {
    porTipoMap.set(exp.tipo, (porTipoMap.get(exp.tipo) || 0) + 1);
  });
  const porTipo = Array.from(porTipoMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    vencidos,
    venceHoje,
    venceAmanha,
    proximos7dias,
    porTipo,
  };
}

/**
 * Obtém lista de expedientes urgentes
 *
 * NOTA: Ordena por urgência (vencidos primeiro, depois por prazo).
 * O cálculo de dias_restantes usa timezone-aware (setHours para normalizar).
 */
export async function buscarExpedientesUrgentes(
  responsavelId?: number,
  limite: number = 5
): Promise<ExpedienteUrgente[]> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar expedientes urgentes
  let pendentesQuery = supabase
    .from('expedientes_com_origem')
    .select(`
      id,
      processo_id,
      numero_processo,
      descricao_orgao_julgador,
      classe_judicial,
      nome_parte_autora,
      nome_parte_re,
      nome_parte_autora_origem,
      nome_parte_re_origem,
      orgao_julgador_origem,
      data_prazo_legal_parte,
      prazo_vencido,
      responsavel_id,
      origem,
      tipos_expedientes:tipo_expediente_id (tipo_expediente),
      usuarios:responsavel_id (nome_exibicao)
    `)
    .is('baixado_em', null)
    .not('data_prazo_legal_parte', 'is', null)
    .order('data_prazo_legal_parte', { ascending: true })
    .limit(limite);

  if (responsavelId) {
    pendentesQuery = pendentesQuery.eq('responsavel_id', responsavelId);
  }

  const { data: pendentes, error: pendentesError } = await pendentesQuery;

  if (pendentesError) {
    console.error('[Dashboard] Erro ao buscar expedientes urgentes:', pendentesError);
  }

  // Log de debug para diagnóstico
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Expedientes urgentes encontrados:', {
      pendentes: pendentes?.length || 0,
      responsavelId,
    });
  }

  // Consolidar e ordenar
  const todos: ExpedienteUrgente[] = (pendentes || []).map((p) => {
    const prazoDate = new Date(p.data_prazo_legal_parte);
    prazoDate.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil(
      (prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: p.id,
      processo_id: p.processo_id,
      numero_processo: p.numero_processo,
      tipo_expediente: (p.tipos_expedientes as { tipo_expediente?: string })?.tipo_expediente || 'Pendente',
      descricao_orgao_julgador: p.orgao_julgador_origem || p.descricao_orgao_julgador,
      classe_judicial: p.classe_judicial,
      nome_parte_autora: p.nome_parte_autora_origem || p.nome_parte_autora,
      nome_parte_re: p.nome_parte_re_origem || p.nome_parte_re,
      prazo_fatal: p.data_prazo_legal_parte,
      status: diasRestantes < 0 ? 'vencido' : 'pendente',
      dias_restantes: diasRestantes,
      responsavel_id: p.responsavel_id,
      responsavel_nome: (p.usuarios as { nome_exibicao?: string })?.nome_exibicao || null,
      origem: p.origem === 'expedientes_manuais' ? 'expedientes_manuais' : 'expedientes',
    };
  });

  return todos
    .sort((a, b) => {
      if (a.dias_restantes < 0 && b.dias_restantes >= 0) return -1;
      if (a.dias_restantes >= 0 && b.dias_restantes < 0) return 1;
      return a.dias_restantes - b.dias_restantes;
    })
    .slice(0, limite);
}

/**
 * Busca métricas detalhadas de expedientes para widgets secundários.
 */
export async function buscarExpedientesDetalhados(
  responsavelId?: number
): Promise<{
  porOrigem: { origem: string; count: number; tone: SemanticTone }[];
  resultadoDecisao: { resultado: string; count: number; tone: SemanticTone }[];
  volumeSemanal: { dia: string; recebidos: number; baixados: number }[];
  prazoMedio: number[];
  calendarioPrazos: number[];
  tempoRespostaMedio: number;
  taxaCumprimento: number;
  backlogAtual: number;
}> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar expedientes dos últimos 60 dias para análise
  const sessenta = new Date(hoje);
  sessenta.setDate(sessenta.getDate() - 60);

  // expedientes_com_origem NÃO tem coluna resultado_decisao
  let query = supabase
    .from('expedientes_com_origem')
    .select('id, data_prazo_legal_parte, baixado_em, origem, created_at')
    .gte('created_at', sessenta.toISOString());

  if (responsavelId) {
    query = query.eq('responsavel_id', responsavelId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Dashboard] Erro ao buscar expedientes detalhados:', error);
    return {
      porOrigem: [],
      resultadoDecisao: [],
      volumeSemanal: [],
      prazoMedio: [],
      calendarioPrazos: [],
      tempoRespostaMedio: 0,
      taxaCumprimento: 0,
      backlogAtual: 0,
    };
  }

  const expedientes = data || [];

  // --- Distribuição por origem ---
  const ORIGEM_TONES: Record<string, SemanticTone> = {
    'Captura PJE': 'info',
    'Comunica CNJ': 'warning',
    'Manual': 'neutral',
  };
  const origemMap = new Map<string, number>();
  expedientes.forEach((e) => {
    let origemLabel: string;
    if (e.origem === 'expedientes_manuais') origemLabel = 'Manual';
    else origemLabel = 'Captura PJE'; // Default — em produção seria mais granular
    origemMap.set(origemLabel, (origemMap.get(origemLabel) || 0) + 1);
  });
  const porOrigem = Array.from(origemMap.entries()).map(([origem, count]) => ({
    origem,
    count,
    tone: ORIGEM_TONES[origem] ?? 'neutral' as SemanticTone,
  }));

  // --- Resultado das decisões ---
  // resultado_decisao não existe na view — retornar vazio
  const resultadoDecisao: { resultado: string; count: number; tone: SemanticTone }[] = [];

  // --- Volume semanal (semana atual) ---
  const diasLabel = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const inicioSemana = new Date(hoje);
  const diaSemana = inicioSemana.getDay();
  inicioSemana.setDate(inicioSemana.getDate() - ((diaSemana + 6) % 7));

  const volumeSemanal: { dia: string; recebidos: number; baixados: number }[] = diasLabel.map((dia, i) => {
    const diaDate = new Date(inicioSemana);
    diaDate.setDate(diaDate.getDate() + i);
    const diaStr = toDateString(diaDate);

    const recebidos = expedientes.filter((e) => toDateString(new Date(e.created_at)) === diaStr).length;
    const baixados = expedientes.filter((e) => e.baixado_em && toDateString(new Date(e.baixado_em)) === diaStr).length;

    return { dia, recebidos, baixados };
  });

  // --- Prazo médio (últimas 8 semanas) ---
  const prazoMedio: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const semanaFim = new Date(hoje);
    semanaFim.setDate(semanaFim.getDate() - i * 7);
    const semanaInicio = new Date(semanaFim);
    semanaInicio.setDate(semanaInicio.getDate() - 7);

    const baixados = expedientes.filter((e) => {
      if (!e.baixado_em) return false;
      const baixa = new Date(e.baixado_em);
      return baixa >= semanaInicio && baixa < semanaFim;
    });

    if (baixados.length > 0) {
      const totalDias = baixados.reduce((sum, e) => {
        const criado = new Date(e.created_at);
        const baixado = new Date(e.baixado_em!);
        return sum + Math.max(0, (baixado.getTime() - criado.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      prazoMedio.push(Number((totalDias / baixados.length).toFixed(1)));
    } else {
      prazoMedio.push(prazoMedio.length > 0 ? prazoMedio[prazoMedio.length - 1] : 5);
    }
  }

  // --- Calendário de prazos (heatmap 35 dias) ---
  const calendarioPrazos: number[] = new Array(35).fill(0);
  const inicioHeatmap = new Date(hoje);
  inicioHeatmap.setDate(inicioHeatmap.getDate() - 34);
  expedientes.forEach((e) => {
    if (!e.data_prazo_legal_parte) return;
    const prazo = new Date(e.data_prazo_legal_parte);
    prazo.setHours(0, 0, 0, 0);
    const diff = Math.floor((prazo.getTime() - inicioHeatmap.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 35) {
      calendarioPrazos[diff]++;
    }
  });

  // --- Métricas derivadas ---
  const baixadosTotal = expedientes.filter((e) => e.baixado_em);
  const tempoRespostaMedio = prazoMedio.length > 0 ? prazoMedio[prazoMedio.length - 1] : 0;

  const cumpridos = baixadosTotal.filter((e) => {
    if (!e.data_prazo_legal_parte || !e.baixado_em) return false;
    return new Date(e.baixado_em) <= new Date(e.data_prazo_legal_parte);
  });
  const taxaCumprimento = baixadosTotal.length > 0
    ? Math.round((cumpridos.length / baixadosTotal.length) * 100)
    : 0;

  const backlogAtual = expedientes.filter((e) => !e.baixado_em).length;

  return {
    porOrigem,
    resultadoDecisao,
    volumeSemanal,
    prazoMedio,
    calendarioPrazos,
    tempoRespostaMedio,
    taxaCumprimento,
    backlogAtual,
  };
}

/**
 * Obtém total de expedientes pendentes
 */
export async function buscarTotalExpedientesPendentes(): Promise<{
  total: number;
  vencidos: number;
}> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Queries em paralelo
  const [{ count: pendentesTotal }, { count: pendentesVencidos }] =
    await Promise.all([
      supabase
        .from('expedientes')
        .select('id', { count: 'exact', head: true })
        .is('baixado_em', null),
      supabase
        .from('expedientes')
        .select('id', { count: 'exact', head: true })
        .is('baixado_em', null)
        .lt('data_prazo_legal_parte', hoje.toISOString()),
    ]);

  return {
    total: pendentesTotal || 0,
    vencidos: pendentesVencidos || 0,
  };
}
