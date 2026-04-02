/**
 * CALENDAR REPOSITORY - Camada de Persistência
 *
 * Agrega dados de múltiplas fontes para alimentar o calendário unificado.
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam dados brutos de cada fonte
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 * - NUNCA importar React/Next.js aqui
 */

import type { ListarAudienciasParams } from "@/app/app/audiencias";
import { listarAudiencias } from "@/app/app/audiencias/service";
import type { Audiencia } from "@/app/app/audiencias";

import type { ListarExpedientesParams, Expediente } from "@/app/app/expedientes";
import { listarExpedientes } from "@/app/app/expedientes/service";

import type { AcordoComParcelas } from "@/app/app/obrigacoes";
import { listarAcordos } from "@/app/app/obrigacoes/service";

import type { Pericia, ListarPericiasParams } from "@/app/app/pericias";
import { listarPericias } from "@/app/app/pericias/service";

import type { AgendaEvento } from "@/app/app/agenda";
import { agendaEventosRepository as agendaEventosRepo } from "@/app/app/agenda";

// =============================================================================
// BUSCA DE AUDIÊNCIAS
// =============================================================================

/**
 * Busca todas as audiências no intervalo de datas informado,
 * percorrendo páginas até esgotar os resultados (max 10 páginas).
 */
export async function findAudiencias(start: Date, end: Date): Promise<Audiencia[]> {
  const registros: Audiencia[] = [];

  const limite = 100;
  let pagina = 1;
  let hasMore = true;

  while (hasMore && pagina <= 10) {
    const params: ListarAudienciasParams = {
      pagina,
      limite,
      dataInicioInicio: start.toISOString(),
      dataInicioFim: end.toISOString(),
      ordenarPor: "dataInicio",
      ordem: "asc",
    };

    const result = await listarAudiencias(params);
    if (!result.success) {
      return [];
    }

    registros.push(...result.data.data);

    hasMore = result.data.pagination.hasMore;
    pagina += 1;
  }

  return registros;
}

// =============================================================================
// BUSCA DE EXPEDIENTES
// =============================================================================

/**
 * Busca todos os expedientes pendentes (não baixados) no intervalo de datas,
 * percorrendo páginas até esgotar os resultados (max 10 páginas).
 */
export async function findExpedientes(start: Date, end: Date): Promise<Expediente[]> {
  const registros: Expediente[] = [];

  const limite = 100;
  let pagina = 1;
  let hasMore = true;

  while (hasMore && pagina <= 10) {
    const params: ListarExpedientesParams = {
      pagina,
      limite,
      dataPrazoLegalInicio: start.toISOString(),
      dataPrazoLegalFim: end.toISOString(),
      ordenarPor: "data_prazo_legal_parte",
      ordem: "asc",
      baixado: false,
    };

    const result = await listarExpedientes(params);
    if (!result.success) {
      return [];
    }

    registros.push(...result.data.data);

    hasMore = result.data.pagination.hasMore;
    pagina += 1;
  }

  return registros;
}

// =============================================================================
// BUSCA DE OBRIGAÇÕES (ACORDOS COM PARCELAS)
// =============================================================================

/**
 * Busca acordos com parcelas cujos vencimentos estejam no intervalo de datas.
 */
export async function findAcordosComParcelas(
  start: Date,
  end: Date
): Promise<AcordoComParcelas[]> {
  const dataInicio = start.toISOString().slice(0, 10);
  const dataFim = end.toISOString().slice(0, 10);

  const result = await listarAcordos({
    dataInicio,
    dataFim,
    limite: 1000,
  });

  return (result.acordos ?? []) as AcordoComParcelas[];
}

// =============================================================================
// BUSCA DE PERÍCIAS
// =============================================================================

/**
 * Busca todas as perícias com prazo de entrega no intervalo de datas,
 * percorrendo páginas até esgotar os resultados (max 10 páginas).
 */
export async function findPericias(start: Date, end: Date): Promise<Pericia[]> {
  const registros: Pericia[] = [];

  const limite = 100;
  let pagina = 1;
  let hasMore = true;

  while (hasMore && pagina <= 10) {
    const params: ListarPericiasParams = {
      pagina,
      limite,
      prazoEntregaInicio: start.toISOString(),
      prazoEntregaFim: end.toISOString(),
      ordenarPor: "prazo_entrega",
      ordem: "asc",
    };

    const result = await listarPericias(params);
    if (!result.success) {
      return [];
    }

    for (const pericia of result.data.data) {
      registros.push(pericia);
    }

    hasMore = result.data.pagination.hasMore;
    pagina += 1;
  }

  return registros;
}

// =============================================================================
// BUSCA DE EVENTOS DE AGENDA
// =============================================================================

/**
 * Busca todos os eventos de agenda no intervalo de datas.
 */
export async function findAgendaEventos(
  start: Date,
  end: Date
): Promise<AgendaEvento[]> {
  const result = await agendaEventosRepo.findByPeriodo(
    start.toISOString(),
    end.toISOString()
  );
  if (!result.success) return [];
  return result.data;
}
