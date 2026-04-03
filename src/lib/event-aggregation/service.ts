/**
 * EVENT AGGREGATION SERVICE
 *
 * Serviço compartilhado que agrega eventos de audiências, expedientes,
 * perícias e obrigações em um formato unificado (UnifiedEventItem).
 *
 * Segue o mesmo padrão de fetchers paginados e converters de:
 * - src/features/kanban/service.ts (converter functions, system boards)
 * - src/features/calendar/service.ts (unified calendar events)
 */

import "server-only";

import type { UnifiedEventItem, EventSource } from "./domain";
import { buildEventId, calcularPrioridade } from "./domain";

// --- Cross-module imports (mesmo padrão de kanban/service.ts) ---
import type { Audiencia } from "@/app/(authenticated)/audiencias";
import { StatusAudiencia } from "@/app/(authenticated)/audiencias";
import { listarAudiencias, atualizarStatusAudiencia } from "@/app/(authenticated)/audiencias/service";

import type { Expediente } from "@/app/(authenticated)/expedientes";
import { listarExpedientes, realizarBaixa as realizarBaixaExpediente, reverterBaixa as reverterBaixaExpediente } from "@/app/(authenticated)/expedientes/service";

import type { Pericia } from "@/app/(authenticated)/pericias";
import { SituacaoPericiaCodigo } from "@/app/(authenticated)/pericias";
import { listarPericias } from "@/app/(authenticated)/pericias/service";

import type { AcordoComParcelas } from "@/app/(authenticated)/obrigacoes";
import { listarAcordos } from "@/app/(authenticated)/obrigacoes/service";

import { appError, err, ok, Result } from "@/types";

// =============================================================================
// CONVERTER FUNCTIONS
// =============================================================================

function audienciaToEventItem(aud: Audiencia): UnifiedEventItem {
  const tipo = aud.tipoDescricao ? ` (${aud.tipoDescricao})` : "";
  return {
    id: buildEventId("audiencias", aud.id),
    source: "audiencias",
    sourceEntityId: aud.id,
    titulo: `${aud.numeroProcesso}${tipo}`,
    descricao: aud.poloAtivoNome
      ? `${aud.poloAtivoNome} x ${aud.poloPassivoNome ?? "—"}`
      : undefined,
    dataVencimento: aud.dataInicio ?? undefined,
    prazoVencido: false,
    responsavelId: aud.responsavelId ?? null,
    responsavelNome: undefined,
    statusOrigem: aud.status,
    url: `/app/audiencias/semana?audienciaId=${aud.id}`,
  };
}

function expedienteToEventItem(exp: Expediente): UnifiedEventItem {
  const classe = exp.classeJudicial ? ` (${exp.classeJudicial})` : "";
  let statusOrigem: string;
  if (exp.baixadoEm) {
    statusOrigem = "baixado";
  } else if (exp.prazoVencido) {
    statusOrigem = "vencido";
  } else {
    statusOrigem = "pendente";
  }

  return {
    id: buildEventId("expedientes", exp.id),
    source: "expedientes",
    sourceEntityId: exp.id,
    titulo: `${exp.numeroProcesso}${classe}`,
    descricao: exp.nomeParteAutora
      ? `${exp.nomeParteAutora} x ${exp.nomeParteRe ?? "—"}`
      : undefined,
    dataVencimento: exp.dataPrazoLegalParte ?? undefined,
    prazoVencido: exp.prazoVencido ?? false,
    responsavelId: exp.responsavelId ?? null,
    responsavelNome: undefined,
    statusOrigem,
    url: `/app/expedientes?expedienteId=${exp.id}`,
  };
}

function periciaToEventItem(per: Pericia): UnifiedEventItem {
  const espec = per.especialidade?.descricao ? ` (${per.especialidade.descricao})` : "";
  return {
    id: buildEventId("pericias", per.id),
    source: "pericias",
    sourceEntityId: per.id,
    titulo: `${per.numeroProcesso}${espec}`,
    descricao: per.processo
      ? `${per.processo.nomeParteAutora ?? "—"} x ${per.processo.nomeParteRe ?? "—"}`
      : undefined,
    dataVencimento: per.prazoEntrega ?? undefined,
    prazoVencido: per.prazoEntrega ? new Date(per.prazoEntrega) < new Date() : false,
    responsavelId: per.responsavelId ?? null,
    responsavelNome: per.responsavel?.nomeExibicao ?? undefined,
    statusOrigem: per.situacaoCodigo,
    url: `/app/pericias?periciaId=${per.id}`,
  };
}

function acordoParcelasToEventItems(acordo: AcordoComParcelas): UnifiedEventItem[] {
  const parcelas = acordo.parcelas ?? [];
  const numeroProcesso = acordo.processo?.numero_processo ?? "—";

  return parcelas.map((parcela) => {
    const status = String(parcela.status ?? "pendente").toLowerCase();
    const vencido = status === "atrasada" || status === "vencida";

    return {
      id: buildEventId("obrigacoes", `${acordo.id}-${parcela.id}`),
      source: "obrigacoes" as const,
      sourceEntityId: `${acordo.id}-${parcela.id}`,
      titulo: `Parcela ${parcela.numeroParcela} — ${numeroProcesso}`,
      descricao: acordo.processo
        ? `${acordo.processo.nome_parte_autora ?? "—"} x ${acordo.processo.nome_parte_re ?? "—"}`
        : undefined,
      dataVencimento: parcela.dataVencimento ?? undefined,
      prazoVencido: vencido,
      responsavelId: null, // obrigações não têm responsável
      responsavelNome: undefined,
      statusOrigem: status,
      url: `/app/acordos-condenacoes?acordoId=${acordo.id}`,
    };
  });
}

// =============================================================================
// PAGINATED FETCHERS (mesmo padrão do kanban)
// =============================================================================

const MAX_PAGES = 10;
const PAGE_SIZE = 100;

async function fetchAudienciasParaEventos(): Promise<UnifiedEventItem[]> {
  const items: UnifiedEventItem[] = [];
  let pagina = 1;
  let hasMore = true;

  try {
    while (hasMore && pagina <= MAX_PAGES) {
      const result = await listarAudiencias({
        pagina,
        limite: PAGE_SIZE,
        ordenarPor: "dataInicio",
        ordem: "asc",
      });

      if (!result.success || !result.data) break;

      for (const aud of result.data.data) {
        items.push(audienciaToEventItem(aud as Audiencia));
      }

      hasMore = result.data.data.length === PAGE_SIZE;
      pagina++;
    }
  } catch {
    // Retorna resultados parciais (mesmo padrão do kanban/calendar)
  }

  return items;
}

async function fetchExpedientesParaEventos(): Promise<UnifiedEventItem[]> {
  const items: UnifiedEventItem[] = [];
  let pagina = 1;
  let hasMore = true;

  try {
    while (hasMore && pagina <= MAX_PAGES) {
      const result = await listarExpedientes({
        pagina,
        limite: PAGE_SIZE,
        ordenarPor: "data_prazo_legal_parte",
        ordem: "asc",
      });

      if (!result.success || !result.data) break;

      for (const exp of result.data.data) {
        items.push(expedienteToEventItem(exp as Expediente));
      }

      hasMore = result.data.data.length === PAGE_SIZE;
      pagina++;
    }
  } catch {
    // Retorna resultados parciais
  }

  return items;
}

async function fetchPericiasParaEventos(): Promise<UnifiedEventItem[]> {
  const items: UnifiedEventItem[] = [];
  let pagina = 1;
  let hasMore = true;

  try {
    while (hasMore && pagina <= MAX_PAGES) {
      const result = await listarPericias({
        pagina,
        limite: PAGE_SIZE,
        ordenarPor: "prazo_entrega",
        ordem: "asc",
      });

      if (!result.success || !result.data) break;

      for (const per of result.data.data) {
        items.push(periciaToEventItem(per as Pericia));
      }

      hasMore = result.data.data.length === PAGE_SIZE;
      pagina++;
    }
  } catch {
    // Retorna resultados parciais
  }

  return items;
}

async function fetchObrigacoesParaEventos(): Promise<UnifiedEventItem[]> {
  const items: UnifiedEventItem[] = [];

  try {
    const result = await listarAcordos({ limite: 1000 });
    const acordos = result?.acordos ?? [];
    for (const acordo of acordos) {
      items.push(...acordoParcelasToEventItems(acordo));
    }
  } catch {
    // Retorna resultados parciais
  }

  return items;
}

// =============================================================================
// MAIN AGGREGATOR
// =============================================================================

export interface ListarEventosOptions {
  responsavelId?: number;
  sources?: EventSource[];
}

/**
 * Busca todos os eventos de todas as fontes (ou fontes selecionadas)
 * e retorna lista unificada.
 */
export async function listarTodosEventos(
  options: ListarEventosOptions = {}
): Promise<UnifiedEventItem[]> {
  const activeSources = options.sources ?? [
    "audiencias",
    "expedientes",
    "pericias",
    "obrigacoes",
  ];

  const fetchers: Record<EventSource, () => Promise<UnifiedEventItem[]>> = {
    audiencias: fetchAudienciasParaEventos,
    expedientes: fetchExpedientesParaEventos,
    pericias: fetchPericiasParaEventos,
    obrigacoes: fetchObrigacoesParaEventos,
  };

  // Buscar em paralelo
  const results = await Promise.all(
    activeSources.map((source) => fetchers[source]())
  );

  let items = results.flat();

  // Deduplicar por ID
  const seen = new Set<string>();
  items = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Filtrar por responsável (se especificado)
  if (options.responsavelId) {
    items = items.filter(
      (item) => item.responsavelId === options.responsavelId || item.responsavelId === null
    );
  }

  return items;
}

// =============================================================================
// BIDIRECTIONAL STATUS UPDATE
// (estende o padrão de atualizarStatusEntidade do kanban para incluir perícias)
// =============================================================================

export interface AtualizarStatusEventoInput {
  source: EventSource;
  entityId: string | number;
  novoStatus: string; // status no formato do destino (tarefas ou todo)
}

/**
 * Atualiza o status de uma entidade no módulo de origem
 * quando o status é alterado em Tarefas ou To-Do (sync bidirecional).
 */
export async function atualizarStatusEntidadeOrigem(
  input: AtualizarStatusEventoInput,
  userId: number
): Promise<Result<void>> {
  const { source, entityId, novoStatus } = input;
  const numericId =
    typeof entityId === "string" ? parseInt(entityId, 10) : entityId;

  try {
    switch (source) {
      case "audiencias": {
        // done/completed → Finalizada, canceled → Cancelada, else → Marcada
        let audStatus: StatusAudiencia;
        if (novoStatus === "done" || novoStatus === "completed") {
          audStatus = StatusAudiencia.Finalizada;
        } else if (novoStatus === "canceled") {
          audStatus = StatusAudiencia.Cancelada;
        } else {
          audStatus = StatusAudiencia.Marcada;
        }
        const result = await atualizarStatusAudiencia(numericId, audStatus);
        if (!result.success) return err(result.error);
        return ok(undefined);
      }

      case "expedientes": {
        // done/completed → dar baixa
        if (novoStatus === "done" || novoStatus === "completed") {
          const result = await realizarBaixaExpediente(
            numericId,
            { expedienteId: numericId },
            userId
          );
          if (!result.success) return err(result.error);
          return ok(undefined);
        }

        const result = await reverterBaixaExpediente(numericId, userId);
        if (!result.success) return err(result.error);
        // prazoVencido continua calculado por data, nao e editavel via DnD
        return ok(undefined);
      }

      case "pericias": {
        // Perícias: status update via situacaoCodigo
        // done/completed → F (Finalizada)
        // canceled → C (Cancelada)
        // Outros status → não altera (ou poderia voltar para L - Aguardando Laudo, mas depende do fluxo)

        let situacao: SituacaoPericiaCodigo | undefined;

        if (novoStatus === "done" || novoStatus === "completed") {
          situacao = SituacaoPericiaCodigo.FINALIZADA;
        } else if (novoStatus === "canceled") {
          situacao = SituacaoPericiaCodigo.CANCELADA;
        }

        if (situacao) {
          // Importação dinâmica para evitar ciclos se necessário, ou garantir que o import no topo está correto.
          // Como pericias/index.ts exporta o service, idealmente usariamos o service aqui.
          // Mas o `event-aggregation/service.ts` já importa de `@/app/(authenticated)/pericias`.
          // Vou assumir que falta expor `atualizarSituacao` no index.ts de pericias ou importar direto do service.
          // Olhando os imports: `import { ... } from "@/app/(authenticated)/pericias";`
          // Vou precisar garantir que `atualizarSituacao` esteja exportado em `@/app/(authenticated)/pericias` ou importar de `@/app/(authenticated)/pericias/service`

          // Por segurança e padrão, vou usar uma importação direta do service se não estiver no index, 
          // mas o arquivo já tem imports de `@/app/(authenticated)/pericias`. Vou checar se precisa atualizar o index.ts.
          // O código abaixo assume que `atualizarSituacao` sera disponibilizado.

          // Para evitar erro de build agora, vou chamar direto do service que acabei de criar,
          // mas preciso adicionar o import.

          const { atualizarSituacao } = await import("@/app/(authenticated)/pericias/service");
          const result = await atualizarSituacao(numericId, situacao);
          if (!result.success) return err(result.error);
        }

        return ok(undefined);
      }

      case "obrigacoes": {
        // Obrigações envolvem workflows de pagamento - não suportado via To-Do/Tarefas
        return err(
          appError(
            "VALIDATION_ERROR",
            "Alteração de status de obrigações não é suportada via To-Do/Tarefas."
          )
        );
      }

      default:
        return err(
          appError("VALIDATION_ERROR", `Source '${source}' não suportada.`)
        );
    }
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        `Erro ao atualizar entidade de origem: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      )
    );
  }
}

// Re-export converters para uso nos hooks de replicação
export {
  audienciaToEventItem,
  expedienteToEventItem,
  periciaToEventItem,
  acordoParcelasToEventItems,
  calcularPrioridade,
};
