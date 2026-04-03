/**
 * DASHBOARD FEATURE - Progresso Diário Repository
 *
 * Busca e calcula o progresso diário do usuário com base em:
 * - Audiências de hoje (concluída = já passou)
 * - Expedientes que vencem hoje (concluído = baixado)
 * - Perícias com prazo hoje (concluída = laudo entregue)
 * - Tarefas do usuário (concluída = status done)
 *
 * OTIMIZAÇÃO: As 4 queries são executadas em paralelo com Promise.all().
 */

import { createClient } from "@/lib/supabase/server";

export interface ProgressoDiario {
  total: number;
  concluidos: number;
  percentual: number;
  detalhes: {
    audiencias: { total: number; concluidas: number };
    expedientes: { total: number; concluidos: number };
    pericias: { total: number; concluidas: number };
    tarefas: { total: number; concluidas: number };
  };
}

export async function buscarProgressoDiario(
  usuarioId: number
): Promise<ProgressoDiario> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const agora = new Date();

  const hojeStr = hoje.toISOString();
  const amanhaStr = amanha.toISOString();

  // Executar as 4 queries independentes em paralelo
  const [
    { data: audienciasHoje },
    { data: expedientesHoje },
    { data: periciasHoje },
    { data: tarefasUsuario },
  ] = await Promise.all([
    // 1. Audiências de hoje do usuário
    supabase
      .from("audiencias")
      .select("id, data_inicio, data_fim")
      .eq("responsavel_id", usuarioId)
      .gte("data_inicio", hojeStr)
      .lt("data_inicio", amanhaStr),

    // 2. Expedientes que vencem hoje do usuário
    supabase
      .from("expedientes")
      .select("id, baixado_em, data_prazo_legal_parte")
      .eq("responsavel_id", usuarioId)
      .gte("data_prazo_legal_parte", hojeStr)
      .lt("data_prazo_legal_parte", amanhaStr),

    // 3. Perícias com prazo hoje do usuário
    supabase
      .from("pericias")
      .select("id, laudo_juntado, prazo_entrega")
      .eq("responsavel_id", usuarioId)
      .gte("prazo_entrega", hojeStr)
      .lt("prazo_entrega", amanhaStr),

    // 4. Tarefas do usuário
    supabase
      .from("tarefas")
      .select("id, status")
      .eq("usuario_id", usuarioId)
      .in("status", ["todo", "in progress", "done"]),
  ]);

  const audienciasTotal = audienciasHoje?.length || 0;
  const audienciasConcluidas =
    audienciasHoje?.filter((a) => {
      if (!a.data_fim) return false;
      const dataFim = new Date(a.data_fim);
      return dataFim < agora;
    }).length || 0;

  const expedientesTotal = expedientesHoje?.length || 0;
  const expedientesConcluidos =
    expedientesHoje?.filter((e) => e.baixado_em !== null).length || 0;

  const periciasTotal = periciasHoje?.length || 0;
  const periciasConcluidas =
    periciasHoje?.filter((p) => p.laudo_juntado === true).length || 0;

  const tarefasTotal = tarefasUsuario?.length || 0;
  const tarefasConcluidas =
    tarefasUsuario?.filter((t) => t.status === "done").length || 0;

  // Calcular totais
  const total =
    audienciasTotal + expedientesTotal + periciasTotal + tarefasTotal;
  const concluidos =
    audienciasConcluidas +
    expedientesConcluidos +
    periciasConcluidas +
    tarefasConcluidas;
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return {
    total,
    concluidos,
    percentual,
    detalhes: {
      audiencias: { total: audienciasTotal, concluidas: audienciasConcluidas },
      expedientes: {
        total: expedientesTotal,
        concluidos: expedientesConcluidos,
      },
      pericias: { total: periciasTotal, concluidas: periciasConcluidas },
      tarefas: { total: tarefasTotal, concluidas: tarefasConcluidas },
    },
  };
}
