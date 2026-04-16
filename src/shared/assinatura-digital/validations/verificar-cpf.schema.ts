import { z } from 'zod';

export const verificarCPFSchema = z.object({
  cpf: z.string().min(11, 'CPF obrigatório'),
});

export type VerificarCPFFormData = z.infer<typeof verificarCPFSchema>;


