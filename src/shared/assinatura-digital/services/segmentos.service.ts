import { createServiceClient } from '@/lib/supabase/service-client';
import { TABLE_SEGMENTOS, TABLE_FORMULARIOS } from './constants';
import type {
  AssinaturaDigitalSegmento,
  AssinaturaDigitalSegmentoList,
  ListSegmentosParams,
  UpsertSegmentoInput,
} from '../types/types';

const SEGMENTO_SELECT = '*';

export async function listSegmentos(params: ListSegmentosParams = {}): Promise<AssinaturaDigitalSegmentoList> {
  const supabase = createServiceClient();
  let query = supabase.from(TABLE_SEGMENTOS).select(SEGMENTO_SELECT, { count: 'exact' });

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  if (params.search) {
    const term = params.search.trim();
    query = query.or(`nome.ilike.%${term}%,slug.ilike.%${term}%,descricao.ilike.%${term}%`);
  }

  const { data, error, count } = await query.order('nome', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar segmentos: ${error.message}`);
  }

  const segmentos = (data as AssinaturaDigitalSegmento[]) || [];

  // Fetch formulario counts per segmento
  const segmentoIds = segmentos.map(s => s.id);
  if (segmentoIds.length > 0) {
    const { data: formularioData, error: countError } = await supabase
      .from(TABLE_FORMULARIOS)
      .select('segmento_id')
      .in('segmento_id', segmentoIds);

    if (countError) {
      throw new Error(`Erro ao contar formulários: ${countError.message}`);
    }

    // Safely default to empty array if formularioData is null
    const rows = formularioData ?? [];

    // Group counts by segmento_id
    const countMap = new Map<number, number>();
    rows.forEach(row => {
      const id = row.segmento_id;
      countMap.set(id, (countMap.get(id) || 0) + 1);
    });

    // Merge counts into segmentos
    segmentos.forEach(s => {
      s.formularios_count = countMap.get(s.id) || 0;
    });
  }
  // Note: When segmentoIds is empty, segmentos array is also empty, so no iteration needed

  return {
    segmentos,
    total: count ?? 0,
  };
}

export async function createSegmento(input: UpsertSegmentoInput): Promise<AssinaturaDigitalSegmento> {
  const supabase = createServiceClient();
  const payload = {
    nome: input.nome,
    slug: input.slug,
    descricao: input.descricao ?? null,
    ativo: input.ativo ?? true,
  };

  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .insert(payload)
    .select(SEGMENTO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao criar segmento: ${error.message}`);
  }

  return data as AssinaturaDigitalSegmento;
}

export async function getSegmento(id: number): Promise<AssinaturaDigitalSegmento | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .select(SEGMENTO_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter segmento: ${error.message}`);
  }

  return data as AssinaturaDigitalSegmento;
}

/**
 * Busca segmento por slug para uso em formulários públicos.
 * Retorna apenas segmentos ativos (ativo = true).
 */
export async function getSegmentoBySlug(slug: string): Promise<AssinaturaDigitalSegmento | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .select(SEGMENTO_SELECT)
    .eq('slug', slug)
    .eq('ativo', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter segmento por slug: ${error.message}`);
  }

  return data as AssinaturaDigitalSegmento;
}

/**
 * Busca segmento por slug para uso em validação de admin.
 * Retorna qualquer segmento com o slug exato, independente do status ativo.
 * Usado para validação de unicidade de slugs.
 */
export async function getSegmentoBySlugAdmin(slug: string): Promise<AssinaturaDigitalSegmento | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .select(SEGMENTO_SELECT)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter segmento por slug: ${error.message}`);
  }

  return data as AssinaturaDigitalSegmento;
}

export async function updateSegmento(id: number, input: Partial<UpsertSegmentoInput>): Promise<AssinaturaDigitalSegmento> {
  const supabase = createServiceClient();
  const payload: Record<string, unknown> = {};

  if (input.nome !== undefined) payload.nome = input.nome;
  if (input.slug !== undefined) payload.slug = input.slug;
  if (input.descricao !== undefined) payload.descricao = input.descricao ?? null;
  if (input.ativo !== undefined) payload.ativo = input.ativo;

  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .update(payload)
    .eq('id', id)
    .select(SEGMENTO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar segmento: ${error.message}`);
  }

  return data as AssinaturaDigitalSegmento;
}

export async function deleteSegmento(id: number): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLE_SEGMENTOS).delete().eq('id', id);
  if (error) {
    throw new Error(`Erro ao deletar segmento: ${error.message}`);
  }
}