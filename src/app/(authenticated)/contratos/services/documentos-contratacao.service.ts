import { createServiceClient } from '@/lib/supabase/service-client';
import type { TemplateBasico } from '@/shared/assinatura-digital/services/data.service';
import type { DadosContratoParaMapping } from './mapeamento-contrato-input-data';
import { contratoParaInputData } from './mapeamento-contrato-input-data';
import { generatePdfFromTemplate } from '@/shared/assinatura-digital/services/template-pdf.service';
import JSZip from 'jszip';

export const FORMULARIO_SLUG_TRABALHISTA = 'contratacao';
export const SEGMENTO_ID_TRABALHISTA = 1;

export interface FormularioComTemplates {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  segmento_id: number;
  ativo: boolean;
  template_ids: string[];
}

export async function carregarDadosContrato(
  contratoId: number,
): Promise<DadosContratoParaMapping | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('contratos')
    .select(`
      id, segmento_id, cliente_id,
      cliente:clientes!cliente_id (
        id, tipo_pessoa, nome, cpf, rg, nacionalidade, estado_civil,
        ddd_celular, numero_celular, emails,
        endereco:enderecos!endereco_id (
          logradouro, numero, complemento, bairro,
          municipio, estado_sigla, cep
        )
      ),
      partes:contrato_partes (
        papel_contratual, nome_snapshot, ordem
      )
    `)
    .eq('id', contratoId)
    .single();

  if (error || !data) return null;

  const cliente = Array.isArray(data.cliente) ? data.cliente[0] : data.cliente;
  const endereco = cliente
    ? Array.isArray(cliente.endereco)
      ? cliente.endereco[0]
      : cliente.endereco
    : null;

  return {
    contrato: {
      id: data.id,
      segmento_id: data.segmento_id,
      cliente_id: data.cliente_id,
    },
    cliente: cliente
      ? { ...cliente, endereco: endereco ?? null }
      : null,
    partes: Array.isArray(data.partes) ? data.partes : [],
  };
}

export async function carregarFormularioContratacao(): Promise<FormularioComTemplates | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_formularios')
    .select('id, formulario_uuid, nome, slug, segmento_id, ativo, template_ids')
    .eq('slug', FORMULARIO_SLUG_TRABALHISTA)
    .eq('segmento_id', SEGMENTO_ID_TRABALHISTA)
    .eq('ativo', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as FormularioComTemplates;
}

export async function carregarTemplatesPorUuids(
  uuids: string[],
): Promise<TemplateBasico[]> {
  if (uuids.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_templates')
    .select('id, template_uuid, nome, ativo, arquivo_original, pdf_url, campos')
    .in('template_uuid', uuids)
    .eq('ativo', true);

  if (error || !data) return [];
  return data as TemplateBasico[];
}

// ---------------------------------------------------------------------------
// ZIP orchestration
// ---------------------------------------------------------------------------

export interface GerarZipInput {
  dados: DadosContratoParaMapping;
  templates: TemplateBasico[];
  formulario: FormularioComTemplates;
  overrides?: Record<string, string>;
}

function sanitizarNomeArquivo(nome: string): string {
  return nome.replace(/[/\\:*?"<>|]/g, '_').trim() || 'documento';
}

export async function gerarZipPdfsContratacao(
  input: GerarZipInput,
): Promise<Buffer> {
  const { dados, templates, formulario, overrides = {} } = input;

  const mapeado = contratoParaInputData(dados);

  const segmentoPlaceholder = {
    id: formulario.segmento_id,
    nome: 'Trabalhista',
    slug: 'trabalhista',
    ativo: true,
  };

  const formularioPlaceholder = {
    id: formulario.id,
    formulario_uuid: formulario.formulario_uuid,
    nome: formulario.nome,
    slug: formulario.slug,
    segmento_id: formulario.segmento_id,
    ativo: formulario.ativo,
  };

  const ctx = {
    cliente: mapeado.cliente,
    segmento: segmentoPlaceholder,
    formulario: formularioPlaceholder,
    protocolo: `CTR-${dados.contrato.id}-${Date.now()}`,
    parte_contraria: mapeado.parteContrariaNome
      ? { nome: mapeado.parteContrariaNome }
      : undefined,
  };

  const extras: Record<string, unknown> = {
    ...mapeado.ctxExtras,
    ...overrides,
  };

  const buffers = await Promise.all(
    templates.map(async (template) => {
      const buffer = await generatePdfFromTemplate(
        template,
        ctx,
        extras,
        undefined,
      );
      return { nome: template.nome, buffer };
    }),
  );

  const zip = new JSZip();
  for (const { nome, buffer } of buffers) {
    zip.file(`${sanitizarNomeArquivo(nome)}.pdf`, buffer);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}
