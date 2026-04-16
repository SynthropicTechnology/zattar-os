import { createServiceClient } from '@/lib/supabase/service-client';
import type { TemplateBasico } from '@/shared/assinatura-digital/services/data.service';
import type { DadosContratoParaMapping, CampoFaltante } from './mapeamento-contrato-input-data';
import { contratoParaInputData, detectarCamposFaltantes } from './mapeamento-contrato-input-data';
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

// ---------------------------------------------------------------------------
// High-level validation + generation helpers
// ---------------------------------------------------------------------------

export type { CampoFaltante };

export type ResultadoValidacao =
  | { status: 'pronto'; formularioId: number; qtdTemplates: number }
  | { status: 'campos_faltantes'; camposFaltantes: CampoFaltante[] }
  | { status: 'erro'; mensagem: string };

type ContextoResult =
  | {
      status: 'success';
      dados: DadosContratoParaMapping;
      formulario: FormularioComTemplates;
      templates: TemplateBasico[];
    }
  | { status: 'error'; mensagem: string };

async function carregarContexto(contratoId: number): Promise<ContextoResult> {
  const dados = await carregarDadosContrato(contratoId);
  if (!dados || !dados.cliente) {
    return { status: 'error', mensagem: 'Contrato sem cliente vinculado' };
  }

  const formulario = await carregarFormularioContratacao();
  if (!formulario || formulario.template_ids.length === 0) {
    return {
      status: 'error',
      mensagem: 'Formulário de contratação trabalhista não está disponível',
    };
  }

  const templates = await carregarTemplatesPorUuids(formulario.template_ids);
  if (templates.length !== formulario.template_ids.length) {
    return {
      status: 'error',
      mensagem: 'Um ou mais templates não estão disponíveis',
    };
  }

  return { status: 'success', dados, formulario, templates };
}

export async function validarGeracaoPdfs(
  contratoId: number,
  overrides: Record<string, string> = {},
): Promise<ResultadoValidacao> {
  const ctx = await carregarContexto(contratoId);
  if (ctx.status === 'error') return { status: 'erro', mensagem: ctx.mensagem };

  let inputData: Record<string, unknown>;
  try {
    const mapeado = contratoParaInputData(ctx.dados);
    inputData = {
      cliente: mapeado.cliente,
      'acao.nome_empresa_pessoa': mapeado.parteContrariaNome,
      'cliente.email': mapeado.ctxExtras['cliente.email'],
      ...overrides,
    };
  } catch (err) {
    return {
      status: 'erro',
      mensagem: err instanceof Error ? err.message : 'Erro no mapeamento',
    };
  }

  const faltantes = detectarCamposFaltantes(inputData, ctx.templates);
  if (faltantes.length > 0) {
    return { status: 'campos_faltantes', camposFaltantes: faltantes };
  }

  return {
    status: 'pronto',
    formularioId: ctx.formulario.id,
    qtdTemplates: ctx.templates.length,
  };
}

export async function gerarZipPdfsParaContrato(
  contratoId: number,
  overrides: Record<string, string> = {},
): Promise<{ buffer: Buffer; nomeCliente: string }> {
  const ctx = await carregarContexto(contratoId);
  if (ctx.status === 'error') throw new Error(ctx.mensagem);

  const buffer = await gerarZipPdfsContratacao({
    dados: ctx.dados,
    templates: ctx.templates,
    formulario: ctx.formulario,
    overrides,
  });

  return {
    buffer,
    nomeCliente: ctx.dados.cliente?.nome ?? 'Contrato',
  };
}
