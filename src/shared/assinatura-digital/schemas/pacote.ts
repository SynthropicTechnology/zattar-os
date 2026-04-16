import { z } from 'zod';

export const criarPacoteInputSchema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string()).optional(),
});

export type CriarPacoteInput = z.infer<typeof criarPacoteInputSchema>;
