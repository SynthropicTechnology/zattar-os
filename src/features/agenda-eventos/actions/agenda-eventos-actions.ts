"use server";

import { authenticatedAction } from "@/lib/safe-action";
import {
	criarAgendaEventoSchema,
	atualizarAgendaEventoSchema,
	deletarAgendaEventoSchema,
	type CriarAgendaEventoInput,
	type AtualizarAgendaEventoInput,
	type DeletarAgendaEventoInput,
} from "../domain";
import * as service from "../service";

export const actionCriarAgendaEvento = authenticatedAction(
	criarAgendaEventoSchema,
	async (input: CriarAgendaEventoInput, { user }) => {
		const result = await service.criarEvento(input, user.id);
		if (!result.success) throw new Error(result.error.message);
		return result.data;
	},
);

export const actionAtualizarAgendaEvento = authenticatedAction(
	atualizarAgendaEventoSchema,
	async (input: AtualizarAgendaEventoInput) => {
		const result = await service.atualizarEvento(input);
		if (!result.success) throw new Error(result.error.message);
		return result.data;
	},
);

export const actionDeletarAgendaEvento = authenticatedAction(
	deletarAgendaEventoSchema,
	async (input: DeletarAgendaEventoInput) => {
		const result = await service.deletarEvento(input.id);
		if (!result.success) throw new Error(result.error.message);
		return undefined;
	},
);
