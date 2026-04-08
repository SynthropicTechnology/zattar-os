
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

// Tipos baseados na estrutura do banco e frontend
export type GeneroUsuario = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar';

export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
}

export interface UsuarioDados {
  nomeCompleto: string;
  nomeExibicao: string;
  cpf: string;
  rg?: string | null;
  dataNascimento?: string | null; // ISO date string (YYYY-MM-DD)
  genero?: GeneroUsuario | null;
  oab?: string | null;
  ufOab?: string | null;
  emailPessoal?: string | null;
  emailCorporativo: string;
  telefone?: string | null;
  ramal?: string | null;
  endereco?: Endereco | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  authUserId?: string | null; // UUID do Supabase Auth
  cargoId?: number | null;
  isSuperAdmin?: boolean;
  ativo?: boolean;
}

export interface Usuario {
  id: number;
  authUserId: string | null;
  nomeCompleto: string;
  nomeExibicao: string;
  cpf: string;
  rg: string | null;
  dataNascimento: string | null;
  genero: GeneroUsuario | null;
  oab: string | null;
  ufOab: string | null;
  emailPessoal: string | null;
  emailCorporativo: string;
  telefone: string | null;
  ramal: string | null;
  endereco: Endereco | null;
  cargoId: number | null;
  cargo?: {
    id: number;
    nome: string;
    descricao: string | null;
  } | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  isSuperAdmin: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListarUsuariosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em nome_completo, nome_exibicao, cpf, email_corporativo
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
  cargoId?: number | null;
  isSuperAdmin?: boolean;
}

export interface UsuariosFilters {
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
}

export interface ListarUsuariosResult {
  usuarios: Usuario[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// Permissões
export interface Permissao {
  recurso: string;
  operacao: string;
  permitido: boolean;
}

export interface PermissaoMatriz {
  recurso: string;
  operacoes: {
    [operacao: string]: boolean;
  };
}

export interface UsuarioDetalhado extends Usuario {
  permissoes: Permissao[];
}

export interface PermissoesSaveState {
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  hasChanges: boolean;
}

export interface OperacaoUsuarioResult {
  sucesso: boolean;
  usuario?: Usuario;
  erro?: string;
  data?: unknown;
  itensDesatribuidos?: unknown;
}

// ============================================================================
// Constants
// ============================================================================

export const GENERO_LABELS = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  outro: 'Outro',
  prefiro_nao_informar: 'Prefiro não informar',
} as const;

export const STATUS_LABELS = {
  ativo: 'Ativo',
  inativo: 'Inativo',
} as const;

// ============================================================================
// Schemas Zod
// ============================================================================

// Schemas básicos
export const cpfSchema = z.string().transform((val) => val.replace(/\D/g, '')).refine((val) => val.length === 11, {
  message: 'CPF deve conter 11 dígitos',
});

export const emailSchema = z.string().email('Email inválido');

export const telefoneSchema = z.string().transform((val) => val ? val.replace(/\D/g, '') : null).nullable();

// Schema de Endereço
export const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Estado deve ter 2 letras').optional(),
  pais: z.string().optional(),
  cep: z.string().transform((val) => val ? val.replace(/\D/g, '') : undefined).optional(),
}).nullable().optional();

// Schema de Criação de Usuário
export const criarUsuarioSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
  nomeExibicao: z.string().min(2, 'Nome de exibição deve ter no mínimo 2 caracteres'),
  cpf: cpfSchema,
  rg: z.string().optional().nullable(),
  dataNascimento: z.string().nullable().optional(), // ISO string YYYY-MM-DD
  genero: z.enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar']).nullable().optional(),
  oab: z.string().optional().nullable(),
  ufOab: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().length(2, 'UF da OAB deve ter 2 letras').nullable().optional()
  ),
  emailPessoal: emailSchema.nullable().optional().or(z.literal('')),
  emailCorporativo: emailSchema,
  telefone: telefoneSchema.optional(),
  ramal: z.string().optional().nullable(),
  endereco: enderecoSchema,
  authUserId: z.string().uuid().optional().nullable(),
  cargoId: z.coerce.number().optional().nullable(),
  isSuperAdmin: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

// Schema de Atualização de Usuário
export const atualizarUsuarioSchema = criarUsuarioSchema.partial().extend({
  id: z.number(),
});

// ============================================================================
// Type Guards
// ============================================================================

export function isUsuarioAtivo(usuario: { ativo: boolean }): boolean {
  return usuario.ativo;
}

export function isSuperAdmin(usuario: { isSuperAdmin: boolean }): boolean {
  return usuario.isSuperAdmin;
}

// =============================================================================
// COLUMN SELECTION HELPERS (Disk I/O Optimization)
// =============================================================================

/**
 * Colunas básicas de usuário (sem joins)
 */
export function getUsuarioColumnsBasic(): string {
  return `
    id,
    nome_completo,
    nome_exibicao,
    email_corporativo,
    cargo_id,
    avatar_url,
    ativo,
    is_super_admin
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas completas de usuário (sem joins)
 */
export function getUsuarioColumnsFull(): string {
  return `
    id,
    auth_user_id,
    nome_completo,
    nome_exibicao,
    cpf,
    rg,
    data_nascimento,
    genero,
    oab,
    uf_oab,
    email_pessoal,
    email_corporativo,
    telefone,
    ramal,
    endereco,
    cargo_id,
    avatar_url,
    cover_url,
    is_super_admin,
    ativo,
    created_at,
    updated_at
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas de usuário com join de cargo
 * Usado em: findById, findAll com detalhes
 */
export function getUsuarioColumnsWithCargo(): string {
  return `
    ${getUsuarioColumnsFull()},
    cargos!cargo_id(id, nome, descricao, ativo)
  `.trim().replace(/\s+/g, ' ');
}

// =============================================================================
// RE-EXPORTS — Permissões (consolidado de types/)
// =============================================================================
export type {
  Recurso,
  Operacao,
  Permissao as PermissaoGranular,
  AtribuirPermissaoDTO,
  AtribuirPermissoesDTO,
  PermissoesUsuarioResponse,
  RecursoOperacoes,
} from './types/types';

export {
  MATRIZ_PERMISSOES,
  obterMatrizPermissoes,
  obterTotalPermissoes,
  isRecursoValido,
  isOperacaoValida,
  isPermissaoValida,
  obterTodasPermissoes,
  validarAtribuirPermissaoDTO,
  validarAtribuirPermissoesDTO,
} from './types/types';
