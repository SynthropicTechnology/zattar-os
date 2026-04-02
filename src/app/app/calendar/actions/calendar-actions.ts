"use server";

import { authenticatedAction } from "@/lib/safe-action";
import { listarEventosCalendarSchema, type ListarEventosCalendarInput } from "../domain";
import * as service from "../service";

export const actionListarEventosCalendar = authenticatedAction(
  listarEventosCalendarSchema,
  async (input: ListarEventosCalendarInput) => {
    return service.listarEventosPorPeriodo(input);
  }
);
