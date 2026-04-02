import type {
  Arquivo,
  ArquivoComUsuario,
  Pasta,
  PastaComContadores,
  DocumentoCompartilhado,
  DocumentoCompartilhadoComUsuario,
} from '../domain';

export function criarArquivoMock(overrides?: Partial<Arquivo>): Arquivo {
  return {
    id: 1,
    nome: 'documento.pdf',
    tipo_mime: 'application/pdf',
    tamanho_bytes: 1024000,
    pasta_id: null,
    b2_key: 'arquivos/documento.pdf',
    b2_url: 'https://b2.example.com/arquivos/documento.pdf',
    tipo_media: 'pdf',
    criado_por: 1,
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

export function criarArquivoComUsuarioMock(
  overrides?: Partial<ArquivoComUsuario>
): ArquivoComUsuario {
  return {
    ...criarArquivoMock(),
    criador: {
      id: 1,
      nomeCompleto: 'Usuário Teste',
      nomeExibicao: null,
      emailCorporativo: 'usuario@test.com',
    },
    ...overrides,
  };
}

export function criarPastaMock(overrides?: Partial<Pasta>): Pasta {
  return {
    id: 1,
    nome: 'Pasta Teste',
    tipo: 'comum',
    pasta_pai_id: null,
    criado_por: 1,
    descricao: null,
    cor: null,
    icone: null,
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

export function criarPastaComContadoresMock(
  overrides?: Partial<PastaComContadores>
): PastaComContadores {
  return {
    ...criarPastaMock(),
    total_documentos: 5,
    total_subpastas: 2,
    criador: {
      id: 1,
      nomeCompleto: 'Usuário Teste',
    },
    ...overrides,
  };
}

export function criarCompartilhamentoMock(
  overrides?: Partial<DocumentoCompartilhado>
): DocumentoCompartilhado {
  return {
    id: 1,
    documento_id: 1,
    usuario_id: 2,
    permissao: 'visualizar',
    pode_deletar: false,
    compartilhado_por: 1,
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    ...overrides,
  };
}

export function criarCompartilhamentoComUsuarioMock(
  overrides?: Partial<DocumentoCompartilhadoComUsuario>
): DocumentoCompartilhadoComUsuario {
  return {
    ...criarCompartilhamentoMock(),
    usuario: {
      id: 2,
      nomeCompleto: 'Outro Usuário',
      nomeExibicao: null,
      emailCorporativo: 'outro@test.com',
    },
    compartilhador: {
      id: 1,
      nomeCompleto: 'Usuário Teste',
    },
    ...overrides,
  };
}
