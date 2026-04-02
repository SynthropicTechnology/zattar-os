import { z } from 'zod';

export const processoWorkspaceAnnotationSchema = z.object({
  id: z.number().int().positive(),
  usuarioId: z.number().int().positive(),
  processoId: z.number().int().positive(),
  numeroProcesso: z.string().trim().min(1),
  timelineItemId: z.number().int(),
  itemTitle: z.string().trim().min(1).nullable().optional(),
  itemDate: z.string().nullable().optional(),
  content: z.string().trim().min(1),
  anchor: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProcessoWorkspaceAnnotation = z.infer<typeof processoWorkspaceAnnotationSchema>;

export const listarProcessoWorkspaceAnotacoesSchema = z.object({
  processoId: z.number().int().positive(),
});

export const criarProcessoWorkspaceAnotacaoSchema = z.object({
  processoId: z.number().int().positive(),
  numeroProcesso: z.string().trim().min(1),
  timelineItemId: z.number().int(),
  itemTitle: z.string().trim().max(500).nullable().optional(),
  itemDate: z.string().nullable().optional(),
  content: z.string().trim().min(1).max(5000),
  anchor: z.record(z.string(), z.unknown()).optional().default({}),
});

export type CriarProcessoWorkspaceAnotacaoInput = z.infer<typeof criarProcessoWorkspaceAnotacaoSchema>;

export const deletarProcessoWorkspaceAnotacaoSchema = z.object({
  annotationId: z.number().int().positive(),
  processoId: z.number().int().positive(),
});

export type DeletarProcessoWorkspaceAnotacaoInput = z.infer<typeof deletarProcessoWorkspaceAnotacaoSchema>;