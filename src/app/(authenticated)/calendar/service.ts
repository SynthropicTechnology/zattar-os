import "server-only";

import { endOfDay, startOfDay } from "date-fns";

import type { Audiencia } from "@/app/(authenticated)/audiencias";
import { StatusAudiencia } from "@/app/(authenticated)/audiencias";

import type { Expediente } from "@/app/(authenticated)/expedientes";

import type { AcordoComParcelas } from "@/app/(authenticated)/obrigacoes";

import type { Pericia } from "@/app/(authenticated)/pericias";
import { SituacaoPericiaCodigo } from "@/app/(authenticated)/pericias";

import type { AgendaEvento } from "@/app/(authenticated)/agenda";

import {
  buildUnifiedEventId,
  type CalendarSource,
  type ListarEventosCalendarInput,
  type UnifiedCalendarEvent,
} from "./domain";

import * as repo from "./repository";

type SourceFetch = () => Promise<UnifiedCalendarEvent[]>;

/**
 * Constante do offset de São Paulo em milissegundos.
 * Brasil não usa mais horário de verão desde 2019, então UTC-3 é fixo.
 */
const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;

/**
 * Converte uma data UTC para uma string ISO normalizada para eventos "all-day".
 *
 * Problema: Datas no banco são armazenadas como timestamptz (ex: 2026-01-22T02:59:59Z),
 * que representa o fim do dia 21 em São Paulo. Quando o servidor (em UTC) interpreta
 * essa data, vê dia 22, causando o evento aparecer no dia errado.
 *
 * Solução: Extrair a data no timezone de São Paulo e criar uma string ISO com
 * horário meio-dia UTC, que é "seguro" e não muda de dia em nenhum timezone.
 */
function toAllDayISOString(utcDate: Date): string {
  // Aplicar offset de São Paulo para obter a data local
  const spTime = new Date(utcDate.getTime() + SAO_PAULO_OFFSET_MS);

  // Extrair componentes da data no "horário de São Paulo"
  const year = spTime.getUTCFullYear();
  const month = String(spTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(spTime.getUTCDate()).padStart(2, "0");

  // Retornar como meio-dia UTC para evitar problemas de mudança de dia
  return `${year}-${month}-${day}T12:00:00.000Z`;
}

function normalizeDateRange(input: ListarEventosCalendarInput): { start: Date; end: Date } {
  const start = new Date(input.startAt);
  const end = new Date(input.endAt);

  // Normalize to full-day bounds to make date-only sources behave intuitively
  return {
    start: startOfDay(start),
    end: endOfDay(end),
  };
}

// =============================================================================
// TRANSFORMADORES — Entidade -> UnifiedCalendarEvent
// =============================================================================

function deriveAudienciaPrepStatus(audiencia: Audiencia): "preparado" | "parcial" | "pendente" {
  const hasAta = audiencia.ataAudienciaId != null;
  const hasObs = !!audiencia.observacoes?.trim();
  if (hasAta && hasObs) return "preparado";
  if (hasAta || hasObs) return "parcial";
  return "pendente";
}

function audienciaToUnifiedEvent(audiencia: Audiencia): UnifiedCalendarEvent {
  const color =
    audiencia.status === StatusAudiencia.Marcada
      ? "sky"
      : audiencia.status === StatusAudiencia.Finalizada
        ? "emerald"
        : "rose";

  return {
    id: buildUnifiedEventId("audiencias", audiencia.id),
    title: audiencia.tipoDescricao
      ? `Audiência (${audiencia.tipoDescricao}) - ${audiencia.numeroProcesso}`
      : `Audiência - ${audiencia.numeroProcesso}`,
    startAt: audiencia.dataInicio,
    endAt: audiencia.dataFim,
    allDay: false,
    source: "audiencias",
    sourceEntityId: audiencia.id,
    url: `/app/audiencias/semana?audienciaId=${audiencia.id}`,
    responsavelId: audiencia.responsavelId ?? null,
    color,
    metadata: {
      processoId: audiencia.processoId,
      numeroProcesso: audiencia.numeroProcesso,
      trt: audiencia.trt,
      grau: audiencia.grau,
      status: audiencia.status,
      modalidade: audiencia.modalidade,
      enderecoPresencial: audiencia.enderecoPresencial,
      urlAudienciaVirtual: audiencia.urlAudienciaVirtual,
      prepStatus: deriveAudienciaPrepStatus(audiencia),
    },
  };
}

function expedienteToUnifiedEvent(expediente: Expediente): UnifiedCalendarEvent | null {
  const dataPrincipal =
    expediente.dataPrazoLegalParte || expediente.dataCriacaoExpediente || expediente.createdAt;

  if (!dataPrincipal) return null;

  const dt = new Date(dataPrincipal);
  if (Number.isNaN(dt.getTime())) return null;

  // Para prazos, tratamos como all-day no MVP
  const title = expediente.classeJudicial
    ? `Expediente (${expediente.classeJudicial}) - ${expediente.numeroProcesso}`
    : `Expediente - ${expediente.numeroProcesso}`;

  const color = expediente.prazoVencido ? "rose" : "amber";

  // Usar data normalizada para eventos all-day (corrige problema de timezone)
  const normalizedDate = toAllDayISOString(dt);

  return {
    id: buildUnifiedEventId("expedientes", expediente.id),
    title,
    startAt: normalizedDate,
    endAt: normalizedDate,
    allDay: true,
    source: "expedientes",
    sourceEntityId: expediente.id,
    url: `/app/expedientes?expedienteId=${expediente.id}`,
    responsavelId: expediente.responsavelId ?? null,
    color,
    metadata: {
      processoId: expediente.processoId,
      numeroProcesso: expediente.numeroProcesso,
      trt: expediente.trt,
      grau: expediente.grau,
      prazoVencido: expediente.prazoVencido,
      tipoExpedienteId: expediente.tipoExpedienteId,
      origem: expediente.origem,
    },
  };
}

function acordoParcelaToEvents(acordo: AcordoComParcelas): UnifiedCalendarEvent[] {
  const events: UnifiedCalendarEvent[] = [];

  for (const parcela of acordo.parcelas ?? []) {
    const dv = parcela.dataVencimento;
    if (!dv) continue;

    const dt = new Date(dv);
    if (Number.isNaN(dt.getTime())) continue;

    const status = String(parcela.status ?? "");
    const color =
      status === "atrasada" || status === "vencida"
        ? "rose"
        : status === "recebida" || status === "paga"
          ? "emerald"
          : "amber";

    const acordoWithProcesso = acordo as AcordoComParcelas & { processo?: { numero_processo?: string; numeroProcesso?: string }; processoId?: string | number };
    const numeroProcesso = acordoWithProcesso.processo?.numero_processo ?? acordoWithProcesso.processo?.numeroProcesso;

    // Usar data normalizada para eventos all-day (corrige problema de timezone)
    const normalizedDate = toAllDayISOString(dt);

    events.push({
      id: buildUnifiedEventId("obrigacoes", parcela.id),
      title: `Obrigação - Parcela ${parcela.numeroParcela ?? ""}${numeroProcesso ? ` - ${numeroProcesso}` : ""}`,
      startAt: normalizedDate,
      endAt: normalizedDate,
      allDay: true,
      source: "obrigacoes",
      sourceEntityId: parcela.id,
      url: `/app/acordos-condenacoes?acordoId=${acordo.id}`,
      responsavelId: null,
      color,
      metadata: {
        acordoId: acordo.id,
        parcelaId: parcela.id,
        processoId: acordoWithProcesso.processoId,
        status: parcela.status,
        valor: parcela.valorBrutoCreditoPrincipal,
      },
    });
  }

  return events;
}

function periciaToUnifiedEvent(pericia: Pericia): UnifiedCalendarEvent | null {
  const prazo = pericia.prazoEntrega;
  if (!prazo) return null;

  const dt = new Date(prazo);
  if (Number.isNaN(dt.getTime())) return null;

  const situacao = pericia.situacaoCodigo;
  const color =
    situacao === SituacaoPericiaCodigo.FINALIZADA || situacao === SituacaoPericiaCodigo.LAUDO_JUNTADO
      ? "emerald"
      : situacao === SituacaoPericiaCodigo.CANCELADA || situacao === SituacaoPericiaCodigo.REDESIGNADA
        ? "rose"
        : "violet";

  const normalizedDate = toAllDayISOString(dt);

  return {
    id: buildUnifiedEventId("pericias", pericia.id),
    title: `Perícia - ${pericia.numeroProcesso}`,
    startAt: normalizedDate,
    endAt: normalizedDate,
    allDay: true,
    source: "pericias",
    sourceEntityId: pericia.id,
    url: `/app/pericias?periciaId=${pericia.id}`,
    responsavelId: pericia.responsavelId ?? null,
    color,
    metadata: {
      processoId: pericia.processoId,
      numeroProcesso: pericia.numeroProcesso,
      trt: pericia.trt,
      grau: pericia.grau,
      situacao: pericia.situacaoCodigo,
    },
  };
}

function agendaEventoToUnifiedEvent(evento: AgendaEvento): UnifiedCalendarEvent {
  return {
    id: buildUnifiedEventId("agenda", evento.id),
    title: evento.titulo,
    startAt: evento.dataInicio,
    endAt: evento.dataFim,
    allDay: evento.diaInteiro,
    source: "agenda",
    sourceEntityId: evento.id,
    url: "",
    responsavelId: evento.responsavelId,
    color: evento.cor,
    metadata: {
      descricao: evento.descricao,
      local: evento.local,
    },
  };
}

// =============================================================================
// FETCHERS — Busca + Transformação por fonte
// =============================================================================

async function fetchAudiencias(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const audiencias = await repo.findAudiencias(start, end);
  return audiencias.map(audienciaToUnifiedEvent);
}

async function fetchExpedientes(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const expedientes = await repo.findExpedientes(start, end);
  const events: UnifiedCalendarEvent[] = [];
  for (const exp of expedientes) {
    const mapped = expedienteToUnifiedEvent(exp);
    if (mapped) events.push(mapped);
  }
  return events;
}

async function fetchObrigacoes(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const acordos = await repo.findAcordosComParcelas(start, end);
  return acordos.flatMap(acordoParcelaToEvents);
}

async function fetchPericias(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const pericias = await repo.findPericias(start, end);
  const events: UnifiedCalendarEvent[] = [];
  for (const pericia of pericias) {
    const mapped = periciaToUnifiedEvent(pericia);
    if (mapped) events.push(mapped);
  }
  return events;
}

async function fetchAgendaEventos(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const eventos = await repo.findAgendaEventos(start, end);
  return eventos.map(agendaEventoToUnifiedEvent);
}

// =============================================================================
// SERVIÇO PÚBLICO
// =============================================================================

export async function listarEventosPorPeriodo(
  input: ListarEventosCalendarInput
): Promise<UnifiedCalendarEvent[]> {
  try {
    const { start, end } = normalizeDateRange(input);
    const sources: CalendarSource[] = input.sources?.length ? input.sources : ["audiencias", "expedientes", "obrigacoes", "pericias", "agenda"];

    const fetchers: Record<CalendarSource, SourceFetch> = {
      audiencias: () => fetchAudiencias(start, end),
      expedientes: () => fetchExpedientes(start, end),
      obrigacoes: () => fetchObrigacoes(start, end),
      pericias: () => fetchPericias(start, end),
      agenda: () => fetchAgendaEventos(start, end),
    };

    const selectedFetches = sources.map((s) => fetchers[s]());
    const results = await Promise.all(selectedFetches);

    const all = results.flat();
    all.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return all;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Erro ao listar eventos do calendário: ${message}`);
  }
}
