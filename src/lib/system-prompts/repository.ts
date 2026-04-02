/**
 * Repository - System Prompts
 * Camada de acesso a dados para prompts de IA
 */

import { createClient } from "@/lib/supabase/server";
import type { CategoriaPrompt, SystemPrompt } from "./domain";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Buscar todos os prompts
 */
export async function findAll(): Promise<SystemPrompt[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_prompts")
    .select("*")
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar system prompts: ${error.message}`);
  }

  return data || [];
}

/**
 * Buscar prompts por categoria
 */
export async function findByCategoria(
  categoria: CategoriaPrompt
): Promise<SystemPrompt[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_prompts")
    .select("*")
    .eq("categoria", categoria)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(
      `Erro ao buscar prompts da categoria ${categoria}: ${error.message}`
    );
  }

  return data || [];
}

/**
 * Buscar prompt por slug
 */
export async function findBySlug(slug: string): Promise<SystemPrompt | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_prompts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar prompt por slug: ${error.message}`);
  }

  return data;
}

/**
 * Buscar prompt por ID
 */
export async function findById(id: string): Promise<SystemPrompt | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_prompts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar prompt: ${error.message}`);
  }

  return data;
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Criar novo prompt
 */
export async function create(params: {
  slug: string;
  nome: string;
  descricao?: string;
  categoria: CategoriaPrompt;
  conteudo: string;
  ativo?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<SystemPrompt> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("system_prompts")
    .insert({
      ...params,
      created_by_auth_id: userData.user?.id,
      updated_by_auth_id: userData.user?.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar prompt: ${error.message}`);
  }

  return data;
}

/**
 * Atualizar prompt
 */
export async function update(
  id: string,
  params: Partial<{
    nome: string;
    descricao: string;
    conteudo: string;
    ativo: boolean;
    metadata: Record<string, unknown>;
  }>
): Promise<SystemPrompt> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("system_prompts")
    .update({
      ...params,
      updated_by_auth_id: userData.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar prompt: ${error.message}`);
  }

  return data;
}

/**
 * Deletar prompt
 */
export async function remove(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("system_prompts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar prompt: ${error.message}`);
  }
}

/**
 * Ativar/desativar prompt
 */
export async function toggleAtivo(
  id: string,
  ativo: boolean
): Promise<SystemPrompt> {
  return update(id, { ativo });
}
