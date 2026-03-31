import type { Assistente } from '../domain';

export function criarAssistenteMock(overrides: Partial<Assistente> = {}): Assistente {
  return {
    id: 1,
    nome: 'Assistente de IA',
    descricao: 'Descrição do assistente',
    tipo: 'iframe',
    iframe_code: '<iframe src="https://example.com"></iframe>',
    dify_app_id: null,
    ativo: true,
    criado_por: 1,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function criarAssistentesParamsMock(overrides = {}) {
  return {
    busca: '',
    ativo: true,
    ...overrides,
  };
}
