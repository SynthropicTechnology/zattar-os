import { z } from "zod";

// =============================================================================
// INTERFACES
// =============================================================================

export interface AgendaEvento {
	id: number;
	titulo: string;
	descricao: string | null;
	dataInicio: string;
	dataFim: string;
	diaInteiro: boolean;
	local: string | null;
	cor: string;
	responsavelId: number | null;
	criadoPor: number;
	createdAt: string;
	updatedAt: string;
}

// =============================================================================
// SCHEMAS ZOD
// =============================================================================

export const criarAgendaEventoSchema = z
	.object({
		titulo: z.string().min(1, "Título é obrigatório").max(200),
		descricao: z.string().max(2000).nullable().optional(),
		dataInicio: z.string().min(1, "Data de início é obrigatória"),
		dataFim: z.string().min(1, "Data de fim é obrigatória"),
		diaInteiro: z.boolean(),
		local: z.string().max(500).nullable().optional(),
		cor: z.string(),
		responsavelId: z.number().int().positive().nullable().optional(),
	})
	.refine(
		(v) => {
			const start = new Date(v.dataInicio);
			const end = new Date(v.dataFim);
			return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;
		},
		{ message: "Data de fim não pode ser anterior à data de início" },
	);

export type CriarAgendaEventoInput = z.infer<typeof criarAgendaEventoSchema>;

export const atualizarAgendaEventoSchema = z
	.object({
		id: z.number().int().positive(),
		titulo: z.string().min(1).max(200).optional(),
		descricao: z.string().max(2000).nullable().optional(),
		dataInicio: z.string().min(1).optional(),
		dataFim: z.string().min(1).optional(),
		diaInteiro: z.boolean().optional(),
		local: z.string().max(500).nullable().optional(),
		cor: z.string().optional(),
		responsavelId: z.number().int().positive().nullable().optional(),
	});

export type AtualizarAgendaEventoInput = z.infer<typeof atualizarAgendaEventoSchema>;

export const deletarAgendaEventoSchema = z.object({
	id: z.number().int().positive(),
});

export type DeletarAgendaEventoInput = z.infer<typeof deletarAgendaEventoSchema>;

export const listarAgendaEventosSchema = z
	.object({
		startAt: z.string().min(1),
		endAt: z.string().min(1),
	})
	.refine(
		(v) => {
			const start = new Date(v.startAt);
			const end = new Date(v.endAt);
			return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;
		},
		{ message: "Intervalo de datas inválido" },
	);

export type ListarAgendaEventosInput = z.infer<typeof listarAgendaEventosSchema>;
