import "server-only";

import { createDbClient } from "@/lib/supabase";
import { type Result, ok, err, appError } from "@/types";
import type { AgendaEvento, CriarAgendaEventoInput, AtualizarAgendaEventoInput } from "./domain";

// =============================================================================
// ROW TYPE (snake_case do banco)
// =============================================================================

interface AgendaEventoRow {
	id: number;
	titulo: string;
	descricao: string | null;
	data_inicio: string;
	data_fim: string;
	dia_inteiro: boolean;
	local: string | null;
	cor: string;
	responsavel_id: number | null;
	criado_por: number;
	created_at: string;
	updated_at: string;
	deletado_em: string | null;
}

// =============================================================================
// CONVERTER
// =============================================================================

function converterParaAgendaEvento(row: AgendaEventoRow): AgendaEvento {
	return {
		id: row.id,
		titulo: row.titulo,
		descricao: row.descricao,
		dataInicio: row.data_inicio,
		dataFim: row.data_fim,
		diaInteiro: row.dia_inteiro,
		local: row.local,
		cor: row.cor,
		responsavelId: row.responsavel_id,
		criadoPor: row.criado_por,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

// =============================================================================
// CRUD
// =============================================================================

export async function findByPeriodo(
	startAt: string,
	endAt: string,
): Promise<Result<AgendaEvento[]>> {
	try {
		const db = createDbClient();
		const { data, error } = await db
			.from("agenda_eventos")
			.select("*")
			.is("deletado_em", null)
			.lte("data_inicio", endAt)
			.gte("data_fim", startAt)
			.order("data_inicio", { ascending: true });

		if (error) {
			return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
		}

		return ok((data as AgendaEventoRow[] || []).map(converterParaAgendaEvento));
	} catch (error) {
		return err(
			appError("DATABASE_ERROR", "Erro ao listar eventos da agenda.", undefined, error instanceof Error ? error : undefined),
		);
	}
}

export async function findById(id: number): Promise<Result<AgendaEvento | null>> {
	try {
		const db = createDbClient();
		const { data, error } = await db
			.from("agenda_eventos")
			.select("*")
			.eq("id", id)
			.is("deletado_em", null)
			.single();

		if (error) {
			if (error.code === "PGRST116") return ok(null);
			return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
		}

		return ok(converterParaAgendaEvento(data as AgendaEventoRow));
	} catch (error) {
		return err(
			appError("DATABASE_ERROR", "Erro ao buscar evento da agenda.", undefined, error instanceof Error ? error : undefined),
		);
	}
}

export async function create(
	input: CriarAgendaEventoInput,
	criadoPor: number,
): Promise<Result<AgendaEvento>> {
	try {
		const db = createDbClient();
		const { data, error } = await db
			.from("agenda_eventos")
			.insert({
				titulo: input.titulo,
				descricao: input.descricao ?? null,
				data_inicio: input.dataInicio,
				data_fim: input.dataFim,
				dia_inteiro: input.diaInteiro,
				local: input.local ?? null,
				cor: input.cor,
				responsavel_id: input.responsavelId ?? null,
				criado_por: criadoPor,
			})
			.select()
			.single();

		if (error) {
			return err(appError("DATABASE_ERROR", `Erro ao criar evento: ${error.message}`, { code: error.code }));
		}

		return ok(converterParaAgendaEvento(data as AgendaEventoRow));
	} catch (error) {
		return err(
			appError("DATABASE_ERROR", "Erro ao criar evento da agenda.", undefined, error instanceof Error ? error : undefined),
		);
	}
}

export async function update(
	id: number,
	input: Omit<AtualizarAgendaEventoInput, "id">,
): Promise<Result<AgendaEvento>> {
	try {
		const db = createDbClient();

		const updateData: Record<string, unknown> = {};
		if (input.titulo !== undefined) updateData.titulo = input.titulo;
		if (input.descricao !== undefined) updateData.descricao = input.descricao;
		if (input.dataInicio !== undefined) updateData.data_inicio = input.dataInicio;
		if (input.dataFim !== undefined) updateData.data_fim = input.dataFim;
		if (input.diaInteiro !== undefined) updateData.dia_inteiro = input.diaInteiro;
		if (input.local !== undefined) updateData.local = input.local;
		if (input.cor !== undefined) updateData.cor = input.cor;
		if (input.responsavelId !== undefined) updateData.responsavel_id = input.responsavelId;

		const { data, error } = await db
			.from("agenda_eventos")
			.update(updateData)
			.eq("id", id)
			.is("deletado_em", null)
			.select()
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return err(appError("NOT_FOUND", "Evento não encontrado."));
			}
			return err(appError("DATABASE_ERROR", `Erro ao atualizar evento: ${error.message}`, { code: error.code }));
		}

		return ok(converterParaAgendaEvento(data as AgendaEventoRow));
	} catch (error) {
		return err(
			appError("DATABASE_ERROR", "Erro ao atualizar evento da agenda.", undefined, error instanceof Error ? error : undefined),
		);
	}
}

export async function softDelete(id: number): Promise<Result<void>> {
	try {
		const db = createDbClient();
		const { error } = await db
			.from("agenda_eventos")
			.update({ deletado_em: new Date().toISOString() })
			.eq("id", id)
			.is("deletado_em", null);

		if (error) {
			return err(appError("DATABASE_ERROR", `Erro ao excluir evento: ${error.message}`, { code: error.code }));
		}

		return ok(undefined);
	} catch (error) {
		return err(
			appError("DATABASE_ERROR", "Erro ao excluir evento da agenda.", undefined, error instanceof Error ? error : undefined),
		);
	}
}
