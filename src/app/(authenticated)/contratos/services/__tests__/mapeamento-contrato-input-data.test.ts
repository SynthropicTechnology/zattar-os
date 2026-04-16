import { contratoParaInputData, type DadosContratoParaMapping } from '../mapeamento-contrato-input-data';

describe('contratoParaInputData', () => {
  const baseDados: DadosContratoParaMapping = {
    contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
    cliente: {
      id: 10,
      nome: 'João da Silva',
      tipo_pessoa: 'pf',
      cpf: '12345678900',
      rg: 'MG-12.345.678',
      nacionalidade: 'brasileira',
      estado_civil: 'solteiro',
      ddd_celular: '31',
      numero_celular: '999998888',
      emails: ['joao@example.com'],
      endereco: {
        logradouro: 'Rua das Flores',
        numero: '100',
        bairro: 'Centro',
        municipio: 'Belo Horizonte',
        estado_sigla: 'MG',
        cep: '30100000',
      },
    },
    partes: [
      { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme Ltda', ordem: 1 },
    ],
  };

  it('maps a complete PF client to full inputData', () => {
    const result = contratoParaInputData(baseDados);

    expect(result.cliente).toMatchObject({
      id: 10,
      nome: 'João da Silva',
      cpf: '123.456.789-00',
      rg: 'MG-12.345.678',
      nacionalidade: 'brasileira',
      estado_civil: 'Solteiro(a)',
      ddd_celular: '31',
      numero_celular: '99999-8888',
    });
    expect(result.cliente.endereco).toMatchObject({
      logradouro: 'Rua das Flores',
      numero: '100',
      bairro: 'Centro',
      municipio: 'Belo Horizonte',
      estado_sigla: 'MG',
      cep: '30100-000',
    });
    expect(result.ctxExtras['acao.nome_empresa_pessoa']).toBe('Acme Ltda');
    expect(result.ctxExtras['cliente.email']).toBe('joao@example.com');
  });
});

describe('contratoParaInputData - edge cases', () => {
  const baseCliente = {
    id: 10,
    nome: 'João',
    tipo_pessoa: 'pf' as const,
    cpf: '12345678900',
  };

  it('throws when contract has no cliente', () => {
    expect(() =>
      contratoParaInputData({
        contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
        cliente: null,
        partes: [],
      }),
    ).toThrow('Contrato sem cliente vinculado');
  });

  it('throws when cliente is PJ', () => {
    expect(() =>
      contratoParaInputData({
        contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
        cliente: { ...baseCliente, tipo_pessoa: 'pj' },
        partes: [],
      }),
    ).toThrow('Templates trabalhistas exigem cliente Pessoa Física');
  });

  it('concatenates 3 partes contrárias with "A, B e C"', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: baseCliente,
      partes: [
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme', ordem: 1 },
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Beta', ordem: 2 },
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Gama', ordem: 3 },
      ],
    });
    expect(result.parteContrariaNome).toBe('Acme, Beta e Gama');
  });

  it('ignores partes that are not parte_contraria', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: baseCliente,
      partes: [
        { papel_contratual: 'cliente', nome_snapshot: 'Some Client', ordem: 1 },
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme', ordem: 2 },
      ],
    });
    expect(result.parteContrariaNome).toBe('Acme');
  });

  it('returns empty string when no partes contrárias exist', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: baseCliente,
      partes: [],
    });
    expect(result.parteContrariaNome).toBe('');
  });

  it('picks the first email from the emails array', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: { ...baseCliente, emails: ['a@x.com', 'b@x.com'] },
      partes: [],
    });
    expect(result.ctxExtras['cliente.email']).toBe('a@x.com');
  });
});

import { detectarCamposFaltantes } from '../mapeamento-contrato-input-data';

describe('detectarCamposFaltantes', () => {
  const templateMinimo = {
    template_uuid: 'uuid-1',
    nome: 'Contrato',
    campos: JSON.stringify([
      {
        tipo: 'texto',
        variavel: 'cliente.rg',
        obrigatorio: true,
      },
      {
        tipo: 'texto',
        variavel: 'sistema.data_geracao',
        obrigatorio: true,
      },
      {
        tipo: 'assinatura',
        variavel: 'assinatura.assinatura_base64',
        obrigatorio: true,
      },
    ]),
  };

  it('flags missing required field', () => {
    const inputData = {
      cliente: { rg: null },
    };
    const result = detectarCamposFaltantes(inputData, [templateMinimo]);
    expect(result).toHaveLength(1);
    expect(result[0].chave).toBe('cliente.rg');
    expect(result[0].templates).toContain('Contrato');
  });

  it('ignores sistema.data_geracao and assinatura.assinatura_base64', () => {
    const inputData = {
      cliente: { rg: 'X' },
    };
    const result = detectarCamposFaltantes(inputData, [templateMinimo]);
    expect(result).toHaveLength(0);
  });

  it('returns empty when all fields present', () => {
    const inputData = {
      cliente: { rg: 'MG-123' },
    };
    expect(detectarCamposFaltantes(inputData, [templateMinimo])).toEqual([]);
  });

  it('extracts variables from texto_composto fields', () => {
    const templateCompound = {
      template_uuid: 'uuid-2',
      nome: 'Procuração',
      campos: JSON.stringify([
        {
          tipo: 'texto_composto',
          obrigatorio: true,
          conteudo_composto: {
            json: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'variable', attrs: { key: 'cliente.cpf' } },
                    { type: 'text', text: ' e ' },
                    { type: 'variable', attrs: { key: 'cliente.rg' } },
                  ],
                },
              ],
            },
          },
        },
      ]),
    };
    const inputData = { cliente: { cpf: null, rg: null } };
    const result = detectarCamposFaltantes(inputData, [templateCompound]);
    const chaves = result.map(c => c.chave).sort();
    expect(chaves).toEqual(['cliente.cpf', 'cliente.rg']);
  });

  it('deduplicates chaves when multiple templates use same variable', () => {
    const inputData = { cliente: { rg: null } };
    const result = detectarCamposFaltantes(inputData, [templateMinimo, templateMinimo]);
    expect(result).toHaveLength(1);
    expect(result[0].templates).toEqual(['Contrato', 'Contrato']);
  });
});
