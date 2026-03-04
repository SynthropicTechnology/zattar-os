import { createDbClient } from "@/lib/supabase";
import { ok, err, appError, type Result } from "@/types/result";
import type {
  DashboardSummary,
  ProjetosPorPeriodo,
  DistribuicaoPorStatus,
  ComparativoAnual,
  MembroAtivo,
  StatusProjeto,
} from "../domain";

export async function getDashboardSummary(): Promise<Result<DashboardSummary>> {
  try {
    const db = createDbClient();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    const lastQuarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const prevQuarterStart = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();

    const [
      ativosAtual,
      ativosAnterior,
      tarefasPendentes,
      tarefasPendentesAnt,
      horasAtual,
      horasAnterior,
      concluidosQuarter,
      totalQuarter,
      concluidosPrevQuarter,
      totalPrevQuarter,
    ] = await Promise.all([
      // Projetos ativos (atual)
      db
        .from("pm_projetos")
        .select("id", { count: "exact", head: true })
        .eq("status", "ativo"),
      // Projetos ativos (mês anterior - snapshot simplificado)
      db
        .from("pm_projetos")
        .select("id", { count: "exact", head: true })
        .eq("status", "ativo")
        .lte("created_at", lastMonthEnd),
      // Tarefas pendentes (atual)
      db
        .from("pm_tarefas")
        .select("id", { count: "exact", head: true })
        .in("status", ["a_fazer", "em_progresso"]),
      // Tarefas pendentes (anterior)
      db
        .from("pm_tarefas")
        .select("id", { count: "exact", head: true })
        .in("status", ["a_fazer", "em_progresso"])
        .lte("created_at", lastMonthEnd),
      // Horas registradas (mês atual)
      db.from("pm_tarefas").select("horas_registradas").gte("updated_at", thisMonthStart),
      // Horas registradas (mês anterior)
      db
        .from("pm_tarefas")
        .select("horas_registradas")
        .gte("updated_at", lastMonthStart)
        .lte("updated_at", lastMonthEnd),
      // Concluídos (trimestre atual)
      db
        .from("pm_projetos")
        .select("id", { count: "exact", head: true })
        .eq("status", "concluido")
        .gte("data_conclusao", lastQuarterStart),
      // Total (trimestre atual)
      db
        .from("pm_projetos")
        .select("id", { count: "exact", head: true })
        .gte("created_at", lastQuarterStart),
      // Concluídos (trimestre anterior)
      db
        .from("pm_projetos")
        .select("id", { count: "exact", head: true })
        .eq("status", "concluido")
        .gte("data_conclusao", prevQuarterStart)
        .lte("data_conclusao", lastQuarterStart),
      // Total (trimestre anterior)
      db
        .from("pm_projetos")
        .select("id", { count: "exact", head: true })
        .gte("created_at", prevQuarterStart)
        .lte("created_at", lastQuarterStart),
    ]);

    const horasAtualSum = (horasAtual.data ?? []).reduce(
      (sum, r) => sum + ((r.horas_registradas as number) ?? 0),
      0
    );
    const horasAnteriorSum = (horasAnterior.data ?? []).reduce(
      (sum, r) => sum + ((r.horas_registradas as number) ?? 0),
      0
    );

    const calcVariacao = (atual: number, anterior: number): number => {
      if (anterior === 0) return atual > 0 ? 100 : 0;
      return Math.round(((atual - anterior) / anterior) * 100);
    };

    const taxaAtual =
      (totalQuarter.count ?? 0) > 0
        ? Math.round(((concluidosQuarter.count ?? 0) / (totalQuarter.count ?? 1)) * 100)
        : 0;
    const taxaAnterior =
      (totalPrevQuarter.count ?? 0) > 0
        ? Math.round(
            ((concluidosPrevQuarter.count ?? 0) / (totalPrevQuarter.count ?? 1)) * 100
          )
        : 0;

    return ok({
      projetosAtivos: ativosAtual.count ?? 0,
      projetosAtivosVariacao: calcVariacao(ativosAtual.count ?? 0, ativosAnterior.count ?? 0),
      tarefasPendentes: tarefasPendentes.count ?? 0,
      tarefasPendentesVariacao: calcVariacao(
        tarefasPendentes.count ?? 0,
        tarefasPendentesAnt.count ?? 0
      ),
      horasRegistradas: Math.round(horasAtualSum * 10) / 10,
      horasRegistradasVariacao: calcVariacao(horasAtualSum, horasAnteriorSum),
      taxaConclusao: taxaAtual,
      taxaConclusaoVariacao: calcVariacao(taxaAtual, taxaAnterior),
    });
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao carregar dashboard", undefined, error as Error)
    );
  }
}

export async function getDistribuicaoPorStatus(): Promise<Result<DistribuicaoPorStatus[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from("pm_projetos").select("status");

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const s = row.status as string;
      counts[s] = (counts[s] ?? 0) + 1;
    }

    const chartColors: Record<string, string> = {
      planejamento: "var(--chart-1)",
      ativo: "var(--chart-2)",
      pausado: "var(--chart-3)",
      concluido: "var(--chart-4)",
      cancelado: "var(--chart-5)",
    };

    const result: DistribuicaoPorStatus[] = Object.entries(counts).map(([status, total]) => ({
      status: status as StatusProjeto,
      total,
      fill: chartColors[status] ?? "var(--chart-1)",
    }));

    return ok(result);
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao carregar distribuição", undefined, error as Error)
    );
  }
}

export async function getComparativoAnual(): Promise<Result<ComparativoAnual[]>> {
  try {
    const db = createDbClient();
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2];

    const results = await Promise.all(
      years.map(async (ano) => {
        const { count } = await db
          .from("pm_projetos")
          .select("id", { count: "exact", head: true })
          .eq("status", "concluido")
          .gte("data_conclusao", `${ano}-01-01`)
          .lte("data_conclusao", `${ano}-12-31`);

        return { ano, totalConcluidos: count ?? 0 };
      })
    );

    return ok(results);
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao carregar comparativo", undefined, error as Error)
    );
  }
}

export async function getProjetosPorPeriodo(
  meses: number = 12
): Promise<Result<ProjetosPorPeriodo[]>> {
  try {
    const db = createDbClient();
    const now = new Date();

    // Build month ranges
    const months = Array.from({ length: meses }, (_, idx) => {
      const i = meses - 1 - idx;
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      return { monthStart, monthEnd };
    });

    // Execute all 2*meses queries in parallel (instead of sequential loop)
    const allResults = await Promise.all(
      months.map(({ monthStart, monthEnd }) =>
        Promise.all([
          db
            .from("pm_projetos")
            .select("id", { count: "exact", head: true })
            .gte("created_at", monthStart.toISOString())
            .lte("created_at", monthEnd.toISOString()),
          db
            .from("pm_projetos")
            .select("id", { count: "exact", head: true })
            .eq("status", "concluido")
            .gte("data_conclusao", monthStart.toISOString())
            .lte("data_conclusao", monthEnd.toISOString()),
        ])
      )
    );

    const results: ProjetosPorPeriodo[] = allResults.map(([criados, concluidos], idx) => ({
      data: months[idx].monthStart.toISOString().split("T")[0],
      criados: criados.count ?? 0,
      concluidos: concluidos.count ?? 0,
    }));

    return ok(results);
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao carregar projetos por período", undefined, error as Error)
    );
  }
}

export async function getMembrosAtivos(limite: number = 6): Promise<Result<MembroAtivo[]>> {
  try {
    const db = createDbClient();

    // Buscar tarefas concluídas agrupadas por responsável
    const { data, error } = await db
      .from("pm_tarefas")
      .select(
        `responsavel_id,
        responsavel:usuarios!pm_tarefas_responsavel_id_fkey(nome_completo, avatar_url)`
      )
      .eq("status", "concluido")
      .not("responsavel_id", "is", null)
      .limit(1000);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    // Agregar no JS (simples e funcional)
    const countMap = new Map<number, { nome: string; avatar: string | null; count: number }>();
    for (const row of data ?? []) {
      const uid = row.responsavel_id as number;
      const existing = countMap.get(uid);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(uid, {
          nome: (row.responsavel as unknown as Record<string, unknown>)?.nome_completo as string,
          avatar: (row.responsavel as unknown as Record<string, unknown>)?.avatar_url as string | null,
          count: 1,
        });
      }
    }

    const sorted = Array.from(countMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limite);

    return ok(
      sorted.map(([usuarioId, info]) => ({
        usuarioId,
        nome: info.nome,
        avatar: info.avatar,
        totalTarefasConcluidas: info.count,
      }))
    );
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao carregar membros ativos", undefined, error as Error)
    );
  }
}
