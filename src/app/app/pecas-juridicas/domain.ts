import { z } from "zod";

// =============================================================================
// ENUMS
// =============================================================================

export const TIPOS_PECA_JURIDICA = [
  "peticao_inicial",
  "contestacao",
  "recurso_ordinario",
  "agravo",
  "embargos_declaracao",
  "manifestacao",
  "parecer",
  "contrato_honorarios",
  "procuracao",
  "outro",
] as const;

export type TipoPecaJuridica = (typeof TIPOS_PECA_JURIDICA)[number];

export const VISIBILIDADE_MODELO = ["publico", "privado"] as const;
export type VisibilidadeModelo = (typeof VISIBILIDADE_MODELO)[number];

// Labels para exibição
export const TIPO_PECA_LABELS: Record<TipoPecaJuridica, string> = {
  peticao_inicial: "Petição Inicial",
  contestacao: "Contestação",
  recurso_ordinario: "Recurso Ordinário",
  agravo: "Agravo",
  embargos_declaracao: "Embargos de Declaração",
  manifestacao: "Manifestação",
  parecer: "Parecer",
  contrato_honorarios: "Contrato de Honorários",
  procuracao: "Procuração",
  outro: "Outro",
};

// =============================================================================
// TYPES - PecaModelo
// =============================================================================

export interface PecaModelo {
  id: number;
  titulo: string;
  descricao: string | null;
  tipoPeca: TipoPecaJuridica;
  conteudo: unknown[]; // Plate.js Value
  placeholdersDefinidos: string[];
  visibilidade: VisibilidadeModelo;
  segmentoId: number | null;
  criadoPor: number | null;
  ativo: boolean;
  usoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PecaModeloListItem {
  id: number;
  titulo: string;
  descricao: string | null;
  tipoPeca: TipoPecaJuridica;
  visibilidade: VisibilidadeModelo;
  segmentoId: number | null;
  criadoPor: number | null;
  usoCount: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TYPES - ContratoDocumento
// =============================================================================

export interface ContratoDocumento {
  id: number;
  contratoId: number;
  documentoId: number | null;
  arquivoId: number | null;
  geradoDeModeloId: number | null;
  tipoPeca: TipoPecaJuridica | null;
  observacoes: string | null;
  createdBy: number | null;
  createdAt: string;
  // Relations (quando carregados)
  documento?: {
    id: number;
    titulo: string;
    createdAt: string;
  };
  arquivo?: {
    id: number;
    nome: string;
    b2Url: string;
    tipoMime: string;
  };
  modelo?: {
    id: number;
    titulo: string;
  };
}

// =============================================================================
// SCHEMAS - PecaModelo
// =============================================================================

export const tipoPecaJuridicaSchema = z.enum(TIPOS_PECA_JURIDICA);
export const visibilidadeModeloSchema = z.enum(VISIBILIDADE_MODELO);

export const createPecaModeloSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(255),
  descricao: z.string().max(1000).nullable().optional(),
  tipoPeca: tipoPecaJuridicaSchema.default("outro"),
  conteudo: z.array(z.unknown()).default([]),
  placeholdersDefinidos: z.array(z.string()).default([]),
  visibilidade: visibilidadeModeloSchema.default("privado"),
  segmentoId: z.number().nullable().optional(),
});

export type CreatePecaModeloInput = z.infer<typeof createPecaModeloSchema>;

export const updatePecaModeloSchema = createPecaModeloSchema.partial();

export type UpdatePecaModeloInput = z.infer<typeof updatePecaModeloSchema>;

// =============================================================================
// SCHEMAS - ContratoDocumento
// =============================================================================

export const createContratoDocumentoSchema = z
  .object({
    contratoId: z.number().positive(),
    documentoId: z.number().positive().nullable().optional(),
    arquivoId: z.number().positive().nullable().optional(),
    geradoDeModeloId: z.number().positive().nullable().optional(),
    tipoPeca: tipoPecaJuridicaSchema.nullable().optional(),
    observacoes: z.string().max(1000).nullable().optional(),
  })
  .refine((data) => data.documentoId || data.arquivoId, {
    message: "Deve fornecer documentoId ou arquivoId",
  });

export type CreateContratoDocumentoInput = z.infer<
  typeof createContratoDocumentoSchema
>;

// =============================================================================
// SCHEMAS - Geração de Peça
// =============================================================================

export const gerarPecaSchema = z.object({
  contratoId: z.number().positive("Contrato é obrigatório"),
  modeloId: z.number().positive("Modelo é obrigatório"),
  titulo: z.string().min(1, "Título é obrigatório").max(255),
});

export type GerarPecaInput = z.infer<typeof gerarPecaSchema>;

// =============================================================================
// FILTERS
// =============================================================================

export interface ListarPecasModelosParams {
  tipoPeca?: TipoPecaJuridica;
  visibilidade?: VisibilidadeModelo;
  segmentoId?: number;
  criadoPor?: number;
  apenasAtivos?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "titulo" | "created_at" | "uso_count";
  orderDirection?: "asc" | "desc";
}

export interface ListarContratoDocumentosParams {
  contratoId: number;
  tipoPeca?: TipoPecaJuridica;
  page?: number;
  pageSize?: number;
}

// =============================================================================
// DATABASE ROW TYPES (snake_case)
// =============================================================================

export interface PecaModeloRow {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo_peca: TipoPecaJuridica;
  conteudo: unknown[];
  placeholders_definidos: string[];
  visibilidade: VisibilidadeModelo;
  segmento_id: number | null;
  criado_por: number | null;
  ativo: boolean;
  uso_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContratoDocumentoRow {
  id: number;
  contrato_id: number;
  documento_id: number | null;
  arquivo_id: number | null; // Adicionado
  gerado_de_modelo_id: number | null;
  tipo_peca: TipoPecaJuridica | null;
  observacoes: string | null;
  created_by: number | null;
  created_at: string;
}

// =============================================================================
// MAPPERS
// =============================================================================

export function mapPecaModeloRowToModel(row: PecaModeloRow): PecaModelo {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    tipoPeca: row.tipo_peca,
    conteudo: row.conteudo,
    placeholdersDefinidos: row.placeholders_definidos,
    visibilidade: row.visibilidade,
    segmentoId: row.segmento_id,
    criadoPor: row.criado_por,
    ativo: row.ativo,
    usoCount: row.uso_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPecaModeloRowToListItem(
  row: PecaModeloRow
): PecaModeloListItem {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    tipoPeca: row.tipo_peca,
    visibilidade: row.visibilidade,
    segmentoId: row.segmento_id,
    criadoPor: row.criado_por,
    usoCount: row.uso_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContratoDocumentoRowToModel(
  row: ContratoDocumentoRow & {
    documentos?: { id: number; titulo: string; created_at: string } | null;
    arquivos?: {
      id: number;
      nome: string;
      b2_url: string;
      tipo_mime: string;
    } | null; // Adicionado
    pecas_modelos?: { id: number; titulo: string } | null;
  }
): ContratoDocumento {
  return {
    id: row.id,
    contratoId: row.contrato_id,
    documentoId: row.documento_id,
    arquivoId: row.arquivo_id,
    geradoDeModeloId: row.gerado_de_modelo_id,
    tipoPeca: row.tipo_peca,
    observacoes: row.observacoes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    documento: row.documentos
      ? {
          id: row.documentos.id,
          titulo: row.documentos.titulo,
          createdAt: row.documentos.created_at,
        }
      : undefined,
    arquivo: row.arquivos
      ? {
          id: row.arquivos.id,
          nome: row.arquivos.nome,
          b2Url: row.arquivos.b2_url,
          tipoMime: row.arquivos.tipo_mime,
        }
      : undefined,
    modelo: row.pecas_modelos
      ? {
          id: row.pecas_modelos.id,
          titulo: row.pecas_modelos.titulo,
        }
      : undefined,
  };
}
