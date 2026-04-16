import { createServiceClient } from '@/lib/supabase/service-client';
import { TABLE_FORMULARIOS } from './constants';
import type {
  AssinaturaDigitalFormulario,
  AssinaturaDigitalFormularioList,
  ListFormulariosParams,
  UpsertFormularioInput,
} from '../types/types';
import { FormFieldType } from '../types/domain';
import type { DynamicFormSchema } from '../types/domain';

/**
 * Gera um form_schema base com 3 seções predefinidas para formulários de contrato.
 * Este scaffold é um ponto de partida editável pelo admin no schema builder.
 */
export function generateContratoFormScaffold(): DynamicFormSchema {
  return {
    id: 'contrato-scaffold',
    version: '1.0.0',
    sections: [
      {
        id: 'dados_cliente',
        title: 'Dados do Cliente',
        description: 'Informações preenchidas automaticamente com base no CPF verificado',
        fields: [],
      },
      {
        id: 'parte_contraria',
        title: 'Parte Contrária',
        description: 'Dados da parte contrária no contrato',
        fields: [
          {
            id: 'aplicativo',
            name: 'aplicativo',
            type: FormFieldType.SELECT,
            label: 'Parte Contrária',
            placeholder: 'Selecione a parte contrária',
            validation: { required: true },
            options: [],
          },
          {
            id: 'valor_causa',
            name: 'valor_causa',
            type: FormFieldType.NUMBER,
            label: 'Valor da Causa',
            placeholder: '0,00',
          },
        ],
      },
      {
        id: 'dados_contrato',
        title: 'Dados do Contrato',
        description: 'Informações adicionais sobre o contrato',
        fields: [
          {
            id: 'observacoes',
            name: 'observacoes',
            type: FormFieldType.TEXTAREA,
            label: 'Observações',
            placeholder: 'Observações sobre o contrato...',
          },
        ],
      },
    ],
  };
}

const FORMULARIO_SELECT = '*, segmento:segmentos(*)';

function parseFormularioId(id: string): { column: 'id' | 'formulario_uuid'; value: string | number } {
  const numericId = Number(id);
  if (!Number.isNaN(numericId) && Number.isFinite(numericId)) {
    return { column: 'id', value: numericId };
  }
  return { column: 'formulario_uuid', value: id };
}

function buildFormularioPayload(input: UpsertFormularioInput) {
  const payload: Record<string, unknown> = {
    nome: input.nome,
    slug: input.slug,
    segmento_id: input.segmento_id,
    descricao: input.descricao ?? null,
    form_schema: input.form_schema ?? null,
    schema_version: input.schema_version ?? '1.0.0',
    template_ids: input.template_ids ?? [],
    ativo: input.ativo ?? true,
    ordem: input.ordem ?? 0,
    foto_necessaria: input.foto_necessaria ?? true,
    geolocation_necessaria: input.geolocation_necessaria ?? false,
    metadados_seguranca: input.metadados_seguranca ?? '["ip","user_agent"]',
    criado_por: input.criado_por ?? null,
  };

  // tipo_formulario e contrato_config
  if (input.tipo_formulario !== undefined) {
    payload.tipo_formulario = input.tipo_formulario;
  }
  if (input.tipo_formulario === 'contrato' && input.contrato_config) {
    payload.contrato_config = input.contrato_config;
  } else if (input.tipo_formulario && input.tipo_formulario !== 'contrato') {
    // Limpar contrato_config ao mudar para tipo diferente de contrato
    payload.contrato_config = null;
  }

  // Auto-scaffold: gerar form_schema base quando tipo = contrato e schema vazio
  if (
    input.tipo_formulario === 'contrato' &&
    !input.form_schema
  ) {
    payload.form_schema = generateContratoFormScaffold();
  }

  return payload;
}

export async function listFormularios(
  params: ListFormulariosParams = {}
): Promise<AssinaturaDigitalFormularioList> {
  const supabase = createServiceClient();
  let query = supabase.from(TABLE_FORMULARIOS).select(FORMULARIO_SELECT, { count: 'exact' });

  // Filtro de segmento_id: suporta tanto único ID quanto array de IDs
  if (params.segmento_id !== undefined) {
    if (Array.isArray(params.segmento_id)) {
      if (params.segmento_id.length > 0) {
        query = query.in('segmento_id', params.segmento_id);
      }
    } else {
      query = query.eq('segmento_id', params.segmento_id);
    }
  }

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  if (params.foto_necessaria !== undefined) {
    query = query.eq('foto_necessaria', params.foto_necessaria);
  }

  if (params.geolocation_necessaria !== undefined) {
    query = query.eq('geolocation_necessaria', params.geolocation_necessaria);
  }

  if (params.search) {
    const term = params.search.trim();
    query = query.or(
      `nome.ilike.%${term}%,slug.ilike.%${term}%,descricao.ilike.%${term}%`
    );
  }

  const { data, error, count } = await query
    .order('ordem', { ascending: true, nullsFirst: true })
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar formulários: ${error.message}`);
  }

  return {
    formularios: (data as AssinaturaDigitalFormulario[]) || [],
    total: count ?? 0,
  };
}

export async function getFormulario(id: string): Promise<AssinaturaDigitalFormulario | null> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);

  const { data, error } = await supabase
    .from(TABLE_FORMULARIOS)
    .select(FORMULARIO_SELECT)
    .eq(parsed.column, parsed.value)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter formulário: ${error.message}`);
  }

  return data as AssinaturaDigitalFormulario;
}

/**
 * Busca formulário por slug e segmento_id para uso em formulários públicos.
 * Retorna apenas formulários ativos (ativo = true).
 */
export async function getFormularioBySlugAndSegmentoId(
  slug: string,
  segmentoId: number
): Promise<AssinaturaDigitalFormulario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from(TABLE_FORMULARIOS)
    .select(FORMULARIO_SELECT)
    .eq('slug', slug)
    .eq('segmento_id', segmentoId)
    .eq('ativo', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter formulário por slug: ${error.message}`);
  }

  return data as AssinaturaDigitalFormulario;
}

export async function createFormulario(input: UpsertFormularioInput): Promise<AssinaturaDigitalFormulario> {
  const supabase = createServiceClient();
  const payload = buildFormularioPayload(input);

  const { data, error } = await supabase
    .from(TABLE_FORMULARIOS)
    .insert(payload)
    .select(FORMULARIO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao criar formulário: ${error.message}`);
  }

  return data as AssinaturaDigitalFormulario;
}

export async function updateFormulario(
  id: string,
  input: Partial<UpsertFormularioInput>
): Promise<AssinaturaDigitalFormulario> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);
  const payload: Record<string, unknown> = {};

  if (input.nome !== undefined) payload.nome = input.nome;
  if (input.slug !== undefined) payload.slug = input.slug;
  if (input.segmento_id !== undefined) payload.segmento_id = input.segmento_id;
  if (input.descricao !== undefined) payload.descricao = input.descricao ?? null;
  if (input.form_schema !== undefined) payload.form_schema = input.form_schema;
  if (input.schema_version !== undefined) payload.schema_version = input.schema_version;
  if (input.template_ids !== undefined) payload.template_ids = input.template_ids;
  if (input.ativo !== undefined) payload.ativo = input.ativo;
  if (input.ordem !== undefined) payload.ordem = input.ordem;
  if (input.foto_necessaria !== undefined) payload.foto_necessaria = input.foto_necessaria;
  if (input.geolocation_necessaria !== undefined) {
    payload.geolocation_necessaria = input.geolocation_necessaria;
  }
  if (input.metadados_seguranca !== undefined) {
    payload.metadados_seguranca = input.metadados_seguranca;
  }
  if (input.criado_por !== undefined) payload.criado_por = input.criado_por ?? null;
  if (input.tipo_formulario !== undefined) {
    payload.tipo_formulario = input.tipo_formulario;
  }
  if (input.tipo_formulario === 'contrato' && input.contrato_config !== undefined) {
    payload.contrato_config = input.contrato_config;
  } else if (input.tipo_formulario && input.tipo_formulario !== 'contrato') {
    payload.contrato_config = null;
  }

  const { data, error } = await supabase
    .from(TABLE_FORMULARIOS)
    .update(payload)
    .eq(parsed.column, parsed.value)
    .select(FORMULARIO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar formulário: ${error.message}`);
  }

  return data as AssinaturaDigitalFormulario;
}

export async function deleteFormulario(id: string): Promise<void> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);

  const { error } = await supabase
    .from(TABLE_FORMULARIOS)
    .delete()
    .eq(parsed.column, parsed.value);

  if (error) {
    throw new Error(`Erro ao deletar formulário: ${error.message}`);
  }
}