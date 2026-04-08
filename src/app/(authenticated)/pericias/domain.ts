import { z } from "zod";

import { CodigoTribunal as CodigoTribunalArray, GrauTribunal as GrauTribunalEnum } from "@/app/(authenticated)/expedientes";

// Re-export array value
export const CodigoTribunal = CodigoTribunalArray;

// Re-export type derived from the array
export type CodigoTribunal = (typeof CodigoTribunal)[number];

// Re-export GrauTribunal type (valor/enum deve ser importado diretamente de expedientes/domain quando necessário)
export type GrauTribunal = GrauTribunalEnum;

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export enum SituacaoPericiaCodigo {
  AGUARDANDO_ESCLARECIMENTOS = "S",
  AGUARDANDO_LAUDO = "L",
  CANCELADA = "C",
  FINALIZADA = "F",
  LAUDO_JUNTADO = "P",
  REDESIGNADA = "R",
}

export const SITUACAO_PERICIA_LABELS: Record<SituacaoPericiaCodigo, string> = {
  [SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS]:
    "Aguardando Esclarecimentos",
  [SituacaoPericiaCodigo.AGUARDANDO_LAUDO]: "Aguardando Laudo",
  [SituacaoPericiaCodigo.CANCELADA]: "Cancelada",
  [SituacaoPericiaCodigo.FINALIZADA]: "Finalizada",
  [SituacaoPericiaCodigo.LAUDO_JUNTADO]: "Laudo Juntado",
  [SituacaoPericiaCodigo.REDESIGNADA]: "Redesignada",
};

// =============================================================================
// INTERFACES (DOMAIN)
// =============================================================================

export interface Pericia {
  id: number;
  idPje: number;
  advogadoId: number;
  processoId: number;
  orgaoJulgadorId: number | null;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numeroProcesso: string;
  prazoEntrega: string | null;
  dataAceite: string | null;
  dataCriacao: string;
  situacaoCodigo: SituacaoPericiaCodigo;
  situacaoDescricao: string | null;
  situacaoPericia: string | null;
  idDocumentoLaudo: number | null;
  laudoJuntado: boolean;
  especialidadeId: number | null;
  peritoId: number | null;
  classeJudicialSigla: string | null;
  dataProximaAudiencia: string | null;
  segredoJustica: boolean;
  juizoDigital: boolean;
  arquivado: boolean;
  prioridadeProcessual: boolean;
  permissoesPericia: Record<string, boolean> | null;
  funcionalidadeEditor: string | null;
  responsavelId: number | null;
  observacoes: string | null;
  dadosAnteriores: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;

  // Joins (opcional)
  especialidade?: { descricao: string } | null;
  perito?: { nome: string } | null;
  responsavel?: { nomeExibicao: string } | null;
  processo?: {
    numeroProcesso: string;
    nomeParteAutora: string | null;
    nomeParteRe: string | null;
  } | null;
}

// =============================================================================
// ZOD SCHEMAS (VALIDATION)
// =============================================================================

export const atribuirResponsavelSchema = z.object({
  periciaId: z.number().min(1),
  responsavelId: z.number().min(1),
});

export const adicionarObservacaoSchema = z.object({
  periciaId: z.number().min(1),
  observacoes: z.string().min(1),
});

export const criarPericiaSchema = z.object({
  numeroProcesso: z.string().min(20, "Número do processo inválido (mínimo 20 caracteres)"),
  trt: z.string().min(1, "TRT é obrigatório"),
  grau: z.enum(["primeiro_grau", "segundo_grau"], {
    errorMap: () => ({ message: "Grau inválido" }),
  }),
  prazoEntrega: z.string().optional(),
  situacaoCodigo: z.nativeEnum(SituacaoPericiaCodigo).default(SituacaoPericiaCodigo.AGUARDANDO_LAUDO),
  especialidadeId: z.number().optional(),
  peritoId: z.number().optional(),
  observacoes: z.string().optional(),
});

export type CriarPericiaInput = z.infer<typeof criarPericiaSchema>;

// =============================================================================
// PARAMS TYPES (FILTERS & SORTING)
// =============================================================================

export type PericiaSortBy = "prazo_entrega" | "data_criacao" | "situacao_codigo";

export type ListarPericiasParams = {
  pagina?: number;
  limite?: number;
  busca?: string;
  processoId?: number;
  trt?: CodigoTribunal;
  grau?: GrauTribunal;
  situacaoCodigo?: SituacaoPericiaCodigo;
  /** Exclui perícias com esses códigos de situação */
  situacoesExcluidas?: SituacaoPericiaCodigo[];
  responsavelId?: number | "null";
  semResponsavel?: boolean;
  especialidadeId?: number;
  peritoId?: number;
  laudoJuntado?: boolean;
  prazoEntregaInicio?: string;
  prazoEntregaFim?: string;
  dataCriacaoInicio?: string;
  dataCriacaoFim?: string;
  segredoJustica?: boolean;
  prioridadeProcessual?: boolean;
  arquivado?: boolean;
  ordenarPor?: PericiaSortBy;
  ordem?: "asc" | "desc";
};

export type PericiasFilters = Omit<
  ListarPericiasParams,
  "pagina" | "limite" | "ordenarPor" | "ordem"
>;

// =============================================================================
// OPTION TYPES (UI — consolidado de types.ts)
// =============================================================================

import type { Usuario } from "@/app/(authenticated)/usuarios";

export type UsuarioOption = Pick<Usuario, "id" | "nomeExibicao" | "nomeCompleto" | "avatarUrl"> & {
  nome_exibicao?: string;
  nome?: string;
};

export type EspecialidadePericiaOption = {
  id: number;
  descricao: string;
};

export type PeritoOption = {
  id: number;
  nome: string;
};

// =============================================================================
// RE-EXPORTS (compatibilidade com padrão de expedientes)
// =============================================================================
// CodigoTribunal and GrauTribunal are exported above


