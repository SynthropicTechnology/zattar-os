'use server';

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import { validarGeracaoPdfs } from '../services/documentos-contratacao.service';

const validarSchema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string()).optional(),
});

export const actionValidarGeracaoPdfs = authenticatedAction(
  validarSchema,
  async (input) => {
    const result = await validarGeracaoPdfs(input.contratoId, input.overrides ?? {});
    return result;
  },
);
