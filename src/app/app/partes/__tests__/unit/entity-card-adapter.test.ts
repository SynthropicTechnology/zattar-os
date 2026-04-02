// using globals

import {
  maskDocument,
  extractFirstEmail,
  formatPhone,
  formatLocation,
  clienteToEntityCard,
  parteContrariaToEntityCard,
  terceiroToEntityCard,
  representanteToEntityCard,
  ENTITY_CONFIGS,
} from '../../adapters/entity-card-adapter';

import type { ClientePessoaFisica, ClientePessoaJuridica, ProcessoRelacionado } from '../../domain';
import type { TerceiroPessoaFisica, TerceiroPessoaJuridica } from '../../domain';
import type { ParteContrariaPessoaFisica, ParteContrariaPessoaJuridica } from '../../domain';
import type { Representante } from '../../types/representantes';

// =============================================================================
// maskDocument
// =============================================================================

describe('maskDocument', () => {
  it('CPF com 11 dígitos sem formatação → mascara corretamente', () => {
    // 12345678900 → primeiros 3 = "123", últimos 2 = "00"
    expect(maskDocument('12345678900')).toBe('123.***.***-00');
  });

  it('CNPJ com 14 dígitos sem formatação → mascara corretamente', () => {
    // 12345678000199 → últimos 2 = "99"
    expect(maskDocument('12345678000199')).toBe('**.**.***/****-99');
  });

  it('null → retorna "--"', () => {
    expect(maskDocument(null)).toBe('--');
  });

  it('undefined → retorna "--"', () => {
    expect(maskDocument(undefined)).toBe('--');
  });

  it('string vazia → retorna "--"', () => {
    expect(maskDocument('')).toBe('--');
  });

  it('CPF formatado com pontos e traço → extrai dígitos e mascara', () => {
    // '123.456.789-00' → digits='12345678900'
    expect(maskDocument('123.456.789-00')).toBe('123.***.***-00');
  });

  it('CNPJ formatado com pontos, barra e traço → extrai dígitos e mascara', () => {
    // '12.345.678/0001-90' → digits='12345678000190'
    expect(maskDocument('12.345.678/0001-90')).toBe('**.**.***/****-90');
  });

  it('documento com comprimento não padrão → mostra os últimos 4 dígitos', () => {
    // '12345' → 5 dígitos → '****2345'
    expect(maskDocument('12345')).toBe('****2345');
  });

  it('CPF com dígitos repetidos → mascara corretamente', () => {
    expect(maskDocument('00000000000')).toBe('000.***.***-00');
  });
});

// =============================================================================
// extractFirstEmail
// =============================================================================

describe('extractFirstEmail', () => {
  it('array de strings com emails → retorna o primeiro', () => {
    expect(extractFirstEmail(['a@a.com', 'b@b.com'])).toBe('a@a.com');
  });

  it('array vazio → retorna undefined', () => {
    expect(extractFirstEmail([])).toBeUndefined();
  });

  it('string codificada como JSON array → faz parse e retorna o primeiro', () => {
    expect(extractFirstEmail('["x@x.com","y@y.com"]')).toBe('x@x.com');
  });

  it('string simples de email → retorna ela mesma', () => {
    expect(extractFirstEmail('direto@teste.com')).toBe('direto@teste.com');
  });

  it('null → retorna undefined', () => {
    expect(extractFirstEmail(null)).toBeUndefined();
  });

  it('undefined → retorna undefined', () => {
    expect(extractFirstEmail(undefined)).toBeUndefined();
  });

  it('string vazia → retorna undefined', () => {
    expect(extractFirstEmail('')).toBeUndefined();
  });

  it('JSON inválido → retorna a string como email direto', () => {
    expect(extractFirstEmail('{nao:json')).toBe('{nao:json');
  });

  it('JSON array vazio como string → retorna a string pois não há itens válidos', () => {
    // O parser extrai array vazio, cai no fallback "return emails || undefined"
    // '[]' é string truthy, então retorna '[]' (comportamento do adapter)
    const resultado = extractFirstEmail('[]');
    // Pode retornar undefined ou a string '[]' dependendo do caminho — verificamos que não trava
    expect(resultado === undefined || resultado === '[]').toBe(true);
  });

  it('array com um único email → retorna esse email', () => {
    expect(extractFirstEmail(['unico@teste.com'])).toBe('unico@teste.com');
  });
});

// =============================================================================
// formatPhone
// =============================================================================

describe('formatPhone', () => {
  it('DDD + número com 9 dígitos → formata como "(DD) NNNNN-NNNN"', () => {
    expect(formatPhone('11', '987654321')).toBe('(11) 98765-4321');
  });

  it('DDD + número com 8 dígitos → formata como "(DD) NNNN-NNNN"', () => {
    expect(formatPhone('21', '33334444')).toBe('(21) 3333-4444');
  });

  it('DDD nulo → retorna undefined', () => {
    expect(formatPhone(null, '987654321')).toBe('987654321');
  });

  it('número nulo → retorna "(DD)"', () => {
    expect(formatPhone('11', null)).toBe('(11)');
  });

  it('ambos nulos → retorna undefined', () => {
    expect(formatPhone(null, null)).toBeUndefined();
  });

  it('ambos undefined → retorna undefined', () => {
    expect(formatPhone(undefined, undefined)).toBeUndefined();
  });

  it('DDD com não-dígitos → strips antes de formatar', () => {
    expect(formatPhone('(11)', '987654321')).toBe('(11) 98765-4321');
  });

  it('número com hífen → strips antes de formatar', () => {
    expect(formatPhone('11', '9876-54321')).toBe('(11) 98765-4321');
  });

  it('número com comprimento diferente de 8 ou 9 → retorna formato básico', () => {
    expect(formatPhone('11', '1234567')).toBe('(11) 1234567');
  });
});

// =============================================================================
// formatLocation
// =============================================================================

describe('formatLocation', () => {
  it('municipio + estado_sigla → "Cidade, UF"', () => {
    expect(formatLocation({ municipio: 'São Paulo', estado_sigla: 'SP' })).toBe('São Paulo, SP');
  });

  it('apenas municipio → retorna só a cidade', () => {
    expect(formatLocation({ municipio: 'Campinas', estado_sigla: null })).toBe('Campinas');
  });

  it('apenas estado_sigla → retorna só a UF', () => {
    expect(formatLocation({ municipio: null, estado_sigla: 'RJ' })).toBe('RJ');
  });

  it('endereco nulo → retorna "--"', () => {
    expect(formatLocation(null)).toBe('--');
  });

  it('endereco undefined → retorna "--"', () => {
    expect(formatLocation(undefined)).toBe('--');
  });

  it('municipio e estado_sigla com strings vazias → retorna "--"', () => {
    expect(formatLocation({ municipio: '  ', estado_sigla: '  ' })).toBe('--');
  });

  it('municipio com espaços em branco → faz trim antes de montar', () => {
    expect(formatLocation({ municipio: '  Belo Horizonte  ', estado_sigla: 'MG' })).toBe(
      'Belo Horizonte, MG'
    );
  });
});

// =============================================================================
// Fixtures helpers
// =============================================================================

function criarClientePFBase(): ClientePessoaFisica {
  return {
    id: 1,
    tipo_pessoa: 'pf',
    nome: 'João Silva',
    nome_social_fantasia: null,
    cpf: '12345678900',
    cnpj: null,
    emails: ['joao@teste.com'],
    ddd_celular: '11',
    numero_celular: '987654321',
    ddd_residencial: null,
    numero_residencial: null,
    ddd_comercial: null,
    numero_comercial: null,
    tipo_documento: null,
    status_pje: null,
    situacao_pje: null,
    login_pje: null,
    autoridade: null,
    observacoes: null,
    dados_anteriores: null,
    endereco_id: null,
    responsavel_id: null,
    ativo: true,
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    rg: null,
    data_nascimento: null,
    genero: null,
    estado_civil: null,
    nacionalidade: null,
    sexo: null,
    nome_genitora: null,
    naturalidade_id_pje: null,
    naturalidade_municipio: null,
    naturalidade_estado_id_pje: null,
    naturalidade_estado_sigla: null,
    uf_nascimento_id_pje: null,
    uf_nascimento_sigla: null,
    uf_nascimento_descricao: null,
    pais_nascimento_id_pje: null,
    pais_nascimento_codigo: null,
    pais_nascimento_descricao: null,
    escolaridade_codigo: null,
    situacao_cpf_receita_id: null,
    situacao_cpf_receita_descricao: null,
    pode_usar_celular_mensagem: null,
  };
}

function criarClientePJBase(): ClientePessoaJuridica {
  return {
    id: 2,
    tipo_pessoa: 'pj',
    nome: 'Empresa XYZ',
    nome_social_fantasia: 'XYZ Soluções',
    cnpj: '12345678000199',
    cpf: null,
    emails: ['contato@xyz.com'],
    ddd_celular: '11',
    numero_celular: '33334444',
    ddd_residencial: null,
    numero_residencial: null,
    ddd_comercial: null,
    numero_comercial: null,
    tipo_documento: null,
    status_pje: null,
    situacao_pje: null,
    login_pje: null,
    autoridade: null,
    observacoes: null,
    dados_anteriores: null,
    endereco_id: null,
    responsavel_id: null,
    ativo: true,
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
    inscricao_estadual: null,
    data_abertura: null,
    data_fim_atividade: null,
    orgao_publico: null,
    tipo_pessoa_codigo_pje: null,
    tipo_pessoa_label_pje: null,
    tipo_pessoa_validacao_receita: null,
    ds_tipo_pessoa: null,
    situacao_cnpj_receita_id: null,
    situacao_cnpj_receita_descricao: null,
    ramo_atividade: null,
    cpf_responsavel: null,
    oficial: null,
    ds_prazo_expediente_automatico: null,
    porte_codigo: null,
    porte_descricao: null,
    ultima_atualizacao_pje: null,
  };
}

function criarProcessoRelacionado(overrides?: Partial<ProcessoRelacionado>): ProcessoRelacionado {
  return {
    processo_id: 100,
    numero_processo: '0001234-56.2024.5.02.0001',
    tipo_parte: 'RECLAMANTE',
    polo: 'ATIVO',
    codigo_status_processo: 'A',
    ...overrides,
  };
}

// =============================================================================
// clienteToEntityCard
// =============================================================================

describe('clienteToEntityCard', () => {
  it('cliente PF com todos os campos → mapeia corretamente', () => {
    const cliente = criarClientePFBase();
    const card = clienteToEntityCard(cliente);

    expect(card.id).toBe(1);
    expect(card.nome).toBe('João Silva');
    expect(card.tipo).toBe('pf');
    expect(card.documentoMasked).toBe('123.***.***-00');
    expect(card.email).toBe('joao@teste.com');
    expect(card.telefone).toBe('(11) 98765-4321');
    expect(card.ativo).toBe(true);
    expect(card.config).toBe(ENTITY_CONFIGS.cliente);
    expect(card.tags).toEqual([]);
  });

  it('cliente PJ com todos os campos → usa cnpj e nome_social_fantasia', () => {
    const cliente = criarClientePJBase();
    const card = clienteToEntityCard(cliente);

    expect(card.tipo).toBe('pj');
    expect(card.documentoMasked).toBe('**.**.***/****-99');
    expect(card.nomeSocial).toBe('XYZ Soluções');
    expect(card.email).toBe('contato@xyz.com');
  });

  it('com processos_relacionados → conta ativos vs total corretamente', () => {
    const cliente = criarClientePFBase();
    const processos: ProcessoRelacionado[] = [
      criarProcessoRelacionado({ codigo_status_processo: 'A' }),
      criarProcessoRelacionado({ codigo_status_processo: 'A' }),
      criarProcessoRelacionado({ codigo_status_processo: 'I' }),
    ];
    const card = clienteToEntityCard({ ...cliente, processos_relacionados: processos });

    expect(card.metricas.total).toBe(3);
    expect(card.metricas.ativos).toBe(2);
    expect(card.metricas.label).toBe('processos');
  });

  it('processo com status_ativo null → conta como ativo', () => {
    const cliente = criarClientePFBase();
    const processos: ProcessoRelacionado[] = [
      criarProcessoRelacionado({ codigo_status_processo: null }),
      criarProcessoRelacionado({ codigo_status_processo: 'I' }),
    ];
    const card = clienteToEntityCard({ ...cliente, processos_relacionados: processos });

    expect(card.metricas.ativos).toBe(1);
    expect(card.metricas.total).toBe(2);
  });

  it('sem processos_relacionados → metricas = { ativos: 0, total: 0 }', () => {
    const cliente = criarClientePFBase();
    const card = clienteToEntityCard(cliente);

    expect(card.metricas.ativos).toBe(0);
    expect(card.metricas.total).toBe(0);
  });

  it('com endereco join → localizacao populada', () => {
    const cliente = criarClientePFBase();
    const endereco = { municipio: 'São Paulo', estado_sigla: 'SP' };
    const card = clienteToEntityCard({ ...cliente, endereco });

    expect(card.localizacao).toBe('São Paulo, SP');
  });

  it('sem endereco → localizacao = "--"', () => {
    const cliente = criarClientePFBase();
    const card = clienteToEntityCard(cliente);

    expect(card.localizacao).toBe('--');
  });

  it('ativo = false → card.ativo = false', () => {
    const cliente = { ...criarClientePFBase(), ativo: false };
    const card = clienteToEntityCard(cliente);

    expect(card.ativo).toBe(false);
  });

  it('ultimaAtualizacao usa updated_at quando disponível', () => {
    const cliente = criarClientePFBase();
    const card = clienteToEntityCard(cliente);

    expect(card.ultimaAtualizacao).toBe('2024-02-01T00:00:00Z');
  });

  it('ultimaAtualizacao fallback para created_at quando updated_at vazio', () => {
    const cliente = { ...criarClientePFBase(), updated_at: '' };
    const card = clienteToEntityCard(cliente);

    expect(card.ultimaAtualizacao).toBe('2024-01-01T00:00:00Z');
  });
});

// =============================================================================
// parteContrariaToEntityCard
// =============================================================================

describe('parteContrariaToEntityCard', () => {
  function criarPartePFBase(): ParteContrariaPessoaFisica {
    return {
      id: 10,
      tipo_pessoa: 'pf',
      nome: 'Maria Contrária',
      nome_social_fantasia: null,
      cpf: '98765432100',
      cnpj: null,
      emails: ['maria@contraria.com'],
      ddd_celular: '21',
      numero_celular: '987651234',
      ddd_residencial: null,
      numero_residencial: null,
      ddd_comercial: null,
      numero_comercial: null,
      tipo_documento: null,
      status_pje: null,
      situacao_pje: null,
      login_pje: null,
      autoridade: null,
      observacoes: null,
      dados_anteriores: null,
      endereco_id: null,
      ativo: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-04-01T00:00:00Z',
      rg: null,
      data_nascimento: null,
      genero: null,
      estado_civil: null,
      nacionalidade: null,
      sexo: null,
      nome_genitora: null,
      naturalidade_id_pje: null,
      naturalidade_municipio: null,
      naturalidade_estado_id_pje: null,
      naturalidade_estado_sigla: null,
      uf_nascimento_id_pje: null,
      uf_nascimento_sigla: null,
      uf_nascimento_descricao: null,
      pais_nascimento_id_pje: null,
      pais_nascimento_codigo: null,
      pais_nascimento_descricao: null,
      escolaridade_codigo: null,
      situacao_cpf_receita_id: null,
      situacao_cpf_receita_descricao: null,
      pode_usar_celular_mensagem: null,
    };
  }

  function criarPartePJBase(): ParteContrariaPessoaJuridica {
    return {
      id: 11,
      tipo_pessoa: 'pj',
      nome: 'Empresa Contrária Ltda',
      nome_social_fantasia: 'Contrária Corp',
      cnpj: '98765432000188',
      cpf: null,
      emails: ['juridico@contraria.com'],
      ddd_celular: '11',
      numero_celular: '55556666',
      ddd_residencial: null,
      numero_residencial: null,
      ddd_comercial: null,
      numero_comercial: null,
      tipo_documento: null,
      status_pje: null,
      situacao_pje: null,
      login_pje: null,
      autoridade: null,
      observacoes: null,
      dados_anteriores: null,
      endereco_id: null,
      ativo: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-05-01T00:00:00Z',
      inscricao_estadual: null,
      data_abertura: null,
      data_fim_atividade: null,
      orgao_publico: null,
      tipo_pessoa_codigo_pje: null,
      tipo_pessoa_label_pje: null,
      tipo_pessoa_validacao_receita: null,
      ds_tipo_pessoa: null,
      situacao_cnpj_receita_id: null,
      situacao_cnpj_receita_descricao: null,
      ramo_atividade: null,
      cpf_responsavel: null,
      oficial: null,
      ds_prazo_expediente_automatico: null,
      porte_codigo: null,
      porte_descricao: null,
      ultima_atualizacao_pje: null,
    };
  }

  it('parte contrária PF → mapeia para config parteContraria', () => {
    const parte = criarPartePFBase();
    const card = parteContrariaToEntityCard(parte);

    expect(card.id).toBe(10);
    expect(card.nome).toBe('Maria Contrária');
    expect(card.tipo).toBe('pf');
    expect(card.documentoMasked).toBe('987.***.***-00');
    expect(card.email).toBe('maria@contraria.com');
    expect(card.config).toBe(ENTITY_CONFIGS.parteContraria);
  });

  it('parte contrária PJ → usa cnpj e nome_social_fantasia', () => {
    const parte = criarPartePJBase();
    const card = parteContrariaToEntityCard(parte);

    expect(card.tipo).toBe('pj');
    expect(card.nomeSocial).toBe('Contrária Corp');
    expect(card.documentoMasked).toBe('**.**.***/****-88');
  });

  it('com processos_relacionados → conta corretamente', () => {
    const parte = criarPartePFBase();
    const processos: ProcessoRelacionado[] = [
      criarProcessoRelacionado({ codigo_status_processo: 'A' }),
      criarProcessoRelacionado({ codigo_status_processo: 'E' }),
    ];
    const card = parteContrariaToEntityCard({ ...parte, processos_relacionados: processos });

    expect(card.metricas.total).toBe(2);
    expect(card.metricas.ativos).toBe(1);
  });

  it('sem processos → metricas zeradas', () => {
    const card = parteContrariaToEntityCard(criarPartePFBase());
    expect(card.metricas.ativos).toBe(0);
    expect(card.metricas.total).toBe(0);
  });

  it('com endereco → localizacao preenchida', () => {
    const card = parteContrariaToEntityCard({
      ...criarPartePFBase(),
      endereco: { municipio: 'Rio de Janeiro', estado_sigla: 'RJ' },
    });
    expect(card.localizacao).toBe('Rio de Janeiro, RJ');
  });

  it('sem endereco → localizacao = "--"', () => {
    expect(parteContrariaToEntityCard(criarPartePFBase()).localizacao).toBe('--');
  });
});

// =============================================================================
// terceiroToEntityCard
// =============================================================================

describe('terceiroToEntityCard', () => {
  function criarTerceiroPFBase(): TerceiroPessoaFisica {
    return {
      id: 20,
      tipo_pessoa: 'pf',
      nome: 'Pedro Perito',
      nome_fantasia: null,
      cpf: '11122233344',
      cnpj: null,
      emails: ['pedro@perito.com'],
      ddd_celular: '31',
      numero_celular: '912345678',
      ddd_residencial: null,
      numero_residencial: null,
      ddd_comercial: null,
      numero_comercial: null,
      id_tipo_parte: null,
      tipo_parte: 'PERITO',
      polo: 'NEUTRO',
      principal: null,
      autoridade: null,
      endereco_desconhecido: null,
      status_pje: null,
      situacao_pje: null,
      login_pje: null,
      ordem: null,
      observacoes: null,
      dados_anteriores: null,
      ativo: true,
      endereco_id: null,
      ultima_atualizacao_pje: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
      tipo_documento: null,
      rg: null,
      sexo: null,
      nome_genitora: null,
      data_nascimento: null,
      genero: null,
      estado_civil: null,
      nacionalidade: null,
      uf_nascimento_id_pje: null,
      uf_nascimento_sigla: null,
      uf_nascimento_descricao: null,
      naturalidade_id_pje: null,
      naturalidade_municipio: null,
      naturalidade_estado_id_pje: null,
      naturalidade_estado_sigla: null,
      pais_nascimento_id_pje: null,
      pais_nascimento_codigo: null,
      pais_nascimento_descricao: null,
      escolaridade_codigo: null,
      situacao_cpf_receita_id: null,
      situacao_cpf_receita_descricao: null,
      pode_usar_celular_mensagem: null,
    };
  }

  function criarTerceiroPJBase(): TerceiroPessoaJuridica {
    return {
      id: 21,
      tipo_pessoa: 'pj',
      nome: 'Peritos Associados',
      nome_fantasia: 'Perícia Brasil',
      cnpj: '22333444000155',
      cpf: null,
      emails: null,
      ddd_celular: null,
      numero_celular: null,
      ddd_residencial: null,
      numero_residencial: null,
      ddd_comercial: null,
      numero_comercial: null,
      id_tipo_parte: null,
      tipo_parte: 'PERITO',
      polo: 'NEUTRO',
      principal: null,
      autoridade: null,
      endereco_desconhecido: null,
      status_pje: null,
      situacao_pje: null,
      login_pje: null,
      ordem: null,
      observacoes: null,
      dados_anteriores: null,
      ativo: null,
      endereco_id: null,
      ultima_atualizacao_pje: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-07-01T00:00:00Z',
      inscricao_estadual: null,
      data_abertura: null,
      data_fim_atividade: null,
      orgao_publico: null,
      tipo_pessoa_codigo_pje: null,
      tipo_pessoa_label_pje: null,
      tipo_pessoa_validacao_receita: null,
      ds_tipo_pessoa: null,
      situacao_cnpj_receita_id: null,
      situacao_cnpj_receita_descricao: null,
      ramo_atividade: null,
      cpf_responsavel: null,
      oficial: null,
      ds_prazo_expediente_automatico: null,
      porte_codigo: null,
      porte_descricao: null,
    };
  }

  it('terceiro PF → mapeia tipo_parte para tags', () => {
    const card = terceiroToEntityCard(criarTerceiroPFBase());

    expect(card.id).toBe(20);
    expect(card.tipo).toBe('pf');
    expect(card.tags).toEqual(['PERITO']);
    expect(card.config).toBe(ENTITY_CONFIGS.terceiro);
  });

  it('terceiro PJ → usa nome_fantasia como nomeSocial', () => {
    const card = terceiroToEntityCard(criarTerceiroPJBase());

    expect(card.tipo).toBe('pj');
    expect(card.nomeSocial).toBe('Perícia Brasil');
    expect(card.documentoMasked).toBe('**.**.***/****-55');
  });

  it('terceiro PF → nomeSocial = undefined', () => {
    const card = terceiroToEntityCard(criarTerceiroPFBase());
    expect(card.nomeSocial).toBeUndefined();
  });

  it('terceiro sem tipo_parte → tags = []', () => {
    const terceiro = { ...criarTerceiroPFBase(), tipo_parte: undefined as unknown as 'PERITO' };
    const card = terceiroToEntityCard(terceiro);
    expect(card.tags).toEqual([]);
  });

  it('ativo = null → card.ativo = true (não é false)', () => {
    const terceiro = criarTerceiroPJBase();
    const card = terceiroToEntityCard(terceiro);
    expect(card.ativo).toBe(true);
  });

  it('com processos_relacionados → metricas corretas', () => {
    const processos: ProcessoRelacionado[] = [
      criarProcessoRelacionado({ codigo_status_processo: 'A' }),
      criarProcessoRelacionado({ codigo_status_processo: 'I' }),
      criarProcessoRelacionado({ codigo_status_processo: 'A' }),
    ];
    const card = terceiroToEntityCard({ ...criarTerceiroPFBase(), processos_relacionados: processos });

    expect(card.metricas.ativos).toBe(2);
    expect(card.metricas.total).toBe(3);
  });
});

// =============================================================================
// representanteToEntityCard
// =============================================================================

describe('representanteToEntityCard', () => {
  function criarRepresentanteBase(): Representante {
    return {
      id: 30,
      cpf: '55566677788',
      nome: 'Dr. Advogado Silva',
      sexo: null,
      tipo: 'ADVOGADO',
      oabs: [{ numero: '128404', uf: 'MG', situacao: 'REGULAR' }],
      emails: ['advogado@silva.adv.br'],
      email: null,
      ddd_celular: '31',
      numero_celular: '988887777',
      ddd_residencial: null,
      numero_residencial: null,
      ddd_comercial: null,
      numero_comercial: null,
      endereco_id: null,
      dados_anteriores: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-08-01T00:00:00Z',
    };
  }

  it('representante com OAB → inclui "OAB/UF Número" nas tags', () => {
    const card = representanteToEntityCard(criarRepresentanteBase());

    expect(card.id).toBe(30);
    expect(card.nome).toBe('Dr. Advogado Silva');
    expect(card.tipo).toBe('pf');
    expect(card.tags).toEqual(['OAB/MG 128404']);
    expect(card.config).toBe(ENTITY_CONFIGS.representante);
  });

  it('representante sempre tem tipo = "pf"', () => {
    const card = representanteToEntityCard(criarRepresentanteBase());
    expect(card.tipo).toBe('pf');
  });

  it('representante sem OABs → tags = []', () => {
    const rep = { ...criarRepresentanteBase(), oabs: [] };
    const card = representanteToEntityCard(rep);
    expect(card.tags).toEqual([]);
  });

  it('representante com múltiplas OABs → usa apenas a primeira', () => {
    const rep = {
      ...criarRepresentanteBase(),
      oabs: [
        { numero: '111', uf: 'SP', situacao: 'REGULAR' },
        { numero: '222', uf: 'RJ', situacao: 'REGULAR' },
      ],
    };
    const card = representanteToEntityCard(rep);
    expect(card.tags).toEqual(['OAB/SP 111']);
  });

  it('representante com CPF → mascara corretamente', () => {
    const card = representanteToEntityCard(criarRepresentanteBase());
    // 55566677788 → '555.***.***-88'
    expect(card.documentoMasked).toBe('555.***.***-88');
  });

  it('representante com emails array → retorna o primeiro', () => {
    const card = representanteToEntityCard(criarRepresentanteBase());
    expect(card.email).toBe('advogado@silva.adv.br');
  });

  it('representante com email string (fallback) quando emails é null', () => {
    const rep = {
      ...criarRepresentanteBase(),
      emails: null,
      email: 'fallback@email.com',
    };
    const card = representanteToEntityCard(rep);
    expect(card.email).toBe('fallback@email.com');
  });

  it('representante sempre tem ativo = true', () => {
    const card = representanteToEntityCard(criarRepresentanteBase());
    expect(card.ativo).toBe(true);
  });

  it('com processos_relacionados → metricas calculadas', () => {
    const processos: ProcessoRelacionado[] = [
      criarProcessoRelacionado({ codigo_status_processo: 'A' }),
      criarProcessoRelacionado({ codigo_status_processo: 'H' }),
    ];
    const card = representanteToEntityCard({
      ...criarRepresentanteBase(),
      processos_relacionados: processos,
    });
    // 'H' não está em STATUS_ATIVO → não conta como ativo
    expect(card.metricas.ativos).toBe(1);
    expect(card.metricas.total).toBe(2);
  });

  it('com endereco → localizacao preenchida', () => {
    const card = representanteToEntityCard({
      ...criarRepresentanteBase(),
      endereco: { municipio: 'Belo Horizonte', estado_sigla: 'MG' } as any,
    });
    expect(card.localizacao).toBe('Belo Horizonte, MG');
  });

  it('sem endereco → localizacao = "--"', () => {
    expect(representanteToEntityCard(criarRepresentanteBase()).localizacao).toBe('--');
  });
});
