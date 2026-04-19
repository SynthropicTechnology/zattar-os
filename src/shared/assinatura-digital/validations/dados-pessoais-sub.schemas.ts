import { z } from 'zod'
import { dadosPessoaisSchema } from './dados-pessoais.schema'

/**
 * Schemas para os três substeps do sub-wizard Dados Pessoais.
 *
 * Cada substep valida apenas a fatia que exibe. O schema completo
 * (dadosPessoaisSchema) permanece no ponto de persistência final (Endereço)
 * para garantir integridade do payload enviado ao backend.
 */

export const identidadeSchema = dadosPessoaisSchema.pick({
  name: true,
  cpf: true,
  rg: true,
  dataNascimento: true,
  genero: true,
  nacionalidade: true,
  estadoCivil: true,
})

export const contatosSchema = dadosPessoaisSchema.pick({
  email: true,
  celular: true,
  telefone: true,
})

export const enderecoSchema = dadosPessoaisSchema.pick({
  cep: true,
  logradouro: true,
  numero: true,
  complemento: true,
  bairro: true,
  cidade: true,
  estado: true,
})

/**
 * Schema unificado do passo "Contato" — agrupa contatos (email/telefones)
 * + endereço num único form. Substitui os substeps separados.
 */
export const contatoSchema = dadosPessoaisSchema.pick({
  email: true,
  celular: true,
  telefone: true,
  cep: true,
  logradouro: true,
  numero: true,
  complemento: true,
  bairro: true,
  cidade: true,
  estado: true,
})

export type IdentidadeFormData = z.infer<typeof identidadeSchema>
export type ContatosFormData = z.infer<typeof contatosSchema>
export type EnderecoFormData = z.infer<typeof enderecoSchema>
export type ContatoFormData = z.infer<typeof contatoSchema>
