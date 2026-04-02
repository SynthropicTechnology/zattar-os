/**
 * Resolver de Placeholders para Peças Jurídicas
 *
 * Este módulo é responsável por substituir os placeholders
 * no conteúdo do documento pelos valores reais do contrato.
 */

import type { Cliente, ParteContraria } from '@/app/app/partes';
import type { Endereco } from '@/app/app/enderecos/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ParteProcessual {
  id: number;
  tipoEntidade: 'cliente' | 'parte_contraria';
  papelContratual: 'autora' | 're';
  ordem: number;
  dados: Cliente | ParteContraria;
  endereco?: Endereco | null;
}

export interface DadosContrato {
  id: number;
  areaDireito?: string;
  tipo?: string;
  dataCadastro?: string;
}

export interface DadosAdvogado {
  nome: string;
  oab: string;
}

export interface PlaceholderContext {
  autores: ParteProcessual[];
  reus: ParteProcessual[];
  contrato?: DadosContrato;
  advogado?: DadosAdvogado;
}

export interface PlaceholderResolution {
  placeholder: string;
  value: string | null;
  resolved: boolean;
}

// =============================================================================
// FORMATTERS
// =============================================================================

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '';
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return date;
  }
}

function formatDateExtensible(date: Date): string {
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

function formatEnderecoCompleto(endereco: Endereco | null | undefined): string {
  if (!endereco) return '';

  const parts: string[] = [];

  if (endereco.logradouro) {
    let addr = endereco.logradouro;
    if (endereco.numero) addr += `, ${endereco.numero}`;
    if (endereco.complemento) addr += `, ${endereco.complemento}`;
    parts.push(addr);
  }

  if (endereco.bairro) parts.push(endereco.bairro);

  if (endereco.municipio || endereco.estado_sigla) {
    const cityState = [endereco.municipio, endereco.estado_sigla].filter(Boolean).join('/');
    parts.push(cityState);
  }

  if (endereco.cep) {
    parts.push(`CEP ${formatCEP(endereco.cep)}`);
  }

  return parts.join(', ');
}

// =============================================================================
// QUALIFICAÇÃO COMPLETA
// =============================================================================

function getGeneroTermos(genero: string | null | undefined): {
  inscrito: string;
  portador: string;
  domiciliado: string;
} {
  // Padrão é masculino se não especificado
  if (genero === 'F' || genero === 'feminino') {
    return {
      inscrito: 'inscrita',
      portador: 'portadora',
      domiciliado: 'domiciliada',
    };
  }
  return {
    inscrito: 'inscrito',
    portador: 'portador',
    domiciliado: 'domiciliado',
  };
}

function formatQualificacaoCompletaPF(
  parte: Cliente | ParteContraria,
  endereco: Endereco | null | undefined
): string {
  if (parte.tipo_pessoa !== 'pf') return '';

  const termos = getGeneroTermos(parte.genero);
  const parts: string[] = [];

  // Nome em destaque (maiúsculas)
  parts.push(`**${parte.nome.toUpperCase()}**`);

  // Nacionalidade
  if (parte.nacionalidade) {
    parts.push(parte.nacionalidade.toLowerCase());
  }

  // Estado civil
  if (parte.estado_civil) {
    parts.push(parte.estado_civil.toLowerCase());
  }

  // Profissão - campo pode variar dependendo da entidade
  // @ts-expect-error - profissão pode existir em algumas entidades
  if (parte.profissao) {
    // @ts-expect-error - profissão pode existir
    parts.push(parte.profissao.toLowerCase());
  }

  // CPF
  if (parte.cpf) {
    parts.push(`${termos.inscrito} no CPF sob nº ${formatCPF(parte.cpf)}`);
  }

  // RG
  if (parte.rg) {
    parts.push(`${termos.portador} do RG nº ${parte.rg}`);
  }

  // Endereço
  if (endereco) {
    const endCompleto = formatEnderecoCompleto(endereco);
    if (endCompleto) {
      parts.push(`residente e ${termos.domiciliado} na ${endCompleto}`);
    }
  }

  return parts.join(', ');
}

function formatQualificacaoCompletaPJ(
  parte: Cliente | ParteContraria,
  endereco: Endereco | null | undefined
): string {
  if (parte.tipo_pessoa !== 'pj') return '';

  const parts: string[] = [];

  // Nome/Razão social em destaque
  parts.push(`**${parte.nome.toUpperCase()}**`);

  // Tipo de pessoa jurídica
  parts.push('pessoa jurídica de direito privado');

  // CNPJ
  if (parte.cnpj) {
    parts.push(`inscrita no CNPJ sob nº ${formatCNPJ(parte.cnpj)}`);
  }

  // Sede
  if (endereco) {
    const endCompleto = formatEnderecoCompleto(endereco);
    if (endCompleto) {
      parts.push(`com sede na ${endCompleto}`);
    }
  }

  return parts.join(', ');
}

function formatQualificacaoCompleta(
  parte: Cliente | ParteContraria,
  endereco: Endereco | null | undefined
): string {
  if (parte.tipo_pessoa === 'pf') {
    return formatQualificacaoCompletaPF(parte, endereco);
  }
  return formatQualificacaoCompletaPJ(parte, endereco);
}

// =============================================================================
// VALUE RESOLVER
// =============================================================================

function resolveParteValue(
  parte: ParteProcessual,
  campo: string
): string | null {
  const { dados, endereco } = parte;

  switch (campo) {
    // Básicos
    case 'nome':
      return dados.nome;
    case 'qualificacao_completa':
      return formatQualificacaoCompleta(dados, endereco);

    // PF
    case 'cpf':
      return dados.tipo_pessoa === 'pf' ? dados.cpf : null;
    case 'cpf_formatado':
      return dados.tipo_pessoa === 'pf' ? formatCPF(dados.cpf) : null;
    case 'rg':
      return dados.tipo_pessoa === 'pf' ? dados.rg : null;
    case 'nacionalidade':
      return dados.tipo_pessoa === 'pf' ? dados.nacionalidade : null;
    case 'estado_civil':
      return dados.tipo_pessoa === 'pf' ? dados.estado_civil : null;
    case 'profissao':
      // @ts-expect-error - profissão pode não existir em todas entidades
      return dados.tipo_pessoa === 'pf' ? dados.profissao : null;
    case 'data_nascimento':
      return dados.tipo_pessoa === 'pf' ? formatDate(dados.data_nascimento) : null;
    case 'nome_mae':
      return dados.tipo_pessoa === 'pf' ? dados.nome_genitora : null;

    // PJ
    case 'razao_social':
      return dados.tipo_pessoa === 'pj' ? dados.nome : null;
    case 'nome_fantasia':
      return dados.tipo_pessoa === 'pj' ? dados.nome_social_fantasia : null;
    case 'cnpj':
      return dados.tipo_pessoa === 'pj' ? dados.cnpj : null;
    case 'cnpj_formatado':
      return dados.tipo_pessoa === 'pj' ? formatCNPJ(dados.cnpj) : null;
    case 'inscricao_estadual':
      return dados.tipo_pessoa === 'pj' ? dados.inscricao_estadual : null;

    // Endereço
    case 'endereco_completo':
      return formatEnderecoCompleto(endereco);
    case 'logradouro':
      return endereco?.logradouro || null;
    case 'numero':
      return endereco?.numero || null;
    case 'complemento':
      return endereco?.complemento || null;
    case 'bairro':
      return endereco?.bairro || null;
    case 'cidade':
      return endereco?.municipio || null;
    case 'estado':
      return endereco?.estado_sigla || null;
    case 'cep_formatado':
      return endereco?.cep ? formatCEP(endereco.cep) : null;

    default:
      return null;
  }
}

function resolveMetaValue(campo: string, context: PlaceholderContext): string | null {
  const now = new Date();

  switch (campo) {
    case 'data_atual':
      return now.toLocaleDateString('pt-BR');
    case 'data_atual_extenso':
      return formatDateExtensible(now);
    case 'advogado_responsavel':
      return context.advogado?.nome || null;
    case 'oab_advogado':
      return context.advogado?.oab || null;
    default:
      return null;
  }
}

function resolveContratoValue(campo: string, context: PlaceholderContext): string | null {
  const { contrato } = context;
  if (!contrato) return null;

  switch (campo) {
    case 'area_direito':
      return contrato.areaDireito || null;
    case 'tipo':
      return contrato.tipo || null;
    case 'data_cadastro':
      return contrato.dataCadastro ? formatDate(contrato.dataCadastro) : null;
    default:
      return null;
  }
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Resolve um único placeholder para seu valor
 */
export function resolvePlaceholder(
  placeholder: string,
  context: PlaceholderContext
): PlaceholderResolution {
  // Remove {{ e }}
  const key = placeholder.replace(/^\{\{|\}\}$/g, '');

  // Parse do placeholder
  const indexedMatch = key.match(/^(autor|reu)_(\d+)\.(.+)$/);
  if (indexedMatch) {
    const [, tipo, indexStr, campo] = indexedMatch;
    const index = parseInt(indexStr, 10) - 1; // Converter para 0-based

    const partes = tipo === 'autor' ? context.autores : context.reus;
    const parte = partes[index];

    if (!parte) {
      return { placeholder, value: null, resolved: false };
    }

    const value = resolveParteValue(parte, campo);
    return { placeholder, value, resolved: value !== null };
  }

  // Meta placeholders
  if (key.startsWith('meta.')) {
    const campo = key.replace('meta.', '');
    const value = resolveMetaValue(campo, context);
    return { placeholder, value, resolved: value !== null };
  }

  // Contrato placeholders
  if (key.startsWith('contrato.')) {
    const campo = key.replace('contrato.', '');
    const value = resolveContratoValue(campo, context);
    return { placeholder, value, resolved: value !== null };
  }

  return { placeholder, value: null, resolved: false };
}

/**
 * Resolve todos os placeholders em um texto
 */
export function resolveAllPlaceholders(
  text: string,
  context: PlaceholderContext
): {
  result: string;
  resolutions: PlaceholderResolution[];
  unresolvedCount: number;
} {
  const regex = /\{\{([a-z_]+_\d+\.[a-z_]+|meta\.[a-z_]+|contrato\.[a-z_]+)\}\}/gi;
  const resolutions: PlaceholderResolution[] = [];

  const result = text.replace(regex, (match) => {
    const resolution = resolvePlaceholder(match, context);
    resolutions.push(resolution);
    return resolution.resolved ? (resolution.value || '') : match;
  });

  const unresolvedCount = resolutions.filter((r) => !r.resolved).length;

  return { result, resolutions, unresolvedCount };
}

/**
 * Resolve placeholders em conteúdo Plate.js (recursivo em nodes)
 */
export function resolvePlateContent(
  content: unknown[],
  context: PlaceholderContext
): {
  result: unknown[];
  resolutions: PlaceholderResolution[];
  unresolvedCount: number;
} {
  const allResolutions: PlaceholderResolution[] = [];

  function processNode(node: unknown): unknown {
    if (typeof node !== 'object' || node === null) {
      return node;
    }

    const obj = node as Record<string, unknown>;

    // Se o node tem texto, processar
    if (typeof obj.text === 'string') {
      const { result, resolutions } = resolveAllPlaceholders(obj.text, context);
      allResolutions.push(...resolutions);
      return { ...obj, text: result };
    }

    // Se tem children, processar recursivamente
    if (Array.isArray(obj.children)) {
      return {
        ...obj,
        children: obj.children.map(processNode),
      };
    }

    return node;
  }

  const result = content.map(processNode) as unknown[];
  const unresolvedCount = allResolutions.filter((r) => !r.resolved).length;

  return { result, resolutions: allResolutions, unresolvedCount };
}

/**
 * Gera preview dos dados que serão substituídos
 */
export function generatePreview(
  placeholders: string[],
  context: PlaceholderContext
): PlaceholderResolution[] {
  return placeholders.map((p) => resolvePlaceholder(`{{${p}}}`, context));
}
