/**
 * Definições de Placeholders para Peças Jurídicas
 *
 * Formato: {{entidade_N.campo}}
 * - entidade: autor | reu | meta | contrato
 * - N: índice numérico (1, 2, 3...) para múltiplas partes
 * - campo: nome do campo a ser substituído
 */

export interface PlaceholderDefinition {
  key: string;
  label: string;
  description: string;
  example: string;
  category: PlaceholderCategory;
  /** Indica se o placeholder suporta índice (ex: autor_1, autor_2) */
  indexed: boolean;
  /** Indica se é para PF, PJ ou ambos */
  tipoPessoa?: 'pf' | 'pj' | 'ambos';
}

export type PlaceholderCategory = 'autor' | 'reu' | 'meta' | 'contrato';

export const PLACEHOLDER_CATEGORIES: Record<PlaceholderCategory, string> = {
  autor: 'Autor (Cliente)',
  reu: 'Réu (Parte Contrária)',
  meta: 'Metadados',
  contrato: 'Contrato',
};

// =============================================================================
// PLACEHOLDERS - AUTOR (Cliente)
// =============================================================================

export const PLACEHOLDERS_AUTOR: PlaceholderDefinition[] = [
  // Dados básicos
  {
    key: 'autor_N.nome',
    label: 'Nome do Autor',
    description: 'Nome completo do autor/cliente',
    example: 'João da Silva',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.qualificacao_completa',
    label: 'Qualificação Completa',
    description:
      'Qualificação jurídica completa formatada (nome, nacionalidade, estado civil, profissão, CPF/CNPJ, RG, endereço)',
    example:
      'JOÃO DA SILVA, brasileiro, solteiro, operador de máquinas, inscrito no CPF sob nº 123.456.789-01, portador do RG nº 12.345.678-9, residente e domiciliado na Rua das Flores, 123, Centro, São Paulo/SP, CEP 01234-567',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },

  // Pessoa Física
  {
    key: 'autor_N.cpf',
    label: 'CPF',
    description: 'CPF sem formatação',
    example: '12345678901',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },
  {
    key: 'autor_N.cpf_formatado',
    label: 'CPF Formatado',
    description: 'CPF com formatação XXX.XXX.XXX-XX',
    example: '123.456.789-01',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },
  {
    key: 'autor_N.rg',
    label: 'RG',
    description: 'Número do RG',
    example: '12.345.678-9',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },
  {
    key: 'autor_N.nacionalidade',
    label: 'Nacionalidade',
    description: 'Nacionalidade do autor',
    example: 'brasileiro',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },
  {
    key: 'autor_N.estado_civil',
    label: 'Estado Civil',
    description: 'Estado civil do autor',
    example: 'solteiro',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },
  {
    key: 'autor_N.profissao',
    label: 'Profissão',
    description: 'Profissão do autor',
    example: 'operador de máquinas',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },
  {
    key: 'autor_N.data_nascimento',
    label: 'Data de Nascimento',
    description: 'Data de nascimento no formato DD/MM/YYYY',
    example: '15/03/1985',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },
  {
    key: 'autor_N.nome_mae',
    label: 'Nome da Mãe',
    description: 'Nome da genitora',
    example: 'Maria da Silva',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pf',
  },

  // Pessoa Jurídica
  {
    key: 'autor_N.razao_social',
    label: 'Razão Social',
    description: 'Razão social da empresa',
    example: 'Empresa XYZ Ltda',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pj',
  },
  {
    key: 'autor_N.nome_fantasia',
    label: 'Nome Fantasia',
    description: 'Nome fantasia da empresa',
    example: 'XYZ Comércio',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pj',
  },
  {
    key: 'autor_N.cnpj',
    label: 'CNPJ',
    description: 'CNPJ sem formatação',
    example: '12345678000195',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pj',
  },
  {
    key: 'autor_N.cnpj_formatado',
    label: 'CNPJ Formatado',
    description: 'CNPJ com formatação XX.XXX.XXX/XXXX-XX',
    example: '12.345.678/0001-95',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pj',
  },
  {
    key: 'autor_N.inscricao_estadual',
    label: 'Inscrição Estadual',
    description: 'Inscrição estadual da empresa',
    example: '123.456.789.012',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'pj',
  },

  // Endereço
  {
    key: 'autor_N.endereco_completo',
    label: 'Endereço Completo',
    description: 'Endereço formatado completo',
    example: 'Rua das Flores, 123, Apto 45, Centro, São Paulo/SP, CEP 01234-567',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.logradouro',
    label: 'Logradouro',
    description: 'Rua/Avenida',
    example: 'Rua das Flores',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.numero',
    label: 'Número',
    description: 'Número do endereço',
    example: '123',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.complemento',
    label: 'Complemento',
    description: 'Complemento do endereço',
    example: 'Apto 45',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.bairro',
    label: 'Bairro',
    description: 'Bairro',
    example: 'Centro',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.cidade',
    label: 'Cidade',
    description: 'Cidade/Município',
    example: 'São Paulo',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.estado',
    label: 'Estado',
    description: 'UF do estado',
    example: 'SP',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
  {
    key: 'autor_N.cep_formatado',
    label: 'CEP Formatado',
    description: 'CEP com formatação XXXXX-XXX',
    example: '01234-567',
    category: 'autor',
    indexed: true,
    tipoPessoa: 'ambos',
  },
];

// =============================================================================
// PLACEHOLDERS - RÉU (Parte Contrária)
// =============================================================================

export const PLACEHOLDERS_REU: PlaceholderDefinition[] = PLACEHOLDERS_AUTOR.map((p) => ({
  ...p,
  key: p.key.replace('autor_N', 'reu_N'),
  label: p.label.replace('Autor', 'Réu'),
  description: p.description.replace('autor', 'réu').replace('cliente', 'parte contrária'),
  category: 'reu' as PlaceholderCategory,
}));

// =============================================================================
// PLACEHOLDERS - META
// =============================================================================

export const PLACEHOLDERS_META: PlaceholderDefinition[] = [
  {
    key: 'meta.data_atual',
    label: 'Data Atual',
    description: 'Data atual no formato DD/MM/YYYY',
    example: '12/01/2026',
    category: 'meta',
    indexed: false,
  },
  {
    key: 'meta.data_atual_extenso',
    label: 'Data Atual por Extenso',
    description: 'Data atual por extenso',
    example: '12 de janeiro de 2026',
    category: 'meta',
    indexed: false,
  },
  {
    key: 'meta.advogado_responsavel',
    label: 'Advogado Responsável',
    description: 'Nome do advogado responsável pelo contrato',
    example: 'Dr. José da Silva',
    category: 'meta',
    indexed: false,
  },
  {
    key: 'meta.oab_advogado',
    label: 'OAB do Advogado',
    description: 'Número da OAB do advogado responsável',
    example: 'OAB/SP 123.456',
    category: 'meta',
    indexed: false,
  },
];

// =============================================================================
// PLACEHOLDERS - CONTRATO
// =============================================================================

export const PLACEHOLDERS_CONTRATO: PlaceholderDefinition[] = [
  {
    key: 'contrato.area_direito',
    label: 'Área do Direito',
    description: 'Área do direito do contrato',
    example: 'Trabalhista',
    category: 'contrato',
    indexed: false,
  },
  {
    key: 'contrato.tipo',
    label: 'Tipo de Contrato',
    description: 'Tipo do contrato',
    example: 'Ajuizamento',
    category: 'contrato',
    indexed: false,
  },
  {
    key: 'contrato.data_cadastro',
    label: 'Data de Cadastro',
    description: 'Data de cadastro do contrato',
    example: '01/12/2025',
    category: 'contrato',
    indexed: false,
  },
];

// =============================================================================
// ALL PLACEHOLDERS
// =============================================================================

export const ALL_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...PLACEHOLDERS_AUTOR,
  ...PLACEHOLDERS_REU,
  ...PLACEHOLDERS_META,
  ...PLACEHOLDERS_CONTRATO,
];

/**
 * Retorna placeholders com índice específico
 * Ex: getIndexedPlaceholders(1) retorna autor_1.nome, reu_1.nome, etc.
 */
export function getIndexedPlaceholders(index: number): PlaceholderDefinition[] {
  return ALL_PLACEHOLDERS.map((p) => ({
    ...p,
    key: p.key.replace('_N.', `_${index}.`),
    label: p.label + (p.indexed ? ` ${index}` : ''),
  }));
}

/**
 * Retorna todos os placeholders com índices de 1 até maxIndex
 */
export function getAllIndexedPlaceholders(maxIndex: number = 5): PlaceholderDefinition[] {
  const result: PlaceholderDefinition[] = [];

  for (let i = 1; i <= maxIndex; i++) {
    const indexed = ALL_PLACEHOLDERS.filter((p) => p.indexed).map((p) => ({
      ...p,
      key: p.key.replace('_N.', `_${i}.`),
      label: p.label + ` ${i}`,
    }));
    result.push(...indexed);
  }

  // Adicionar placeholders não indexados
  result.push(...ALL_PLACEHOLDERS.filter((p) => !p.indexed));

  return result;
}

/**
 * Agrupa placeholders por categoria
 */
export function groupPlaceholdersByCategory(
  placeholders: PlaceholderDefinition[]
): Record<PlaceholderCategory, PlaceholderDefinition[]> {
  return placeholders.reduce(
    (acc, p) => {
      if (!acc[p.category]) {
        acc[p.category] = [];
      }
      acc[p.category].push(p);
      return acc;
    },
    {} as Record<PlaceholderCategory, PlaceholderDefinition[]>
  );
}

/**
 * Extrai placeholders usados em um texto
 * Retorna array de strings no formato {{entidade_N.campo}}
 */
export function extractPlaceholders(text: string): string[] {
  const regex = /\{\{([a-z_]+_\d+\.[a-z_]+|meta\.[a-z_]+|contrato\.[a-z_]+)\}\}/gi;
  const matches = text.match(regex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Valida se um placeholder é válido
 */
export function isValidPlaceholder(placeholder: string): boolean {
  // Remove {{ e }}
  const key = placeholder.replace(/^\{\{|\}\}$/g, '');

  // Verifica se é um placeholder indexado válido
  const indexedPattern = /^(autor|reu)_\d+\.[a-z_]+$/;
  if (indexedPattern.test(key)) {
    const baseKey = key.replace(/_\d+\./, '_N.');
    return ALL_PLACEHOLDERS.some((p) => p.key === baseKey);
  }

  // Verifica se é um placeholder não indexado válido
  return ALL_PLACEHOLDERS.some((p) => p.key === key);
}
