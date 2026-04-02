/**
 * PARTES DOMAIN - Entidades e Schemas de Validacao
 *
 * Modulo unificado para Clientes, Partes Contrarias e Terceiros.
 * Todas as entidades compartilham estrutura similar (PF/PJ discriminated union).
 *
 * CONVENCOES:
 * - Prefixar schemas de criacao com "create" (ex: createClientePFSchema)
 * - Prefixar schemas de atualizacao com "update" (ex: updateClienteSchema)
 * - Interfaces espelham estrutura do banco
 * - NUNCA importar React/Next.js aqui
 */

import { z } from 'zod';

// =============================================================================
// TIPOS BASE COMPARTILHADOS
// =============================================================================

/**
 * Tipo de pessoa (Pessoa Fisica ou Pessoa Juridica)
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Tipo de parte de um terceiro no processo
 */
export type TipoParteTerceiro =
  | 'PERITO'
  | 'MINISTERIO_PUBLICO'
  | 'ASSISTENTE'
  | 'TESTEMUNHA'
  | 'CUSTOS_LEGIS'
  | 'AMICUS_CURIAE'
  | 'OUTRO';

/**
 * Polo processual de um terceiro
 */
export type PoloTerceiro = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';

/**
 * Grau de jurisdicao de um processo
 */
export type GrauProcesso = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Situação do registro no sistema PJE (Processo Judicial Eletrônico).
 * A: Ativo
 * I: Inativo
 * E: Excluído
 * H: Histórico
 */
export type SituacaoPJE = 'A' | 'I' | 'E' | 'H';

// =============================================================================
// VALIDADORES CUSTOMIZADOS
// =============================================================================

/**
 * Remove caracteres nao numericos de um documento
 */
export function normalizarDocumento(doc: string): string {
  return doc.replace(/\D/g, '');
}

/**
 * Valida formato basico de CPF (11 digitos)
 */
export function validarCpfFormato(cpf: string): boolean {
  const cpfLimpo = normalizarDocumento(cpf);
  return cpfLimpo.length === 11;
}

/**
 * Valida digitos verificadores do CPF
 */
export function validarCpfDigitos(cpf: string): boolean {
  const cpfLimpo = normalizarDocumento(cpf);
  if (cpfLimpo.length !== 11) return false;

  // Rejeita CPFs com todos os digitos iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  // Calcula primeiro digito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo[9])) return false;

  // Calcula segundo digito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo[10])) return false;

  return true;
}

/**
 * Valida formato basico de CNPJ (14 digitos)
 */
export function validarCnpjFormato(cnpj: string): boolean {
  const cnpjLimpo = normalizarDocumento(cnpj);
  return cnpjLimpo.length === 14;
}

/**
 * Valida digitos verificadores do CNPJ
 */
export function validarCnpjDigitos(cnpj: string): boolean {
  const cnpjLimpo = normalizarDocumento(cnpj);
  if (cnpjLimpo.length !== 14) return false;

  // Rejeita CNPJs com todos os digitos iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;

  // Pesos para calculo dos digitos verificadores
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Calcula primeiro digito verificador
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo[i]) * pesos1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(cnpjLimpo[12])) return false;

  // Calcula segundo digito verificador
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo[i]) * pesos2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  if (digito2 !== parseInt(cnpjLimpo[13])) return false;

  return true;
}

/**
 * Valida formato de e-mail
 */
export function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// =============================================================================
// ZOD SCHEMAS CUSTOMIZADOS
// =============================================================================

/**
 * Schema Zod para CPF com validacao de formato
 */
export const cpfSchema = z
  .string()
  .min(11, 'CPF deve ter pelo menos 11 caracteres')
  .transform(normalizarDocumento)
  .refine(validarCpfFormato, { message: 'CPF deve conter 11 digitos' });

/**
 * Schema Zod para CPF com validacao completa (incluindo digitos verificadores)
 */
export const cpfStrictSchema = z
  .string()
  .min(11, 'CPF deve ter pelo menos 11 caracteres')
  .transform(normalizarDocumento)
  .refine(validarCpfDigitos, { message: 'CPF invalido' });

/**
 * Schema Zod para CNPJ com validacao de formato
 */
export const cnpjSchema = z
  .string()
  .min(14, 'CNPJ deve ter pelo menos 14 caracteres')
  .transform(normalizarDocumento)
  .refine(validarCnpjFormato, { message: 'CNPJ deve conter 14 digitos' });

/**
 * Schema Zod para CNPJ com validacao completa (incluindo digitos verificadores)
 */
export const cnpjStrictSchema = z
  .string()
  .min(14, 'CNPJ deve ter pelo menos 14 caracteres')
  .transform(normalizarDocumento)
  .refine(validarCnpjDigitos, { message: 'CNPJ invalido' });

/**
 * Schema Zod para array de e-mails
 */
export const emailArraySchema = z
  .array(z.string().email('E-mail invalido'))
  .nullable()
  .optional();

// =============================================================================
// ENTIDADE: Cliente
// =============================================================================

/**
 * Campos base comuns a um cliente (PF ou PJ)
 */
export interface ClienteBase {
  id: number;
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_social_fantasia: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  tipo_documento: string | null;
  status_pje: string | null;
  situacao_pje: string | null;
  login_pje: string | null;
  autoridade: boolean | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null;
  endereco_id: number | null;
  responsavel_id: number | null;
  ativo: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}


/**
 * Cliente Pessoa Fisica
 */
export interface ClientePessoaFisica extends ClienteBase {
  tipo_pessoa: 'pf';
  cpf: string;
  cnpj: null;
  rg: string | null;
  data_nascimento: string | null;
  genero: string | null;
  estado_civil: string | null;
  nacionalidade: string | null;
  sexo: string | null;
  nome_genitora: string | null;
  naturalidade_id_pje: number | null;
  naturalidade_municipio: string | null;
  naturalidade_estado_id_pje: number | null;
  naturalidade_estado_sigla: string | null;
  uf_nascimento_id_pje: number | null;
  uf_nascimento_sigla: string | null;
  uf_nascimento_descricao: string | null;
  pais_nascimento_id_pje: number | null;
  pais_nascimento_codigo: string | null;
  pais_nascimento_descricao: string | null;
  escolaridade_codigo: number | null;
  situacao_cpf_receita_id: number | null;
  situacao_cpf_receita_descricao: string | null;
  pode_usar_celular_mensagem: boolean | null;
}

/**
 * Cliente Pessoa Juridica
 */
export interface ClientePessoaJuridica extends ClienteBase {
  tipo_pessoa: 'pj';
  cnpj: string;
  cpf: null;
  inscricao_estadual: string | null;
  data_abertura: string | null;
  data_fim_atividade: string | null;
  orgao_publico: boolean | null;
  tipo_pessoa_codigo_pje: string | null;
  tipo_pessoa_label_pje: string | null;
  tipo_pessoa_validacao_receita: string | null;
  ds_tipo_pessoa: string | null;
  situacao_cnpj_receita_id: number | null;
  situacao_cnpj_receita_descricao: string | null;
  ramo_atividade: string | null;
  cpf_responsavel: string | null;
  oficial: boolean | null;
  ds_prazo_expediente_automatico: string | null;
  porte_codigo: number | null;
  porte_descricao: string | null;
  ultima_atualizacao_pje: string | null;
}

/**
 * Tipo unificado para Cliente (Discriminated Union)
 */
export type Cliente = ClientePessoaFisica | ClientePessoaJuridica;

// =============================================================================
// SCHEMAS DE CRIACAO - CLIENTE
// =============================================================================

/**
 * Campos base compartilhados para criacao de cliente
 */
const createClienteBaseSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(500, 'Nome muito longo'),
  nome_social_fantasia: z.string().max(500).nullable().optional(),
  emails: emailArraySchema,
  ddd_celular: z.string().max(5).nullable().optional(),
  numero_celular: z.string().max(15).nullable().optional(),
  ddd_residencial: z.string().max(5).nullable().optional(),
  numero_residencial: z.string().max(15).nullable().optional(),
  ddd_comercial: z.string().max(5).nullable().optional(),
  numero_comercial: z.string().max(15).nullable().optional(),
  tipo_documento: z.string().max(100).nullable().optional(),
  status_pje: z.string().max(50).nullable().optional(),
  situacao_pje: z.string().max(50).nullable().optional(),
  login_pje: z.string().max(100).nullable().optional(),
  autoridade: z.boolean().nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  endereco_id: z.number().positive().nullable().optional(),
  ativo: z.boolean().default(true),
  created_by: z.number().positive().nullable().optional(),
});


/**
 * Schema para criar Cliente Pessoa Fisica
 */
export const createClientePFSchema = createClienteBaseSchema.extend({
  tipo_pessoa: z.literal('pf'),
  cpf: cpfSchema,
  rg: z.string().max(30).nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  genero: z.string().max(50).nullable().optional(),
  estado_civil: z.string().max(50).nullable().optional(),
  nacionalidade: z.string().max(100).nullable().optional(),
  sexo: z.string().max(20).nullable().optional(),
  nome_genitora: z.string().max(500).nullable().optional(),
  naturalidade_id_pje: z.number().nullable().optional(),
  naturalidade_municipio: z.string().max(200).nullable().optional(),
  naturalidade_estado_id_pje: z.number().nullable().optional(),
  naturalidade_estado_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_id_pje: z.number().nullable().optional(),
  uf_nascimento_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_descricao: z.string().max(100).nullable().optional(),
  pais_nascimento_id_pje: z.number().nullable().optional(),
  pais_nascimento_codigo: z.string().max(10).nullable().optional(),
  pais_nascimento_descricao: z.string().max(100).nullable().optional(),
  escolaridade_codigo: z.number().nullable().optional(),
  situacao_cpf_receita_id: z.number().nullable().optional(),
  situacao_cpf_receita_descricao: z.string().max(200).nullable().optional(),
  pode_usar_celular_mensagem: z.boolean().nullable().optional(),
});

/**
 * Schema para criar Cliente Pessoa Juridica
 */
export const createClientePJSchema = createClienteBaseSchema.extend({
  tipo_pessoa: z.literal('pj'),
  cnpj: cnpjSchema,
  inscricao_estadual: z.string().max(30).nullable().optional(),
  data_abertura: z.string().nullable().optional(),
  data_fim_atividade: z.string().nullable().optional(),
  orgao_publico: z.boolean().nullable().optional(),
  tipo_pessoa_codigo_pje: z.string().max(20).nullable().optional(),
  tipo_pessoa_label_pje: z.string().max(200).nullable().optional(),
  tipo_pessoa_validacao_receita: z.string().max(50).nullable().optional(),
  ds_tipo_pessoa: z.string().max(200).nullable().optional(),
  situacao_cnpj_receita_id: z.number().nullable().optional(),
  situacao_cnpj_receita_descricao: z.string().max(200).nullable().optional(),
  ramo_atividade: z.string().max(500).nullable().optional(),
  cpf_responsavel: z.string().max(20).nullable().optional(),
  oficial: z.boolean().nullable().optional(),
  ds_prazo_expediente_automatico: z.string().max(200).nullable().optional(),
  porte_codigo: z.number().nullable().optional(),
  porte_descricao: z.string().max(200).nullable().optional(),
  ultima_atualizacao_pje: z.string().nullable().optional(),
});

/**
 * Schema unificado para criar Cliente (PF ou PJ)
 */
export const createClienteSchema = z.discriminatedUnion('tipo_pessoa', [
  createClientePFSchema,
  createClientePJSchema,
]);

/**
 * Tipos inferidos dos schemas de criacao
 */
export type CreateClientePFInput = z.infer<typeof createClientePFSchema>;
export type CreateClientePJInput = z.infer<typeof createClientePJSchema>;
export type CreateClienteInput = z.infer<typeof createClienteSchema>;

// =============================================================================
// SCHEMAS DE ATUALIZACAO - CLIENTE
// =============================================================================

/**
 * Schema para atualizar Cliente (partial - todos campos opcionais exceto id)
 */
export const updateClienteSchema = z.object({
  nome: z.string().min(1).max(500).optional(),
  nome_social_fantasia: z.string().max(500).nullable().optional(),
  emails: emailArraySchema,
  ddd_celular: z.string().max(5).nullable().optional(),
  numero_celular: z.string().max(15).nullable().optional(),
  ddd_residencial: z.string().max(5).nullable().optional(),
  numero_residencial: z.string().max(15).nullable().optional(),
  ddd_comercial: z.string().max(5).nullable().optional(),
  numero_comercial: z.string().max(15).nullable().optional(),
  tipo_documento: z.string().max(100).nullable().optional(),
  status_pje: z.string().max(50).nullable().optional(),
  situacao_pje: z.string().max(50).nullable().optional(),
  login_pje: z.string().max(100).nullable().optional(),
  autoridade: z.boolean().nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  endereco_id: z.number().positive().nullable().optional(),
  responsavel_id: z.number().positive().nullable().optional(),
  ativo: z.boolean().optional(),

  // Campos PF
  cpf: cpfSchema.optional(),
  rg: z.string().max(30).nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  genero: z.string().max(50).nullable().optional(),
  estado_civil: z.string().max(50).nullable().optional(),
  nacionalidade: z.string().max(100).nullable().optional(),
  sexo: z.string().max(20).nullable().optional(),
  nome_genitora: z.string().max(500).nullable().optional(),
  naturalidade_id_pje: z.number().nullable().optional(),
  naturalidade_municipio: z.string().max(200).nullable().optional(),
  naturalidade_estado_id_pje: z.number().nullable().optional(),
  naturalidade_estado_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_id_pje: z.number().nullable().optional(),
  uf_nascimento_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_descricao: z.string().max(100).nullable().optional(),
  pais_nascimento_id_pje: z.number().nullable().optional(),
  pais_nascimento_codigo: z.string().max(10).nullable().optional(),
  pais_nascimento_descricao: z.string().max(100).nullable().optional(),
  escolaridade_codigo: z.number().nullable().optional(),
  situacao_cpf_receita_id: z.number().nullable().optional(),
  situacao_cpf_receita_descricao: z.string().max(200).nullable().optional(),
  pode_usar_celular_mensagem: z.boolean().nullable().optional(),
  // Campos PJ
  cnpj: cnpjSchema.optional(),
  inscricao_estadual: z.string().max(30).nullable().optional(),
  data_abertura: z.string().nullable().optional(),
  data_fim_atividade: z.string().nullable().optional(),
  orgao_publico: z.boolean().nullable().optional(),
  tipo_pessoa_codigo_pje: z.string().max(20).nullable().optional(),
  tipo_pessoa_label_pje: z.string().max(200).nullable().optional(),
  tipo_pessoa_validacao_receita: z.string().max(50).nullable().optional(),
  ds_tipo_pessoa: z.string().max(200).nullable().optional(),
  situacao_cnpj_receita_id: z.number().nullable().optional(),
  situacao_cnpj_receita_descricao: z.string().max(200).nullable().optional(),
  ramo_atividade: z.string().max(500).nullable().optional(),
  cpf_responsavel: z.string().max(20).nullable().optional(),
  oficial: z.boolean().nullable().optional(),
  ds_prazo_expediente_automatico: z.string().max(200).nullable().optional(),
  porte_codigo: z.number().nullable().optional(),
  porte_descricao: z.string().max(200).nullable().optional(),
  ultima_atualizacao_pje: z.string().nullable().optional(),
});

export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

// =============================================================================
// ENTIDADE: Parte Contraria
// =============================================================================

/**
 * Campos base comuns a uma parte contraria (PF ou PJ)
 * Estrutura identica ao Cliente
 */
export interface ParteContrariaBase {
  id: number;
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_social_fantasia: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  tipo_documento: string | null;
  status_pje: string | null;
  situacao_pje: string | null;
  login_pje: string | null;
  autoridade: boolean | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null;
  endereco_id: number | null;
  ativo: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parte Contraria Pessoa Fisica
 */
export interface ParteContrariaPessoaFisica extends ParteContrariaBase {
  tipo_pessoa: 'pf';
  cpf: string;
  cnpj: null;
  rg: string | null;
  data_nascimento: string | null;
  genero: string | null;
  estado_civil: string | null;
  nacionalidade: string | null;
  sexo: string | null;
  nome_genitora: string | null;
  naturalidade_id_pje: number | null;
  naturalidade_municipio: string | null;
  naturalidade_estado_id_pje: number | null;
  naturalidade_estado_sigla: string | null;
  uf_nascimento_id_pje: number | null;
  uf_nascimento_sigla: string | null;
  uf_nascimento_descricao: string | null;
  pais_nascimento_id_pje: number | null;
  pais_nascimento_codigo: string | null;
  pais_nascimento_descricao: string | null;
  escolaridade_codigo: number | null;
  situacao_cpf_receita_id: number | null;
  situacao_cpf_receita_descricao: string | null;
  pode_usar_celular_mensagem: boolean | null;
}

/**
 * Parte Contraria Pessoa Juridica
 */
export interface ParteContrariaPessoaJuridica extends ParteContrariaBase {
  tipo_pessoa: 'pj';
  cnpj: string;
  cpf: null;
  inscricao_estadual: string | null;
  data_abertura: string | null;
  data_fim_atividade: string | null;
  orgao_publico: boolean | null;
  tipo_pessoa_codigo_pje: string | null;
  tipo_pessoa_label_pje: string | null;
  tipo_pessoa_validacao_receita: string | null;
  ds_tipo_pessoa: string | null;
  situacao_cnpj_receita_id: number | null;
  situacao_cnpj_receita_descricao: string | null;
  ramo_atividade: string | null;
  cpf_responsavel: string | null;
  oficial: boolean | null;
  ds_prazo_expediente_automatico: string | null;
  porte_codigo: number | null;
  porte_descricao: string | null;
  ultima_atualizacao_pje: string | null;
}

/**
 * Tipo unificado para Parte Contraria (Discriminated Union)
 */
export type ParteContraria = ParteContrariaPessoaFisica | ParteContrariaPessoaJuridica;

// =============================================================================
// SCHEMAS DE CRIACAO - PARTE CONTRARIA
// =============================================================================

/**
 * Schema para criar Parte Contraria PF
 */
export const createParteContrariaPFSchema = createClienteBaseSchema.extend({
  tipo_pessoa: z.literal('pf'),
  cpf: cpfSchema,
  rg: z.string().max(30).nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  genero: z.string().max(50).nullable().optional(),
  estado_civil: z.string().max(50).nullable().optional(),
  nacionalidade: z.string().max(100).nullable().optional(),
  sexo: z.string().max(20).nullable().optional(),
  nome_genitora: z.string().max(500).nullable().optional(),
  naturalidade_id_pje: z.number().nullable().optional(),
  naturalidade_municipio: z.string().max(200).nullable().optional(),
  naturalidade_estado_id_pje: z.number().nullable().optional(),
  naturalidade_estado_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_id_pje: z.number().nullable().optional(),
  uf_nascimento_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_descricao: z.string().max(100).nullable().optional(),
  pais_nascimento_id_pje: z.number().nullable().optional(),
  pais_nascimento_codigo: z.string().max(10).nullable().optional(),
  pais_nascimento_descricao: z.string().max(100).nullable().optional(),
  escolaridade_codigo: z.number().nullable().optional(),
  situacao_cpf_receita_id: z.number().nullable().optional(),
  situacao_cpf_receita_descricao: z.string().max(200).nullable().optional(),
  pode_usar_celular_mensagem: z.boolean().nullable().optional(),
});

/**
 * Schema para criar Parte Contraria PJ
 */
export const createParteContrariaPJSchema = createClienteBaseSchema.extend({
  tipo_pessoa: z.literal('pj'),
  cnpj: cnpjSchema,
  inscricao_estadual: z.string().max(30).nullable().optional(),
  data_abertura: z.string().nullable().optional(),
  data_fim_atividade: z.string().nullable().optional(),
  orgao_publico: z.boolean().nullable().optional(),
  tipo_pessoa_codigo_pje: z.string().max(20).nullable().optional(),
  tipo_pessoa_label_pje: z.string().max(200).nullable().optional(),
  tipo_pessoa_validacao_receita: z.string().max(50).nullable().optional(),
  ds_tipo_pessoa: z.string().max(200).nullable().optional(),
  situacao_cnpj_receita_id: z.number().nullable().optional(),
  situacao_cnpj_receita_descricao: z.string().max(200).nullable().optional(),
  ramo_atividade: z.string().max(500).nullable().optional(),
  cpf_responsavel: z.string().max(20).nullable().optional(),
  oficial: z.boolean().nullable().optional(),
  ds_prazo_expediente_automatico: z.string().max(200).nullable().optional(),
  porte_codigo: z.number().nullable().optional(),
  porte_descricao: z.string().max(200).nullable().optional(),
  ultima_atualizacao_pje: z.string().nullable().optional(),
});

/**
 * Schema unificado para criar Parte Contraria
 */
export const createParteContrariaSchema = z.discriminatedUnion('tipo_pessoa', [
  createParteContrariaPFSchema,
  createParteContrariaPJSchema,
]);

export type CreateParteContrariaPFInput = z.infer<typeof createParteContrariaPFSchema>;
export type CreateParteContrariaPJInput = z.infer<typeof createParteContrariaPJSchema>;
export type CreateParteContrariaInput = z.infer<typeof createParteContrariaSchema>;

/**
 * Schema para atualizar Parte Contraria (reutiliza schema de cliente)
 */
export const updateParteContrariaSchema = updateClienteSchema;
export type UpdateParteContrariaInput = z.infer<typeof updateParteContrariaSchema>;

// =============================================================================
// ENTIDADE: Terceiro
// =============================================================================

/**
 * Campos base comuns a um terceiro (PF ou PJ)
 */
export interface TerceiroBase {
  id: number;
  id_tipo_parte: number | null;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_fantasia: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  principal: boolean | null;
  autoridade: boolean | null;
  endereco_desconhecido: boolean | null;
  status_pje: string | null;
  situacao_pje: string | null;
  login_pje: string | null;
  ordem: number | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null;
  ativo: boolean | null;
  endereco_id: number | null;
  ultima_atualizacao_pje: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Terceiro Pessoa Fisica
 */
export interface TerceiroPessoaFisica extends TerceiroBase {
  tipo_pessoa: 'pf';
  cpf: string;
  cnpj: null;
  tipo_documento: string | null;
  rg: string | null;
  sexo: string | null;
  nome_genitora: string | null;
  data_nascimento: string | null;
  genero: string | null;
  estado_civil: string | null;
  nacionalidade: string | null;
  uf_nascimento_id_pje: number | null;
  uf_nascimento_sigla: string | null;
  uf_nascimento_descricao: string | null;
  naturalidade_id_pje: number | null;
  naturalidade_municipio: string | null;
  naturalidade_estado_id_pje: number | null;
  naturalidade_estado_sigla: string | null;
  pais_nascimento_id_pje: number | null;
  pais_nascimento_codigo: string | null;
  pais_nascimento_descricao: string | null;
  escolaridade_codigo: number | null;
  situacao_cpf_receita_id: number | null;
  situacao_cpf_receita_descricao: string | null;
  pode_usar_celular_mensagem: boolean | null;
}

/**
 * Terceiro Pessoa Juridica
 */
export interface TerceiroPessoaJuridica extends TerceiroBase {
  tipo_pessoa: 'pj';
  cnpj: string;
  cpf: null;
  inscricao_estadual: string | null;
  data_abertura: string | null;
  data_fim_atividade: string | null;
  orgao_publico: boolean | null;
  tipo_pessoa_codigo_pje: string | null;
  tipo_pessoa_label_pje: string | null;
  tipo_pessoa_validacao_receita: string | null;
  ds_tipo_pessoa: string | null;
  situacao_cnpj_receita_id: number | null;
  situacao_cnpj_receita_descricao: string | null;
  ramo_atividade: string | null;
  cpf_responsavel: string | null;
  oficial: boolean | null;
  ds_prazo_expediente_automatico: string | null;
  porte_codigo: number | null;
  porte_descricao: string | null;
}

/**
 * Tipo unificado para Terceiro (Discriminated Union)
 */
export type Terceiro = TerceiroPessoaFisica | TerceiroPessoaJuridica;

// =============================================================================
// SCHEMAS DE CRIACAO - TERCEIRO
// =============================================================================

/**
 * Campos base para criacao de terceiro
 */
const createTerceiroBaseSchema = z.object({
  tipo_parte: z.union([
    z.enum(['PERITO', 'MINISTERIO_PUBLICO', 'ASSISTENTE', 'TESTEMUNHA', 'CUSTOS_LEGIS', 'AMICUS_CURIAE', 'OUTRO']),
    z.string(),
  ]),
  polo: z.union([z.enum(['ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO']), z.string()]),
  nome: z.string().min(1, 'Nome e obrigatorio').max(500),
  nome_fantasia: z.string().max(500).nullable().optional(),
  emails: emailArraySchema,
  ddd_celular: z.string().max(5).nullable().optional(),
  numero_celular: z.string().max(15).nullable().optional(),
  ddd_residencial: z.string().max(5).nullable().optional(),
  numero_residencial: z.string().max(15).nullable().optional(),
  ddd_comercial: z.string().max(5).nullable().optional(),
  numero_comercial: z.string().max(15).nullable().optional(),
  principal: z.boolean().nullable().optional(),
  autoridade: z.boolean().nullable().optional(),
  endereco_desconhecido: z.boolean().nullable().optional(),
  status_pje: z.string().max(50).nullable().optional(),
  situacao_pje: z.string().max(50).nullable().optional(),
  login_pje: z.string().max(100).nullable().optional(),
  ordem: z.number().nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  ativo: z.boolean().default(true),
  endereco_id: z.number().positive().nullable().optional(),
});

/**
 * Schema para criar Terceiro PF
 */
export const createTerceiroPFSchema = createTerceiroBaseSchema.extend({
  tipo_pessoa: z.literal('pf'),
  cpf: cpfSchema,
  tipo_documento: z.string().max(100).nullable().optional(),
  rg: z.string().max(30).nullable().optional(),
  sexo: z.string().max(20).nullable().optional(),
  nome_genitora: z.string().max(500).nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  genero: z.string().max(50).nullable().optional(),
  estado_civil: z.string().max(50).nullable().optional(),
  nacionalidade: z.string().max(100).nullable().optional(),
  uf_nascimento_id_pje: z.number().nullable().optional(),
  uf_nascimento_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_descricao: z.string().max(100).nullable().optional(),
  naturalidade_id_pje: z.number().nullable().optional(),
  naturalidade_municipio: z.string().max(200).nullable().optional(),
  naturalidade_estado_id_pje: z.number().nullable().optional(),
  naturalidade_estado_sigla: z.string().max(5).nullable().optional(),
  pais_nascimento_id_pje: z.number().nullable().optional(),
  pais_nascimento_codigo: z.string().max(10).nullable().optional(),
  pais_nascimento_descricao: z.string().max(100).nullable().optional(),
  escolaridade_codigo: z.number().nullable().optional(),
  situacao_cpf_receita_id: z.number().nullable().optional(),
  situacao_cpf_receita_descricao: z.string().max(200).nullable().optional(),
  pode_usar_celular_mensagem: z.boolean().nullable().optional(),
});

/**
 * Schema para criar Terceiro PJ
 */
export const createTerceiroPJSchema = createTerceiroBaseSchema.extend({
  tipo_pessoa: z.literal('pj'),
  cnpj: cnpjSchema,
  inscricao_estadual: z.string().max(30).nullable().optional(),
  data_abertura: z.string().nullable().optional(),
  data_fim_atividade: z.string().nullable().optional(),
  orgao_publico: z.boolean().nullable().optional(),
  tipo_pessoa_codigo_pje: z.string().max(20).nullable().optional(),
  tipo_pessoa_label_pje: z.string().max(200).nullable().optional(),
  tipo_pessoa_validacao_receita: z.string().max(50).nullable().optional(),
  ds_tipo_pessoa: z.string().max(200).nullable().optional(),
  situacao_cnpj_receita_id: z.number().nullable().optional(),
  situacao_cnpj_receita_descricao: z.string().max(200).nullable().optional(),
  ramo_atividade: z.string().max(500).nullable().optional(),
  cpf_responsavel: z.string().max(20).nullable().optional(),
  oficial: z.boolean().nullable().optional(),
  ds_prazo_expediente_automatico: z.string().max(200).nullable().optional(),
  porte_codigo: z.number().nullable().optional(),
  porte_descricao: z.string().max(200).nullable().optional(),
});

/**
 * Schema unificado para criar Terceiro
 */
export const createTerceiroSchema = z.discriminatedUnion('tipo_pessoa', [
  createTerceiroPFSchema,
  createTerceiroPJSchema,
]);

export type CreateTerceiroPFInput = z.infer<typeof createTerceiroPFSchema>;
export type CreateTerceiroPJInput = z.infer<typeof createTerceiroPJSchema>;
export type CreateTerceiroInput = z.infer<typeof createTerceiroSchema>;

/**
 * Schema para atualizar Terceiro (partial)
 */
export const updateTerceiroSchema = z.object({
  tipo_parte: z
    .union([
      z.enum(['PERITO', 'MINISTERIO_PUBLICO', 'ASSISTENTE', 'TESTEMUNHA', 'CUSTOS_LEGIS', 'AMICUS_CURIAE', 'OUTRO']),
      z.string(),
    ])
    .optional(),
  polo: z.union([z.enum(['ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO']), z.string()]).optional(),
  nome: z.string().min(1).max(500).optional(),
  nome_fantasia: z.string().max(500).nullable().optional(),
  emails: emailArraySchema,
  ddd_celular: z.string().max(5).nullable().optional(),
  numero_celular: z.string().max(15).nullable().optional(),
  ddd_residencial: z.string().max(5).nullable().optional(),
  numero_residencial: z.string().max(15).nullable().optional(),
  ddd_comercial: z.string().max(5).nullable().optional(),
  numero_comercial: z.string().max(15).nullable().optional(),
  principal: z.boolean().nullable().optional(),
  autoridade: z.boolean().nullable().optional(),
  endereco_desconhecido: z.boolean().nullable().optional(),
  status_pje: z.string().max(50).nullable().optional(),
  situacao_pje: z.string().max(50).nullable().optional(),
  login_pje: z.string().max(100).nullable().optional(),
  ordem: z.number().nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  ativo: z.boolean().optional(),
  endereco_id: z.number().positive().nullable().optional(),
  // Campos PF
  cpf: cpfSchema.optional(),
  tipo_documento: z.string().max(100).nullable().optional(),
  rg: z.string().max(30).nullable().optional(),
  sexo: z.string().max(20).nullable().optional(),
  nome_genitora: z.string().max(500).nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  genero: z.string().max(50).nullable().optional(),
  estado_civil: z.string().max(50).nullable().optional(),
  nacionalidade: z.string().max(100).nullable().optional(),
  uf_nascimento_id_pje: z.number().nullable().optional(),
  uf_nascimento_sigla: z.string().max(5).nullable().optional(),
  uf_nascimento_descricao: z.string().max(100).nullable().optional(),
  naturalidade_id_pje: z.number().nullable().optional(),
  naturalidade_municipio: z.string().max(200).nullable().optional(),
  naturalidade_estado_id_pje: z.number().nullable().optional(),
  naturalidade_estado_sigla: z.string().max(5).nullable().optional(),
  pais_nascimento_id_pje: z.number().nullable().optional(),
  pais_nascimento_codigo: z.string().max(10).nullable().optional(),
  pais_nascimento_descricao: z.string().max(100).nullable().optional(),
  escolaridade_codigo: z.number().nullable().optional(),
  situacao_cpf_receita_id: z.number().nullable().optional(),
  situacao_cpf_receita_descricao: z.string().max(200).nullable().optional(),
  pode_usar_celular_mensagem: z.boolean().nullable().optional(),
  // Campos PJ
  cnpj: cnpjSchema.optional(),
  inscricao_estadual: z.string().max(30).nullable().optional(),
  data_abertura: z.string().nullable().optional(),
  data_fim_atividade: z.string().nullable().optional(),
  orgao_publico: z.boolean().nullable().optional(),
  tipo_pessoa_codigo_pje: z.string().max(20).nullable().optional(),
  tipo_pessoa_label_pje: z.string().max(200).nullable().optional(),
  tipo_pessoa_validacao_receita: z.string().max(50).nullable().optional(),
  ds_tipo_pessoa: z.string().max(200).nullable().optional(),
  situacao_cnpj_receita_id: z.number().nullable().optional(),
  situacao_cnpj_receita_descricao: z.string().max(200).nullable().optional(),
  ramo_atividade: z.string().max(500).nullable().optional(),
  cpf_responsavel: z.string().max(20).nullable().optional(),
  oficial: z.boolean().nullable().optional(),
  ds_prazo_expediente_automatico: z.string().max(200).nullable().optional(),
  porte_codigo: z.number().nullable().optional(),
  porte_descricao: z.string().max(200).nullable().optional(),
});

export type UpdateTerceiroInput = z.infer<typeof updateTerceiroSchema>;

// =============================================================================
// PARAMETROS DE LISTAGEM
// =============================================================================

/**
 * Campos para ordenacao de Cliente/ParteContraria
 */
export type OrdenarPorParte = 'nome' | 'cpf' | 'cnpj' | 'tipo_pessoa' | 'created_at' | 'updated_at';

/**
 * Ordem de ordenacao
 */
export type Ordem = 'asc' | 'desc';

/**
 * Parametros para listar Clientes
 */
export interface ListarClientesParams {
  pagina?: number;
  limite?: number;
  tipo_pessoa?: TipoPessoa;
  trt?: string;
  grau?: GrauProcesso;
  busca?: string;
  nome?: string;
  cpf?: string;
  cnpj?: string;
  /**
   * Situação do cliente no sistema (soft delete).
   * - true: ativo
   * - false: inativo
   */
  ativo?: boolean;
  ordenar_por?: OrdenarPorParte;
  ordem?: Ordem;
  numero_processo?: string;
  /** Se true, inclui dados de endereco via JOIN */
  incluir_endereco?: boolean;
  /** Se true, inclui lista de processos relacionados */
  incluir_processos?: boolean;
}

/**
 * Parametros para listar Partes Contrarias
 */
export interface ListarPartesContrariasParams {
  pagina?: number;
  limite?: number;
  tipo_pessoa?: TipoPessoa;
  /** Situacao: A=Ativo, I=Inativo, E=Excluido, H=Historico */
  situacao?: 'A' | 'I' | 'E' | 'H';
  trt?: string;
  grau?: GrauProcesso;
  busca?: string;
  nome?: string;
  cpf?: string;
  cnpj?: string;
  ordenar_por?: OrdenarPorParte;
  ordem?: Ordem;
  numero_processo?: string;
  /** Se true, inclui dados de endereco via JOIN */
  incluir_endereco?: boolean;
  /** Se true, inclui lista de processos relacionados */
  incluir_processos?: boolean;
}

/**
 * Campos para ordenacao de Terceiro
 */
export type OrdenarPorTerceiro =
  | 'nome'
  | 'cpf'
  | 'cnpj'
  | 'tipo_pessoa'
  | 'tipo_parte'
  | 'polo'
  | 'created_at'
  | 'updated_at';

/**
 * Parametros para listar Terceiros
 */
export interface ListarTerceirosParams {
  pagina?: number;
  limite?: number;
  tipo_pessoa?: TipoPessoa;
  tipo_parte?: TipoParteTerceiro;
  polo?: PoloTerceiro;
  /** Situacao: A=Ativo, I=Inativo */
  situacao?: 'A' | 'I';
  busca?: string;
  nome?: string;
  cpf?: string;
  cnpj?: string;
  ordenar_por?: OrdenarPorTerceiro;
  ordem?: Ordem;
  /** Se true, inclui dados de endereco via JOIN */
  incluir_endereco?: boolean;
  /** Se true, inclui lista de processos relacionados */
  incluir_processos?: boolean;
}

// =============================================================================
// TIPOS COM RELACIONAMENTOS (JOINs)
// =============================================================================

import type { Endereco } from '@/app/app/enderecos';

/**
 * Processo relacionado a uma parte (resumo expandido para HoverCard)
 */
export interface ProcessoRelacionado {
  processo_id: number;
  numero_processo: string;
  tipo_parte: string;
  polo: string;
  // Campos adicionais do acervo para HoverCard
  nome_parte_autora?: string | null;
  nome_parte_re?: string | null;
  grau?: string | null;
  codigo_status_processo?: string | null;
  classe_judicial?: string | null;
  data_proxima_audiencia?: string | null;
  trt?: string | null;
}

/**
 * Cliente Pessoa Fisica com endereco populado (JOIN)
 */
export interface ClientePessoaFisicaComEndereco extends ClientePessoaFisica {
  endereco: Endereco | null;
}

/**
 * Cliente Pessoa Juridica com endereco populado (JOIN)
 */
export interface ClientePessoaJuridicaComEndereco extends ClientePessoaJuridica {
  endereco: Endereco | null;
}

/**
 * Cliente com endereco populado (Discriminated Union)
 */
export type ClienteComEndereco = ClientePessoaFisicaComEndereco | ClientePessoaJuridicaComEndereco;

/**
 * Cliente Pessoa Fisica com endereco e processos relacionados
 */
export interface ClientePessoaFisicaComEnderecoEProcessos extends ClientePessoaFisicaComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Cliente Pessoa Juridica com endereco e processos relacionados
 */
export interface ClientePessoaJuridicaComEnderecoEProcessos extends ClientePessoaJuridicaComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Cliente com endereco e processos relacionados (Discriminated Union)
 */
export type ClienteComEnderecoEProcessos =
  | ClientePessoaFisicaComEnderecoEProcessos
  | ClientePessoaJuridicaComEnderecoEProcessos;

// =============================================================================
// PARTE CONTRARIA COM ENDERECO E PROCESSOS
// =============================================================================

/**
 * Parte Contraria Pessoa Fisica com endereco populado (JOIN)
 */
export interface ParteContrariaPessoaFisicaComEndereco extends ParteContrariaPessoaFisica {
  endereco: Endereco | null;
}

/**
 * Parte Contraria Pessoa Juridica com endereco populado (JOIN)
 */
export interface ParteContrariaPessoaJuridicaComEndereco extends ParteContrariaPessoaJuridica {
  endereco: Endereco | null;
}

/**
 * Parte Contraria com endereco populado (Discriminated Union)
 */
export type ParteContrariaComEndereco = ParteContrariaPessoaFisicaComEndereco | ParteContrariaPessoaJuridicaComEndereco;

/**
 * Parte Contraria Pessoa Fisica com endereco e processos relacionados
 */
export interface ParteContrariaPessoaFisicaComEnderecoEProcessos extends ParteContrariaPessoaFisicaComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Parte Contraria Pessoa Juridica com endereco e processos relacionados
 */
export interface ParteContrariaPessoaJuridicaComEnderecoEProcessos extends ParteContrariaPessoaJuridicaComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Parte Contraria com endereco e processos relacionados (Discriminated Union)
 */
export type ParteContrariaComEnderecoEProcessos =
  | ParteContrariaPessoaFisicaComEnderecoEProcessos
  | ParteContrariaPessoaJuridicaComEnderecoEProcessos;

// =============================================================================
// TERCEIRO COM ENDERECO E PROCESSOS
// =============================================================================

/**
 * Terceiro Pessoa Fisica com endereco populado (JOIN)
 */
export interface TerceiroPessoaFisicaComEndereco extends TerceiroPessoaFisica {
  endereco: Endereco | null;
}

/**
 * Terceiro Pessoa Juridica com endereco populado (JOIN)
 */
export interface TerceiroPessoaJuridicaComEndereco extends TerceiroPessoaJuridica {
  endereco: Endereco | null;
}

/**
 * Terceiro com endereco populado (Discriminated Union)
 */
export type TerceiroComEndereco = TerceiroPessoaFisicaComEndereco | TerceiroPessoaJuridicaComEndereco;

/**
 * Terceiro Pessoa Fisica com endereco e processos relacionados
 */
export interface TerceiroPessoaFisicaComEnderecoEProcessos extends TerceiroPessoaFisicaComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Terceiro Pessoa Juridica com endereco e processos relacionados
 */
export interface TerceiroPessoaJuridicaComEnderecoEProcessos extends TerceiroPessoaJuridicaComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Terceiro com endereco e processos relacionados (Discriminated Union)
 */
export type TerceiroComEnderecoEProcessos =
  | TerceiroPessoaFisicaComEnderecoEProcessos
  | TerceiroPessoaJuridicaComEnderecoEProcessos;
