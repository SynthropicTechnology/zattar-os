import { createServiceClient } from '@/lib/supabase/service-client';

export interface ClienteEndereco {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
}

export interface ClienteBasico {
  id: number;
  nome: string;
  cpf?: string | null;
  cnpj?: string | null;
  tipo_pessoa?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  estado_civil?: string | null;
  genero?: string | null;
  nacionalidade?: string | null;
  endereco?: ClienteEndereco | null;
}

export interface TemplateBasico {
  id: number;
  template_uuid: string;
  nome: string;
  ativo: boolean;
  arquivo_original: string;
  pdf_url?: string | null;
  campos: string;
  conteudo_markdown?: string | null;
}

export interface FormularioBasico {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  segmento_id: number;
  ativo: boolean;
  foto_necessaria?: boolean;
}

export interface SegmentoBasico {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
}

export async function getClienteBasico(id: number): Promise<ClienteBasico | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id, nome, cpf, cnpj, tipo_pessoa,
      rg, data_nascimento, emails,
      ddd_celular, numero_celular,
      ddd_residencial, numero_residencial,
      estado_civil, genero, nacionalidade,
      endereco:enderecos!endereco_id(
        logradouro, numero, complemento,
        bairro, cep, municipio, estado_sigla
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter cliente: ${error.message}`);
  }

  return data as ClienteBasico;
}

function parseTemplateId(id: string): { column: 'id' | 'template_uuid'; value: string | number } {
  const numeric = Number(id);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return { column: 'id', value: numeric };
  }
  return { column: 'template_uuid', value: id };
}

export async function getTemplateBasico(id: string): Promise<TemplateBasico | null> {
  const supabase = createServiceClient();
  const parsed = parseTemplateId(id);
  const { data, error } = await supabase
    .from('assinatura_digital_templates')
    .select('id, template_uuid, nome, ativo, arquivo_original, pdf_url, campos, conteudo_markdown')
    .eq(parsed.column, parsed.value)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter template: ${error.message}`);
  }

  return data as TemplateBasico;
}

function parseFormularioId(id: string | number): { column: 'id' | 'formulario_uuid'; value: string | number } {
  if (typeof id === 'number') {
    return { column: 'id', value: id };
  }
  const numeric = Number(id);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return { column: 'id', value: numeric };
  }
  return { column: 'formulario_uuid', value: id };
}

export async function getFormularioBasico(id: string | number): Promise<FormularioBasico | null> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);
  const { data, error } = await supabase
    .from('assinatura_digital_formularios')
    .select('id, formulario_uuid, nome, slug, segmento_id, ativo, foto_necessaria')
    .eq(parsed.column, parsed.value)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter formulário: ${error.message}`);
  }

  return data as FormularioBasico;
}

export async function getSegmentoBasico(id: number): Promise<SegmentoBasico | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('segmentos')
    .select('id, nome, slug, ativo')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter segmento: ${error.message}`);
  }

  return data as SegmentoBasico;
}