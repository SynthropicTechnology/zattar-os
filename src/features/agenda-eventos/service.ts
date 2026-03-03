import "server-only";

import type { Result } from "@/types";
import type {
	AgendaEvento,
	CriarAgendaEventoInput,
	AtualizarAgendaEventoInput,
} from "./domain";
import * as repository from "./repository";

export async function listarEventosPorPeriodo(
	startAt: string,
	endAt: string,
): Promise<Result<AgendaEvento[]>> {
	return repository.findByPeriodo(startAt, endAt);
}

export async function criarEvento(
	input: CriarAgendaEventoInput,
	criadoPor: number,
): Promise<Result<AgendaEvento>> {
	return repository.create(input, criadoPor);
}

export async function atualizarEvento(
	input: AtualizarAgendaEventoInput,
): Promise<Result<AgendaEvento>> {
	const { id, ...rest } = input;
	return repository.update(id, rest);
}

export async function deletarEvento(id: number): Promise<Result<void>> {
	return repository.softDelete(id);
}
