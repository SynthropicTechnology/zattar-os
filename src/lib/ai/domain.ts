import { z } from 'zod';

export const ENTITY_TYPES = {
  documento: 'documento',
  processo_peca: 'processo_peca',
  processo_andamento: 'processo_andamento',
  contrato: 'contrato',
  expediente: 'expediente',
  assinatura_digital: 'assinatura_digital',
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

const entityTypeValues = Object.values(ENTITY_TYPES) as [string, ...string[]];

export const embeddingSchema = z.object({
  content: z.string().min(1),
  embedding: z.array(z.number()),
  entity_type: z.enum(entityTypeValues),
  entity_id: z.number(),
  parent_id: z.number().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const indexDocumentSchema = z.object({
  entity_type: z.enum(entityTypeValues),
  entity_id: z.number(),
  parent_id: z.number().nullable().optional(),
  storage_provider: z.enum(['backblaze', 'supabase', 'google_drive']),
  storage_key: z.string(),
  content_type: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1),
  match_threshold: z.number().min(0).max(1).default(0.7),
  match_count: z.number().int().positive().default(5),
  filter_entity_type: z.enum(entityTypeValues).optional(),
  filter_parent_id: z.number().optional(),
  filter_metadata: z.record(z.unknown()).optional(),
});

export type Embedding = z.infer<typeof embeddingSchema>;
export type IndexDocumentParams = z.infer<typeof indexDocumentSchema>;
export type SearchParams = z.infer<typeof searchSchema>;

export interface EmbeddingRecord {
  id: number;
  content: string;
  embedding: number[];
  entity_type: EntityType;
  entity_id: number;
  parent_id: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  indexed_by: number | null;
}

export interface SearchResult {
  id: number;
  content: string;
  entity_type: EntityType;
  entity_id: number;
  parent_id: number | null;
  metadata: Record<string, unknown>;
  similarity: number;
}
