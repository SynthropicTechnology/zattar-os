/**
 * Partes > Entity Card Adapter
 *
 * Mapeia cada entidade do módulo Partes para a interface unificada
 * EntityCardData, usada pelos componentes Glass UI do dashboard.
 *
 * USO:
 *   const card = clienteToEntityCard(cliente);
 *   const card = parteContrariaToEntityCard(parte);
 *   const card = terceiroToEntityCard(terceiro);
 *   const card = representanteToEntityCard(representante);
 */

import { Users, Scale, User, Briefcase } from 'lucide-react';
import type { EntityCardConfig, EntityCardData } from '@/components/dashboard/entity-card';
import type { Cliente, ParteContraria, Terceiro, ProcessoRelacionado } from '../domain';
import type { Representante } from '../types/representantes';

// Status que indicam processo ativo (não arquivado/extinto)
const STATUS_ATIVO = new Set(['A', 'ATIVO', 'ativo', null, undefined]);

// =============================================================================
// ENTITY CONFIGS
// =============================================================================

export const ENTITY_CONFIGS: Record<string, EntityCardConfig> = {
  cliente: {
    label: 'Cliente',
    icon: Users,
    color: 'text-primary/70',
    bg: 'bg-primary/8',
  },
  parteContraria: {
    label: 'Parte Contrária',
    icon: Scale,
    color: 'text-warning/70',
    bg: 'bg-warning/8',
  },
  terceiro: {
    label: 'Terceiro',
    icon: User,
    color: 'text-info/70',
    bg: 'bg-info/8',
  },
  representante: {
    label: 'Representante',
    icon: Briefcase,
    color: 'text-success/70',
    bg: 'bg-success/8',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Mascara CPF: oculta os 6 digitos centrais, ex: 123.***.***-45
 * Para CNPJ mostra apenas os 4 ultimos digitos.
 */
export function maskDocument(doc: string | null | undefined): string {
  if (!doc) return '--';
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) {
    // CPF: 000.***.***-00 -> mostra primeiros 3 e últimos 2
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    // CNPJ: **.***.***/**** -> mostra últimos 4
    return `**.**.***/****-${digits.slice(12)}`;
  }
  // Documento desconhecido: mostra os últimos 4
  return `****${digits.slice(-4)}`;
}

/**
 * Extrai o primeiro email de um campo que pode ser string[] (JSONB), string ou null.
 */
export function extractFirstEmail(emails: string[] | string | null | undefined): string | undefined {
  if (!emails) return undefined;
  if (Array.isArray(emails)) {
    return emails[0] || undefined;
  }
  if (typeof emails === 'string') {
    // Tenta parse de JSON array armazenado como string
    try {
      const parsed = JSON.parse(emails) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return String(parsed[0]);
      }
    } catch {
      // não é JSON: trata como email direto
    }
    return emails || undefined;
  }
  return undefined;
}

/**
 * Formata DDD + número como "(DD) NNNNN-NNNN" ou "(DD) NNNN-NNNN".
 */
export function formatPhone(
  ddd: string | null | undefined,
  numero: string | null | undefined
): string | undefined {
  const d = ddd?.replace(/\D/g, '') ?? '';
  const n = numero?.replace(/\D/g, '') ?? '';
  if (!d && !n) return undefined;
  if (!d) return n || undefined;
  if (!n) return `(${d})`;

  if (n.length === 9) {
    return `(${d}) ${n.slice(0, 5)}-${n.slice(5)}`;
  }
  if (n.length === 8) {
    return `(${d}) ${n.slice(0, 4)}-${n.slice(4)}`;
  }
  return `(${d}) ${n}`;
}

/**
 * Formata localização como "Cidade, UF" a partir do objeto endereco (join).
 * Retorna "--" quando nao disponivel.
 */
export function formatLocation(endereco: {
  municipio?: string | null;
  estado_sigla?: string | null;
} | null | undefined): string {
  const cidade = endereco?.municipio?.trim();
  const uf = endereco?.estado_sigla?.trim();
  if (cidade && uf) return `${cidade}, ${uf}`;
  if (cidade) return cidade;
  if (uf) return uf;
  return '--';
}

// =============================================================================
// HELPERS INTERNOS
// =============================================================================

/** Conta processos ativos e total a partir de processos_relacionados */
function contarProcessos(processos?: ProcessoRelacionado[]): { ativos: number; total: number } {
  if (!processos || processos.length === 0) return { ativos: 0, total: 0 };
  const ativos = processos.filter(p => STATUS_ATIVO.has(p.codigo_status_processo ?? undefined)).length;
  return { ativos, total: processos.length };
}

/** Tipo genérico para entidades com endereco e processos opcionais */
type WithEnderecoEProcessos = {
  endereco?: { municipio?: string | null; estado_sigla?: string | null } | null;
  processos_relacionados?: ProcessoRelacionado[];
};

// =============================================================================
// ENTITY MAPPERS
// =============================================================================

/**
 * Mapeia um Cliente para EntityCardData.
 * Quando chamado com dados de findAllClientesComEnderecoEProcessos,
 * preenche localização e métricas automaticamente.
 */
export function clienteToEntityCard(
  cliente: Cliente & WithEnderecoEProcessos
): EntityCardData {
  const doc =
    cliente.tipo_pessoa === 'pf'
      ? (cliente as { cpf?: string }).cpf
      : (cliente as { cnpj?: string }).cnpj;

  const { ativos, total } = contarProcessos(cliente.processos_relacionados);

  return {
    id: cliente.id,
    nome: cliente.nome,
    nomeSocial: cliente.nome_social_fantasia ?? undefined,
    tipo: cliente.tipo_pessoa,
    config: ENTITY_CONFIGS.cliente,
    documentoMasked: maskDocument(doc),
    email: extractFirstEmail(cliente.emails),
    telefone: formatPhone(cliente.ddd_celular, cliente.numero_celular),
    localizacao: formatLocation(cliente.endereco),
    ativo: cliente.ativo !== false,
    metricas: { label: 'processos', ativos, total },
    ultimaAtualizacao: cliente.updated_at || cliente.created_at || '',
    tags: [],
  };
}

/**
 * Mapeia uma ParteContraria para EntityCardData.
 */
export function parteContrariaToEntityCard(
  parte: ParteContraria & WithEnderecoEProcessos
): EntityCardData {
  const doc =
    parte.tipo_pessoa === 'pf'
      ? (parte as { cpf?: string }).cpf
      : (parte as { cnpj?: string }).cnpj;

  const { ativos, total } = contarProcessos(parte.processos_relacionados);

  return {
    id: parte.id,
    nome: parte.nome,
    nomeSocial: parte.nome_social_fantasia ?? undefined,
    tipo: parte.tipo_pessoa,
    config: ENTITY_CONFIGS.parteContraria,
    documentoMasked: maskDocument(doc),
    email: extractFirstEmail(parte.emails),
    telefone: formatPhone(parte.ddd_celular, parte.numero_celular),
    localizacao: formatLocation(parte.endereco),
    ativo: parte.ativo !== false,
    metricas: { label: 'processos', ativos, total },
    ultimaAtualizacao: parte.updated_at || parte.created_at || '',
    tags: [],
  };
}

/**
 * Mapeia um Terceiro para EntityCardData.
 */
export function terceiroToEntityCard(
  terceiro: Terceiro & WithEnderecoEProcessos
): EntityCardData {
  const doc =
    terceiro.tipo_pessoa === 'pf'
      ? (terceiro as { cpf?: string }).cpf
      : (terceiro as { cnpj?: string }).cnpj;

  const nomeSocial =
    terceiro.tipo_pessoa === 'pj'
      ? (terceiro as { nome_fantasia?: string | null }).nome_fantasia ?? undefined
      : undefined;

  const { ativos, total } = contarProcessos(terceiro.processos_relacionados);

  return {
    id: terceiro.id,
    nome: terceiro.nome,
    nomeSocial,
    tipo: terceiro.tipo_pessoa,
    config: ENTITY_CONFIGS.terceiro,
    documentoMasked: maskDocument(doc),
    email: extractFirstEmail(terceiro.emails),
    telefone: formatPhone(terceiro.ddd_celular, terceiro.numero_celular),
    localizacao: formatLocation(terceiro.endereco),
    ativo: terceiro.ativo !== false,
    metricas: { label: 'processos', ativos, total },
    ultimaAtualizacao: terceiro.updated_at || terceiro.created_at || '',
    tags: terceiro.tipo_parte ? [terceiro.tipo_parte] : [],
  };
}

/**
 * Mapeia um Representante para EntityCardData.
 * Representantes são sempre PF (CPF).
 */
export function representanteToEntityCard(
  representante: Representante & WithEnderecoEProcessos
): EntityCardData {
  const oabLabel =
    representante.oabs && representante.oabs.length > 0
      ? `OAB/${representante.oabs[0].uf} ${representante.oabs[0].numero}`
      : undefined;

  return {
    id: representante.id,
    nome: representante.nome,
    tipo: 'pf',
    config: ENTITY_CONFIGS.representante,
    documentoMasked: maskDocument(representante.cpf),
    email: extractFirstEmail(representante.emails ?? representante.email),
    telefone: formatPhone(representante.ddd_celular, representante.numero_celular),
    localizacao: formatLocation(representante.endereco),
    ativo: true,
    metricas: { label: 'processos', ...contarProcessos(representante.processos_relacionados) },
    ultimaAtualizacao: representante.updated_at || representante.created_at || '',
    tags: oabLabel ? [oabLabel] : [],
  };
}
