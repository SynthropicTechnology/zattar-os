"use server";

import { z } from "zod";
import { authenticatedAction } from "@/lib/safe-action";
import * as service from "../service";
import { generateWeekPulse, getDaySummary } from "../briefing-helpers";

const briefingInputSchema = z.object({
  date: z.string().min(1),
});

/**
 * Busca dados enriquecidos para a view Briefing de um dia especifico.
 * Retorna eventos da semana + resumo do dia + pulse semanal.
 */
export const actionListarBriefingData = authenticatedAction(
  briefingInputSchema,
  async (input: { date: string }) => {
    const targetDate = new Date(input.date);

    // Buscar eventos de 1 semana antes ate 1 semana depois para ter contexto
    const weekStart = new Date(targetDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const events = await service.listarEventosPorPeriodo({
      startAt: weekStart.toISOString(),
      endAt: weekEnd.toISOString(),
    });

    return {
      events,
      summary: getDaySummary(events, targetDate),
      weekPulse: generateWeekPulse(events, targetDate),
    };
  }
);
