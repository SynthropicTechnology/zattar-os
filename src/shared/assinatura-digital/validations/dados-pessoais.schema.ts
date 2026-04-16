import { z } from 'zod';

import {
  ESTADOS_CIVIS,
  GENEROS,
  NACIONALIDADES,
} from '../constants';

export const dadosPessoaisSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  cpf: z.string().min(11, 'CPF obrigatório'),
  email: z.string().email('E-mail inválido'),
  celular: z.string().min(10, 'Celular obrigatório'),
  telefone: z.string().optional(),
  rg: z.string().optional(),
  dataNascimento: z.string().optional(),

  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),

  estadoCivil: z.string().optional(),
  genero: z.string().optional(),
  nacionalidade: z.string().optional(),
});

export type DadosPessoaisFormData = z.infer<typeof dadosPessoaisSchema>;

export function getEstadoCivilText(value: string | null | undefined): string {
  if (!value) return '';
  return ESTADOS_CIVIS[value] ?? '';
}

export function getGeneroText(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const key = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return GENEROS[key] ?? '';
}

export function getNacionalidadeText(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const key = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return NACIONALIDADES[key] ?? '';
}


