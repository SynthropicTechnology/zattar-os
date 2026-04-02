/**
 * Repository - Integrações
 * Camada de acesso a dados para integrações
 */

import { createClient } from "@/lib/supabase/server";
import type { Integracao, TipoIntegracao } from "./domain";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Buscar todas as integrações
 */
export async function findAll(): Promise<Integracao[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("integracoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar integrações: ${error.message}`);
  }

  return data || [];
}

/**
 * Buscar integrações por tipo
 */
export async function findByTipo(tipo: TipoIntegracao): Promise<Integracao[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("integracoes")
    .select("*")
    .eq("tipo", tipo)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar integrações do tipo ${tipo}: ${error.message}`);
  }

  return data || [];
}

/**
 * Buscar integração por ID
 */
export async function findById(id: string): Promise<Integracao | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("integracoes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar integração: ${error.message}`);
  }

  return data;
}

/**
 * Buscar integração ativa por tipo e nome
 */
export async function findByTipoAndNome(
  tipo: TipoIntegracao,
  nome: string
): Promise<Integracao | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("integracoes")
    .select("*")
    .eq("tipo", tipo)
    .eq("nome", nome)
    .eq("ativo", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar integração: ${error.message}`);
  }

  return data;
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Criar nova integração
 */
export async function create(params: {
  tipo: TipoIntegracao;
  nome: string;
  descricao?: string;
  ativo?: boolean;
  configuracao: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<Integracao> {
  const supabase = await createClient();
  
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("integracoes")
    .insert({
      ...params,
      created_by_auth_id: userData.user?.id,
      updated_by_auth_id: userData.user?.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar integração: ${error.message}`);
  }

  return data;
}

/**
 * Atualizar integração
 */
export async function update(
  id: string,
  params: Partial<{
    nome: string;
    descricao: string;
    ativo: boolean;
    configuracao: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }>
): Promise<Integracao> {
  const supabase = await createClient();
  
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("integracoes")
    .update({
      ...params,
      updated_by_auth_id: userData.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar integração: ${error.message}`);
  }

  return data;
}

/**
 * Deletar integração
 */
export async function remove(id: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("integracoes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar integração: ${error.message}`);
  }
}

/**
 * Ativar/desativar integração
 */
export async function toggleAtivo(id: string, ativo: boolean): Promise<Integracao> {
  return update(id, { ativo });
}
