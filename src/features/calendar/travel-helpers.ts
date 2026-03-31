/**
 * Travel Helpers — Estimativa de tempo de deslocamento entre eventos
 * ============================================================================
 * MVP: Heuristica simples baseada em cidade. Sem API externa.
 * ============================================================================
 */

import type { BriefingEventMeta } from "./briefing-domain";

export interface TravelEstimate {
  minutes: number;
  fromLocation: string;
  toLocation: string;
}

/**
 * Estima tempo de deslocamento entre dois eventos presenciais consecutivos.
 * Retorna null se nao for possivel estimar (eventos virtuais, sem endereco, etc).
 */
export function estimateTravelTime(
  from: BriefingEventMeta,
  to: BriefingEventMeta,
): TravelEstimate | null {
  // Ambos devem ser presenciais
  if (from.modalidade !== "presencial" || to.modalidade !== "presencial") {
    return null;
  }

  const fromCity = from.enderecoPresencial?.cidade?.toLowerCase().trim();
  const toCity = to.enderecoPresencial?.cidade?.toLowerCase().trim();
  const fromLocation = from.local ?? from.enderecoPresencial?.cidade ?? "Local anterior";
  const toLocation = to.local ?? to.enderecoPresencial?.cidade ?? "Próximo local";

  // Sem dados de cidade: estimativa padrao
  if (!fromCity || !toCity) {
    return { minutes: 30, fromLocation, toLocation };
  }

  // Mesma cidade: deslocamento urbano
  if (fromCity === toCity) {
    return { minutes: 25, fromLocation, toLocation };
  }

  // Cidades diferentes: deslocamento intercidades
  return { minutes: 60, fromLocation, toLocation };
}
