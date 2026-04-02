import { Cliente, ParteContraria, Terceiro } from '../types';

// Cliente Fixtures
export function criarClientePFMock(overrides?: Partial<Cliente>): Cliente {
  return {
    id: 1,
    tipoPessoa: 'PF',
    nomeCompleto: 'João Silva Santos',
    cpf: '123.456.789-00',
    cnpj: null,
    razaoSocial: null,
    nomeFantasia: null,
    rg: '12.345.678-9',
    email: 'joao.silva@example.com',
    telefone: '(11) 98765-4321',
    dataNascimento: '1980-05-15',
    estadoCivil: 'casado',
    profissao: 'Engenheiro',
    nacionalidade: 'brasileiro',
    observacoes: null,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarClientePJMock(overrides?: Partial<Cliente>): Cliente {
  return {
    id: 2,
    tipoPessoa: 'PJ',
    nomeCompleto: null,
    cpf: null,
    cnpj: '12.345.678/0001-00',
    razaoSocial: 'Empresa XYZ Ltda',
    nomeFantasia: 'XYZ Soluções',
    rg: null,
    email: 'contato@empresaxyz.com.br',
    telefone: '(11) 3456-7890',
    dataNascimento: null,
    estadoCivil: null,
    profissao: null,
    nacionalidade: null,
    observacoes: 'Cliente corporativo',
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarClienteDbMock(overrides?: Record<string, any>): Record<string, any> {
  return {
    id: 1,
    tipo_pessoa: 'PF',
    nome_completo: 'João Silva Santos',
    cpf: '123.456.789-00',
    cnpj: null,
    razao_social: null,
    nome_fantasia: null,
    rg: '12.345.678-9',
    email: 'joao.silva@example.com',
    telefone: '(11) 98765-4321',
    data_nascimento: '1980-05-15',
    estado_civil: 'casado',
    profissao: 'Engenheiro',
    nacionalidade: 'brasileiro',
    observacoes: null,
    ativo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Parte Contrária Fixtures
export function criarParteContrariaPFMock(overrides?: Partial<ParteContraria>): ParteContraria {
  return {
    id: 1,
    tipoPessoa: 'PF',
    nomeCompleto: 'Maria Oliveira',
    cpf: '987.654.321-00',
    cnpj: null,
    razaoSocial: null,
    nomeFantasia: null,
    email: 'maria.oliveira@example.com',
    telefone: '(21) 98765-1234',
    observacoes: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarParteContrariaPJMock(overrides?: Partial<ParteContraria>): ParteContraria {
  return {
    id: 2,
    tipoPessoa: 'PJ',
    nomeCompleto: null,
    cpf: null,
    cnpj: '98.765.432/0001-00',
    razaoSocial: 'Empresa ABC S/A',
    nomeFantasia: 'ABC Corp',
    email: 'juridico@empresaabc.com.br',
    telefone: '(11) 3333-4444',
    observacoes: 'Grande empresa',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarParteContrariaDbMock(
  overrides?: Record<string, any>
): Record<string, any> {
  return {
    id: 1,
    tipo_pessoa: 'PF',
    nome_completo: 'Maria Oliveira',
    cpf: '987.654.321-00',
    cnpj: null,
    razao_social: null,
    nome_fantasia: null,
    email: 'maria.oliveira@example.com',
    telefone: '(21) 98765-1234',
    observacoes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Terceiro Fixtures
export function criarTerceiroPFMock(overrides?: Partial<Terceiro>): Terceiro {
  return {
    id: 1,
    tipoPessoa: 'PF',
    nomeCompleto: 'Pedro Costa',
    cpf: '111.222.333-44',
    cnpj: null,
    razaoSocial: null,
    nomeFantasia: null,
    email: null,
    telefone: null,
    observacoes: 'Testemunha',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarTerceiroPJMock(overrides?: Partial<Terceiro>): Terceiro {
  return {
    id: 2,
    tipoPessoa: 'PJ',
    nomeCompleto: null,
    cpf: null,
    cnpj: '22.333.444/0001-55',
    razaoSocial: 'Escritório de Advocacia Silva & Santos',
    nomeFantasia: 'Silva & Santos Advogados',
    email: 'contato@silvaesantos.adv.br',
    telefone: '(11) 2222-3333',
    observacoes: 'Advogado da parte contrária',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarTerceiroDbMock(overrides?: Record<string, any>): Record<string, any> {
  return {
    id: 1,
    tipo_pessoa: 'PF',
    nome_completo: 'Pedro Costa',
    cpf: '111.222.333-44',
    cnpj: null,
    razao_social: null,
    nome_fantasia: null,
    email: null,
    telefone: null,
    observacoes: 'Testemunha',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Endereço Fixtures
export function criarEnderecoDbMock(overrides?: Record<string, any>): Record<string, any> {
  return {
    id: 1,
    entidade_tipo: 'cliente',
    entidade_id: 1,
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '1578',
    complemento: 'Conjunto 101',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    pais: 'Brasil',
    principal: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Processo Partes Fixtures
export function criarProcessoPartesDbMock(
  overrides?: Record<string, any>
): Record<string, any> {
  return {
    id: 1,
    processo_id: 100,
    entidade_tipo: 'cliente',
    entidade_id: 1,
    tipo_participacao: 'autor',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Legacy mocks for backward compatibility
export const criarClienteMock = (overrides = {}) => ({
  id: 1,
  nome: 'Cliente Teste',
  tipo_pessoa: 'pf' as const,
  cpf: '12345678900',
  cnpj: null,
  emails: ['cliente@example.com'],
  ddd_celular: '11',
  numero_celular: '987654321',
  ativo: true,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarVinculoProcessoParteMock = (overrides = {}) => ({
  id: 1,
  processo_id: 100,
  tipo_entidade: 'cliente' as const,
  entidade_id: 1,
  id_pje: 12345,
  id_pessoa_pje: 67890,
  tipo_parte: 'RECLAMANTE' as const,
  polo: 'ATIVO' as const,
  trt: 'TRT02',
  grau: '1',
  numero_processo: '0001234-56.2023.5.02.0001',
  principal: true,
  ordem: 1,
  dados_pje_completo: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarParteContrariaMock = (overrides = {}) => ({
  id: 1,
  nome: 'Parte Contrária Teste',
  tipo_pessoa: 'pj' as const,
  cpf: null,
  cnpj: '12345678000190',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarRepresentanteMock = (overrides = {}) => ({
  id: 1,
  nome: 'Advogado Teste',
  tipo: 'ADVOGADO' as const,
  oabs: [
    {
      numero: '123456',
      uf: 'SP',
      principal: true,
    },
  ],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarTerceiroMock = (overrides = {}) => ({
  id: 1,
  nome: 'Terceiro Teste',
  tipo_pessoa: 'pf' as const,
  cpf: '98765432100',
  cnpj: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
