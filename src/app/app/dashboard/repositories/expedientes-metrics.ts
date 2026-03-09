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
    .from('expedientes')
    .select(`
      id,
      processo_id,
      numero_processo,
      data_prazo_legal_parte,
      prazo_vencido,
      responsavel_id,
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
      prazo_fatal: p.data_prazo_legal_parte,
      status: diasRestantes < 0 ? 'vencido' : 'pendente',
      dias_restantes: diasRestantes,
      responsavel_id: p.responsavel_id,
      responsavel_nome: (p.usuarios as { nome_exibicao?: string })?.nome_exibicao || null,
      origem: 'expedientes' as const,
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
 * Obtém total de expedientes pendentes
 */
export async function buscarTotalExpedientesPendentes(): Promise<{
  total: number;
  vencidos: number;
}> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const { count: pendentesTotal } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null);

  const { count: pendentesVencidos } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null)
    .lt('data_prazo_legal_parte', hoje.toISOString());

  return {
    total: pendentesTotal || 0,
    vencidos: pendentesVencidos || 0,
  };
}
