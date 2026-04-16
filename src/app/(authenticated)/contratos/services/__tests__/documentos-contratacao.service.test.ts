import { gerarZipPdfsContratacao } from '../documentos-contratacao.service';
import type { TemplateBasico } from '@/shared/assinatura-digital/services/data.service';
import type { DadosContratoParaMapping } from '../mapeamento-contrato-input-data';

jest.mock('@/shared/assinatura-digital/services/template-pdf.service', () => ({
  generatePdfFromTemplate: jest.fn(async (template: TemplateBasico) =>
    Buffer.from(`fake-pdf-${template.nome}`),
  ),
}));

const mockDados: DadosContratoParaMapping = {
  contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
  cliente: {
    id: 10,
    nome: 'João Teste',
    tipo_pessoa: 'pf',
    cpf: '12345678900',
    rg: 'MG-1',
    nacionalidade: 'brasileira',
    estado_civil: 'solteiro',
    ddd_celular: '31',
    numero_celular: '999998888',
    emails: ['j@x.com'],
    endereco: {
      logradouro: 'R', numero: '1', bairro: 'B', municipio: 'BH',
      estado_sigla: 'MG', cep: '30100000',
    },
  },
  partes: [
    { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme', ordem: 1 },
  ],
};

const mockTemplates: TemplateBasico[] = [
  { id: 1, template_uuid: 'u1', nome: 'Contrato', ativo: true, arquivo_original: 'a', campos: '[]' },
  { id: 2, template_uuid: 'u2', nome: 'Procuração', ativo: true, arquivo_original: 'b', campos: '[]' },
];

const mockFormulario = {
  id: 3, formulario_uuid: 'f-uuid', nome: 'Contratação', slug: 'contratacao',
  segmento_id: 1, ativo: true, template_ids: ['u1', 'u2'],
};

describe('gerarZipPdfsContratacao', () => {
  it('produces a Buffer zip containing one PDF per template, named by template', async () => {
    const zipBuffer = await gerarZipPdfsContratacao({
      dados: mockDados,
      templates: mockTemplates,
      formulario: mockFormulario,
    });

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);

    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipBuffer);
    const filenames = Object.keys(zip.files).sort();
    expect(filenames).toEqual(['Contrato.pdf', 'Procuração.pdf']);
  });

  it('propagates errors from merge (does not build partial zip)', async () => {
    const { generatePdfFromTemplate } = await import(
      '@/shared/assinatura-digital/services/template-pdf.service'
    );
    (generatePdfFromTemplate as jest.Mock).mockRejectedValueOnce(
      new Error('pdf merge failed'),
    );

    await expect(
      gerarZipPdfsContratacao({
        dados: mockDados,
        templates: mockTemplates,
        formulario: mockFormulario,
      }),
    ).rejects.toThrow('pdf merge failed');
  });
});
