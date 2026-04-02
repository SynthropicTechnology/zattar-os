/**
 * DOCUMENTOS REPOSITORY - Camada de Persistência
 *
 * Repositório consolidado para documentos, pastas, templates,
 * compartilhamento, versões, uploads e arquivos.
 *
 * CONVENÇÕES:
 * - Funções assíncronas para acesso a dados
 * - NUNCA fazer validação de negócio aqui
 * - NUNCA importar React/Next.js aqui
 */

import { createServiceClient } from "@/lib/supabase/service-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Documento,
  CriarDocumentoParams,
  AtualizarDocumentoParams,
  ListarDocumentosParams,
  DocumentoComUsuario,
  Pasta,
  CriarPastaParams,
  AtualizarPastaParams,
  PastaComContadores,
  PastaHierarquia,
  Template,
  CriarTemplateParams,
  AtualizarTemplateParams,
  TemplateComUsuario,
  ListarTemplatesParams,
  DocumentoCompartilhado,
  CompartilharDocumentoParams,
  DocumentoCompartilhadoComUsuario,
  ListarCompartilhamentosParams,
  DocumentoVersao,
  CriarVersaoParams,
  DocumentoVersaoComUsuario,
  ListarVersoesParams,
  DocumentoUpload,
  UploadArquivoParams,
  DocumentoUploadComInfo,
  ListarUploadsParams,
  Arquivo,
  ArquivoComUsuario,
  CriarArquivoParams,
  AtualizarArquivoParams,
  ListarArquivosParams,
  ItemDocumento,
} from "./domain";

// =============================================================================
// SHARED - Query Builders & Validators
// =============================================================================

type SelectQueryBuilder = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

/**
 * Aplica filtros comuns de busca textual
 */
export function applySearchFilter(
  query: SelectQueryBuilder,
  searchTerm?: string,
  columns: string[] = ["titulo"]
) {
  if (!searchTerm) return query;

  const orConditions = columns
    .map((col) => `${col}.ilike.%${searchTerm}%`)
    .join(",");
  return query.or(orConditions);
}

/**
 * Aplica paginação padrão
 */
export function applyPagination(
  query: SelectQueryBuilder,
  limit = 50,
  offset = 0
) {
  return query.range(offset, offset + limit - 1);
}

/**
 * Constrói query base para documentos com usuário
 */
export function buildDocumentWithUserSelect() {
  return `
    *,
    criador:usuarios!documentos_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao,
      email_corporativo,
      avatar_url
    ),
    editor:usuarios!documentos_editado_por_fkey(
      id,
      nome_completo,
      nome_exibicao,
      avatar_url
    )
  `;
}

/**
 * Constrói query base para templates com usuário
 */
export function buildTemplateWithUserSelect() {
  return `
    *,
    criador:usuarios!templates_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao
    )
  `;
}

/**
 * Constrói query base para pastas com criador
 */
export function buildPastaWithCreatorSelect() {
  return `
    *,
    criador:usuarios!pastas_criado_por_fkey(
      id,
      nome_completo,
      avatar_url
    )
  `;
}

/**
 * Constrói query base para compartilhamentos com usuários
 */
export function buildCompartilhamentoWithUsersSelect() {
  return `
    *,
    usuario:usuarios!documentos_compartilhados_usuario_id_fkey(
      id,
      nome_completo,
      nome_exibicao,
      email_corporativo,
      avatar_url
    ),
    compartilhador:usuarios!documentos_compartilhados_compartilhado_por_fkey(
      id,
      nome_completo,
      avatar_url
    )
  `;
}

/**
 * Constrói query base para versões com criador
 */
export function buildVersaoWithCreatorSelect() {
  return `
    *,
    criador:usuarios!documentos_versoes_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao,
      avatar_url
    )
  `;
}

/**
 * Constrói query base para uploads com documento e criador
 */
export function buildUploadWithInfoSelect() {
  return `
    *,
    documento:documentos!documentos_uploads_documento_id_fkey(
      id,
      titulo
    ),
    criador:usuarios!documentos_uploads_criado_por_fkey(
      id,
      nome_completo,
      avatar_url
    )
  `;
}

/**
 * Constrói query base para arquivos com criador
 */
export function buildArquivoWithCreatorSelect() {
  return `
    *,
    criador:usuarios!arquivos_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao,
      email_corporativo,
      avatar_url
    )
  `;
}

/**
 * Valida se usuário tem acesso a documento
 */
export function validateDocumentAccess(
  documento: { criado_por: number },
  usuario_id: number,
  compartilhamento?: { permissao: string }
): { temAcesso: boolean; permissao: string } {
  // Proprietário tem acesso total
  if (documento.criado_por === usuario_id) {
    return { temAcesso: true, permissao: "proprietario" };
  }

  // Verifica compartilhamento
  if (compartilhamento) {
    return { temAcesso: true, permissao: compartilhamento.permissao };
  }

  return { temAcesso: false, permissao: "nenhuma" };
}

/**
 * Valida se usuário tem acesso a pasta
 */
export function validateFolderAccess(
  pasta: { tipo: string; criado_por: number },
  usuario_id: number
): boolean {
  // Pastas comuns são acessíveis a todos
  if (pasta.tipo === "comum") return true;

  // Pastas privadas apenas para o criador
  return pasta.criado_por === usuario_id;
}

/**
 * Valida se usuário pode editar um recurso
 */
export function validateEditPermission(
  permissao: "proprietario" | "editar" | "visualizar" | null
): boolean {
  return permissao === "proprietario" || permissao === "editar";
}

/**
 * Valida se usuário é proprietário de um recurso
 */
export function validateOwnership(
  recurso: { criado_por: number },
  usuario_id: number
): boolean {
  return recurso.criado_por === usuario_id;
}

/**
 * Valida se um template é acessível ao usuário
 */
export function validateTemplateAccess(
  template: { visibilidade: string; criado_por: number },
  usuario_id: number
): boolean {
  // Templates públicos são acessíveis a todos
  if (template.visibilidade === "publico") return true;

  // Templates privados apenas para o criador
  return template.criado_por === usuario_id;
}

/**
 * Verifica se permissão inclui visualização
 * (editar e proprietário incluem visualizar)
 */
export function canView(
  permissao: "proprietario" | "editar" | "visualizar" | null
): boolean {
  return (
    permissao === "proprietario" ||
    permissao === "editar" ||
    permissao === "visualizar"
  );
}

/**
 * Verifica se permissão inclui edição
 */
export function canEdit(
  permissao: "proprietario" | "editar" | "visualizar" | null
): boolean {
  return permissao === "proprietario" || permissao === "editar";
}

/**
 * Verifica se permissão inclui deleção
 */
export function canDelete(
  permissao: "proprietario" | "editar" | "visualizar" | null,
  pode_deletar?: boolean
): boolean {
  if (permissao === "proprietario") return true;
  return pode_deletar === true;
}

// =============================================================================
// DOCUMENTOS
// =============================================================================

/**
 * Cria um novo documento no banco de dados
 */
export async function criarDocumento(
  params: CriarDocumentoParams,
  usuario_id: number
): Promise<Documento> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos")
    .insert({
      titulo: params.titulo,
      conteudo: params.conteudo ?? [],
      pasta_id: params.pasta_id ?? null,
      criado_por: usuario_id,
      editado_por: usuario_id,
      descricao: params.descricao ?? null,
      tags: params.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar documento: ${error.message}`);
  }

  return data;
}

/**
 * Busca um documento por ID
 */
export async function buscarDocumentoPorId(
  id: number,
  includeDeleted = false
): Promise<Documento | null> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos").select().eq("id", id);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar documento: ${error.message}`);
  }

  return data;
}

/**
 * Busca um documento por ID com informações do usuário
 */
export async function buscarDocumentoComUsuario(
  id: number
): Promise<DocumentoComUsuario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos")
    .select(buildDocumentWithUserSelect())
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar documento com usuário: ${error.message}`);
  }

  return data as unknown as DocumentoComUsuario;
}

/**
 * Lista documentos com filtros
 */
export async function listarDocumentos(
  params: ListarDocumentosParams
): Promise<{ documentos: DocumentoComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos").select(
    buildDocumentWithUserSelect(),
    { count: "exact" }
  );

  // Filtro: pasta_id
  if (params.pasta_id !== undefined) {
    if (params.pasta_id === null) {
      query = query.is("pasta_id", null);
    } else {
      query = query.eq("pasta_id", params.pasta_id);
    }
  }

  // Filtro: busca (título ou descrição)
  if (params.busca) {
    query = query.or(
      `titulo.ilike.%${params.busca}%,descricao.ilike.%${params.busca}%`
    );
  }

  // Filtro: tags
  if (params.tags && params.tags.length > 0) {
    query = query.contains("tags", params.tags);
  }

  // Filtro: criado_por
  if (params.criado_por) {
    query = query.eq("criado_por", params.criado_por);
  }

  // Filtro: acesso_por_usuario_id (documentos criados ou compartilhados ou em pastas comuns)
  if (params.acesso_por_usuario_id) {
    const usuario_id = params.acesso_por_usuario_id;

    // Buscar IDs de documentos compartilhados
    const { data: compartilhados } = await supabase
      .from("documentos_compartilhados")
      .select("documento_id")
      .eq("usuario_id", usuario_id);

    const sharedIds = (compartilhados || []).map(c => c.documento_id);

    // Buscar IDs de pastas comuns
    const { data: pastasComuns } = await supabase
      .from("pastas")
      .select("id")
      .eq("tipo", "comum")
      .is("deleted_at", null);

    const comumFolderIds = (pastasComuns || []).map(p => p.id);

    // Construir filtro OR
    let accessFilter = `criado_por.eq.${usuario_id}`;

    if (sharedIds.length > 0) {
      accessFilter += `,id.in.(${sharedIds.join(',')})`;
    }

    if (comumFolderIds.length > 0) {
      accessFilter += `,pasta_id.in.(${comumFolderIds.join(',')})`;
    }

    query = query.or(accessFilter);
  }

  // Filtro: incluir deletados
  if (!params.incluir_deletados) {
    query = query.is("deleted_at", null);
  }

  // Ordenação
  query = query.order("updated_at", { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar documentos: ${error.message}`);
  }

  return {
    documentos: (data as unknown as DocumentoComUsuario[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Atualiza um documento existente
 */
export async function atualizarDocumento(
  id: number,
  params: AtualizarDocumentoParams,
  usuario_id: number
): Promise<Documento> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {
    editado_por: usuario_id,
    editado_em: new Date().toISOString(),
  };

  if (params.titulo !== undefined) updateData.titulo = params.titulo;
  if (params.conteudo !== undefined) updateData.conteudo = params.conteudo;
  if (params.pasta_id !== undefined) updateData.pasta_id = params.pasta_id;
  if (params.descricao !== undefined) updateData.descricao = params.descricao;
  if (params.tags !== undefined) updateData.tags = params.tags;

  const { data, error } = await supabase
    .from("documentos")
    .update(updateData)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar documento: ${error.message}`);
  }

  return data;
}

/**
 * Incrementa a versão de um documento
 */
export async function incrementarVersaoDocumento(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.rpc("increment_documento_versao", {
    documento_id: id,
  });

  if (error) {
    // Se a função RPC não existir, fazer update manual
    // Primeiro busca a versão atual e depois incrementa
    const { data: docAtual, error: selectError } = await supabase
      .from("documentos")
      .select("versao")
      .eq("id", id)
      .single();

    if (selectError) {
      throw new Error(`Erro ao buscar versão atual: ${selectError.message}`);
    }

    const { error: updateError } = await supabase
      .from("documentos")
      .update({ versao: (docAtual?.versao ?? 0) + 1 })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Erro ao incrementar versão: ${updateError.message}`);
    }
  }
}

/**
 * Soft delete de um documento
 */
export async function deletarDocumento(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Erro ao deletar documento: ${error.message}`);
  }
}

/**
 * Restaura um documento deletado
 */
export async function restaurarDocumento(id: number): Promise<Documento> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar documento: ${error.message}`);
  }

  return data;
}

/**
 * Hard delete de um documento (permanente)
 */
export async function deletarDocumentoPermanentemente(
  id: number
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("documentos").delete().eq("id", id);

  if (error) {
    throw new Error(
      `Erro ao deletar documento permanentemente: ${error.message}`
    );
  }
}

/**
 * Busca documentos na lixeira (soft deleted)
 */
export async function listarDocumentosLixeira(
  usuario_id?: number
): Promise<DocumentoComUsuario[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from("documentos")
    .select(buildDocumentWithUserSelect())
    .not("deleted_at", "is", null);

  if (usuario_id) {
    query = query.eq("criado_por", usuario_id);
  }

  query = query.order("deleted_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar documentos na lixeira: ${error.message}`);
  }

  return (data as unknown as DocumentoComUsuario[]) ?? [];
}

/**
 * Busca documentos compartilhados com um usuário
 */
export async function listarDocumentosCompartilhadosComUsuario(
  usuario_id: number
): Promise<DocumentoComUsuario[]> {
  const supabase = createServiceClient();

  // Primeiro busca os IDs dos documentos compartilhados com o usuário
  const { data: compartilhados, error: compartilhadosError } = await supabase
    .from("documentos_compartilhados")
    .select("documento_id")
    .eq("usuario_id", usuario_id);

  if (compartilhadosError) {
    throw new Error(
      `Erro ao buscar compartilhamentos: ${compartilhadosError.message}`
    );
  }

  // Se não há documentos compartilhados, retorna array vazio
  const documentoIds = (compartilhados ?? []).map((c) => c.documento_id);
  if (documentoIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("documentos")
    .select(buildDocumentWithUserSelect())
    .in("id", documentoIds)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(
      `Erro ao listar documentos compartilhados: ${error.message}`
    );
  }

  return (data as unknown as DocumentoComUsuario[]) ?? [];
}

/**
 * Verifica se um usuário tem acesso a um documento
 */
export async function verificarAcessoDocumento(
  documento_id: number,
  usuario_id: number
): Promise<{
  temAcesso: boolean;
  permissao: "proprietario" | "editar" | "visualizar" | null;
}> {
  const supabase = createServiceClient();

  // Verificar se é o proprietário
  const { data: documento } = await supabase
    .from("documentos")
    .select("criado_por")
    .eq("id", documento_id)
    .single();

  if (documento?.criado_por === usuario_id) {
    return { temAcesso: true, permissao: "proprietario" };
  }

  // Verificar compartilhamento
  const { data: compartilhamento } = await supabase
    .from("documentos_compartilhados")
    .select("permissao")
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id)
    .single();

  if (compartilhamento) {
    return { temAcesso: true, permissao: compartilhamento.permissao };
  }

  return { temAcesso: false, permissao: null };
}

// =============================================================================
// PASTAS
// =============================================================================

/**
 * Cria uma nova pasta no banco de dados
 */
export async function criarPasta(
  params: CriarPastaParams,
  usuario_id: number
): Promise<Pasta> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .insert({
      nome: params.nome,
      pasta_pai_id: params.pasta_pai_id ?? null,
      tipo: params.tipo,
      criado_por: usuario_id,
      descricao: params.descricao ?? null,
      cor: params.cor ?? null,
      icone: params.icone ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma pasta por ID
 */
export async function buscarPastaPorId(id: number): Promise<Pasta | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .select()
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Lista pastas com contadores de documentos e subpastas
 */
export async function listarPastasComContadores(
  pasta_pai_id?: number | null,
  usuario_id?: number
): Promise<PastaComContadores[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from("pastas")
    .select(buildPastaWithCreatorSelect())
    .is("deleted_at", null);

  // Filtro: pasta_pai_id
  if (pasta_pai_id !== undefined) {
    if (pasta_pai_id === null) {
      query = query.is("pasta_pai_id", null);
    } else {
      query = query.eq("pasta_pai_id", pasta_pai_id);
    }
  }

  // Filtro: criado_por (para pastas privadas)
  if (usuario_id) {
    query = query.or(`tipo.eq.comum,criado_por.eq.${usuario_id}`);
  }

  query = query.order("nome", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar pastas: ${error.message}`);
  }

  interface PastaWithRelations extends Pasta {
    criador?: { id?: number; nome_completo?: string; avatar_url?: string | null };
  }
  // A tipagem do `.select(<string>)` do Supabase pode inferir `GenericStringError[]`.
  // Aqui garantimos explicitamente o tipo esperado.
  const pastas = (data ?? []) as unknown as PastaWithRelations[];

  // Buscar contadores para cada pasta
  const pastasComContadores: PastaComContadores[] = await Promise.all(
    pastas.map(async (pasta) => {
      // Contar documentos
      const { count: totalDocumentos } = await supabase
        .from("documentos")
        .select("id", { count: "exact", head: true })
        .eq("pasta_id", pasta.id)
        .is("deleted_at", null);

      // Contar subpastas
      const { count: totalSubpastas } = await supabase
        .from("pastas")
        .select("id", { count: "exact", head: true })
        .eq("pasta_pai_id", pasta.id)
        .is("deleted_at", null);

      return {
        ...pasta,
        total_documentos: totalDocumentos ?? 0,
        total_subpastas: totalSubpastas ?? 0,
        criador: {
          id: pasta.criado_por,
          nomeCompleto: pasta.criador?.nome_completo ?? '',
          avatarUrl: pasta.criador?.avatar_url ?? null,
        },
      };
    })
  );

  return pastasComContadores;
}

/**
 * Busca a árvore hierárquica de pastas
 */
export async function buscarHierarquiaPastas(
  pasta_raiz_id?: number | null,
  incluir_documentos = false,
  usuario_id?: number
): Promise<PastaHierarquia[]> {
  const supabase = createServiceClient();

  // Buscar pasta raiz (ou raízes se pasta_raiz_id for null)
  let query = supabase.from("pastas").select().is("deleted_at", null);

  if (pasta_raiz_id !== undefined) {
    if (pasta_raiz_id === null) {
      query = query.is("pasta_pai_id", null);
    } else {
      query = query.eq("id", pasta_raiz_id);
    }
  } else {
    query = query.is("pasta_pai_id", null);
  }

  // Filtro de privacidade
  if (usuario_id) {
    query = query.or(`tipo.eq.comum,criado_por.eq.${usuario_id}`);
  }

  query = query.order("nome", { ascending: true });

  const { data: pastasRaiz, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar hierarquia de pastas: ${error.message}`);
  }

  if (!pastasRaiz || pastasRaiz.length === 0) {
    return [];
  }

  // Função recursiva para construir árvore
  const construirArvore = async (pasta: Pasta): Promise<PastaHierarquia> => {
    // Buscar subpastas
    const { data: subpastas } = await supabase
      .from("pastas")
      .select()
      .eq("pasta_pai_id", pasta.id)
      .is("deleted_at", null)
      .order("nome", { ascending: true });

    // Buscar documentos se solicitado
    let documentos = undefined;
    if (incluir_documentos) {
      const { data: docs } = await supabase
        .from("documentos")
        .select()
        .eq("pasta_id", pasta.id)
        .is("deleted_at", null)
        .order("titulo", { ascending: true });
      documentos = docs ?? undefined;
    }

    // Recursão para subpastas
    const subpastasComFilhos = await Promise.all(
      (subpastas ?? []).map((subpasta) => construirArvore(subpasta))
    );

    return {
      ...pasta,
      subpastas: subpastasComFilhos,
      documentos,
    };
  };

  return await Promise.all(pastasRaiz.map(construirArvore));
}

/**
 * Atualiza uma pasta existente
 */
export async function atualizarPasta(
  id: number,
  params: AtualizarPastaParams
): Promise<Pasta> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (params.nome !== undefined) updateData.nome = params.nome;
  if (params.pasta_pai_id !== undefined)
    updateData.pasta_pai_id = params.pasta_pai_id;
  if (params.descricao !== undefined) updateData.descricao = params.descricao;
  if (params.cor !== undefined) updateData.cor = params.cor;
  if (params.icone !== undefined) updateData.icone = params.icone;

  const { data, error } = await supabase
    .from("pastas")
    .update(updateData)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete de uma pasta
 */
export async function deletarPasta(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("pastas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Erro ao deletar pasta: ${error.message}`);
  }
}

/**
 * Restaura uma pasta deletada
 */
export async function restaurarPasta(id: number): Promise<Pasta> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Hard delete de uma pasta (permanente)
 */
export async function deletarPastaPermanentemente(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("pastas").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar pasta permanentemente: ${error.message}`);
  }
}

/**
 * Move uma pasta para outra pasta pai
 */
export async function moverPasta(
  id: number,
  nova_pasta_pai_id: number | null
): Promise<Pasta> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .update({ pasta_pai_id: nova_pasta_pai_id })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao mover pasta: ${error.message}`);
  }

  return data;
}

/**
 * Verifica se um usuário tem acesso a uma pasta
 */
export async function verificarAcessoPasta(
  pasta_id: number,
  usuario_id: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data: pasta } = await supabase
    .from("pastas")
    .select("tipo, criado_por")
    .eq("id", pasta_id)
    .is("deleted_at", null)
    .single();

  if (!pasta) {
    return false;
  }

  // Pastas comuns são acessíveis a todos
  if (pasta.tipo === "comum") {
    return true;
  }

  // Pastas privadas apenas para o criador
  return pasta.criado_por === usuario_id;
}

/**
 * Busca o caminho completo de uma pasta (breadcrumbs)
 */
export async function buscarCaminhoPasta(pasta_id: number): Promise<Pasta[]> {
  const supabase = createServiceClient();

  const caminho: Pasta[] = [];
  let atual_id: number | null = pasta_id;

  while (atual_id !== null) {
    const result = await supabase
      .from("pastas")
      .select("*")
      .eq("id", atual_id)
      .is("deleted_at", null)
      .single();

    const pastaAtual = result.data as Pasta | null;
    if (!pastaAtual) break;

    caminho.unshift(pastaAtual);
    atual_id = pastaAtual.pasta_pai_id;
  }

  return caminho;
}

// =============================================================================
// TEMPLATES
// =============================================================================

/**
 * Cria um novo template
 */
export async function criarTemplate(
  params: CriarTemplateParams,
  usuario_id: number
): Promise<Template> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("templates")
    .insert({
      titulo: params.titulo,
      descricao: params.descricao ?? null,
      conteudo: params.conteudo,
      visibilidade: params.visibilidade,
      categoria: params.categoria ?? null,
      thumbnail_url: params.thumbnail_url ?? null,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar template: ${error.message}`);
  }

  return data;
}

/**
 * Busca um template por ID
 */
export async function buscarTemplatePorId(
  id: number
): Promise<Template | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("templates")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar template: ${error.message}`);
  }

  return data;
}

/**
 * Busca template com informações do usuário
 */
export async function buscarTemplateComUsuario(
  id: number
): Promise<TemplateComUsuario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("templates")
    .select(buildTemplateWithUserSelect())
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar template com usuário: ${error.message}`);
  }

  return data as unknown as TemplateComUsuario;
}

/**
 * Lista templates com filtros
 */
export async function listarTemplates(
  params: ListarTemplatesParams,
  usuario_id?: number
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase.from("templates").select(
    buildTemplateWithUserSelect(),
    { count: "exact" }
  );

  // Filtro: visibilidade
  if (params.visibilidade) {
    query = query.eq("visibilidade", params.visibilidade);
  } else if (usuario_id) {
    // Se não especificado, mostrar públicos + privados do usuário
    query = query.or(`visibilidade.eq.publico,criado_por.eq.${usuario_id}`);
  } else {
    // Apenas públicos para usuários não autenticados
    query = query.eq("visibilidade", "publico");
  }

  // Filtro: categoria
  if (params.categoria) {
    query = query.eq("categoria", params.categoria);
  }

  // Filtro: criado_por
  if (params.criado_por) {
    query = query.eq("criado_por", params.criado_por);
  }

  // Filtro: busca (título ou descrição)
  if (params.busca) {
    query = query.or(
      `titulo.ilike.%${params.busca}%,descricao.ilike.%${params.busca}%`
    );
  }

  // Ordenação por uso e data
  query = query.order("uso_count", { ascending: false });
  query = query.order("created_at", { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar templates: ${error.message}`);
  }

  return {
    templates: (data as unknown as TemplateComUsuario[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Atualiza um template existente
 */
export async function atualizarTemplate(
  id: number,
  params: AtualizarTemplateParams
): Promise<Template> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (params.titulo !== undefined) updateData.titulo = params.titulo;
  if (params.descricao !== undefined) updateData.descricao = params.descricao;
  if (params.conteudo !== undefined) updateData.conteudo = params.conteudo;
  if (params.visibilidade !== undefined)
    updateData.visibilidade = params.visibilidade;
  if (params.categoria !== undefined) updateData.categoria = params.categoria;
  if (params.thumbnail_url !== undefined)
    updateData.thumbnail_url = params.thumbnail_url;

  const { data, error } = await supabase
    .from("templates")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar template: ${error.message}`);
  }

  return data;
}

/**
 * Deleta um template permanentemente
 */
export async function deletarTemplate(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("templates").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar template: ${error.message}`);
  }
}

/**
 * Incrementa o contador de uso de um template
 */
export async function incrementarUsoTemplate(id: number): Promise<void> {
  const supabase = createServiceClient();

  // Primeiro busca o valor atual e depois incrementa
  const { data: templateAtual, error: selectError } = await supabase
    .from("templates")
    .select("uso_count")
    .eq("id", id)
    .single();

  if (selectError) {
    throw new Error(`Erro ao buscar uso do template: ${selectError.message}`);
  }

  const { error } = await supabase
    .from("templates")
    .update({ uso_count: (templateAtual?.uso_count ?? 0) + 1 })
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao incrementar uso do template: ${error.message}`);
  }
}

/**
 * Lista templates mais usados
 */
export async function listarTemplatesMaisUsados(
  limit = 10,
  usuario_id?: number
): Promise<TemplateComUsuario[]> {
  const supabase = createServiceClient();

  let query = supabase.from("templates").select(buildTemplateWithUserSelect());

  // Filtrar por visibilidade
  if (usuario_id) {
    query = query.or(`visibilidade.eq.publico,criado_por.eq.${usuario_id}`);
  } else {
    query = query.eq("visibilidade", "publico");
  }

  query = query.order("uso_count", { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar templates mais usados: ${error.message}`);
  }

  return (data as unknown as TemplateComUsuario[]) ?? [];
}

/**
 * Lista categorias de templates disponíveis
 */
export async function listarCategoriasTemplates(
  usuario_id?: number
): Promise<string[]> {
  const supabase = createServiceClient();

  let query = supabase.from("templates").select("categoria");

  if (usuario_id) {
    query = query.or(`visibilidade.eq.publico,criado_por.eq.${usuario_id}`);
  } else {
    query = query.eq("visibilidade", "publico");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar categorias: ${error.message}`);
  }

  // Extrair categorias únicas, removendo nulls
  const categorias = Array.from(
    new Set(
      (data ?? [])
        .map((item) => item.categoria)
        .filter((cat): cat is string => cat !== null)
    )
  ).sort();

  return categorias;
}

/**
 * Cria um documento a partir de um template
 */
export async function criarDocumentoDeTemplate(
  template_id: number,
  usuario_id: number,
  opcoes?: {
    titulo?: string;
    pasta_id?: number | null;
  }
): Promise<{ id: number; titulo: string }> {
  const supabase = createServiceClient();

  // Buscar template
  const template = await buscarTemplatePorId(template_id);
  if (!template) {
    throw new Error("Template não encontrado");
  }

  // Definir título (usa o do template se não fornecido)
  const titulo = opcoes?.titulo || `Cópia de ${template.titulo}`;

  // Criar documento
  const { data, error } = await supabase
    .from("documentos")
    .insert({
      titulo,
      conteudo: template.conteudo,
      criado_por: usuario_id,
      editado_por: usuario_id,
      pasta_id: opcoes?.pasta_id ?? null,
    })
    .select("id, titulo")
    .single();

  if (error) {
    throw new Error(`Erro ao criar documento de template: ${error.message}`);
  }

  return data;
}

/**
 * Verifica se um usuário pode editar um template
 */
export async function verificarPermissaoTemplate(
  template_id: number,
  usuario_id: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("templates")
    .select("criado_por")
    .eq("id", template_id)
    .single();

  if (!data) {
    return false;
  }

  return data.criado_por === usuario_id;
}

// =============================================================================
// COMPARTILHAMENTO
// =============================================================================

/**
 * Compartilha um documento com um usuário
 */
export async function compartilharDocumento(
  params: CompartilharDocumentoParams,
  compartilhado_por: number
): Promise<DocumentoCompartilhado> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .insert({
      documento_id: params.documento_id,
      usuario_id: params.usuario_id,
      permissao: params.permissao,
      pode_deletar: params.pode_deletar ?? false,
      compartilhado_por,
    })
    .select()
    .single();

  if (error) {
    // Se já existe, atualizar permissão
    if (error.code === "23505") {
      return await atualizarPermissaoCompartilhamento(
        params.documento_id,
        params.usuario_id,
        params.permissao,
        params.pode_deletar
      );
    }
    throw new Error(`Erro ao compartilhar documento: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza a permissão de um compartilhamento existente
 */
export async function atualizarPermissaoCompartilhamento(
  documento_id: number,
  usuario_id: number,
  permissao: "visualizar" | "editar",
  pode_deletar?: boolean
): Promise<DocumentoCompartilhado> {
  const supabase = createServiceClient();

  const updateData: {
    permissao: "visualizar" | "editar";
    pode_deletar?: boolean;
  } = {
    permissao,
  };

  if (pode_deletar !== undefined) {
    updateData.pode_deletar = pode_deletar;
  }

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .update(updateData)
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Erro ao atualizar permissão de compartilhamento: ${error.message}`
    );
  }

  return data;
}

/**
 * Remove compartilhamento de um documento
 */
export async function removerCompartilhamento(
  documento_id: number,
  usuario_id: number
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_compartilhados")
    .delete()
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id);

  if (error) {
    throw new Error(`Erro ao remover compartilhamento: ${error.message}`);
  }
}

/**
 * Lista compartilhamentos de um documento ou usuário
 */
export async function listarCompartilhamentos(
  params: ListarCompartilhamentosParams
): Promise<DocumentoCompartilhadoComUsuario[]> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos_compartilhados").select(buildCompartilhamentoWithUsersSelect());

  if (params.documento_id) {
    query = query.eq("documento_id", params.documento_id);
  }

  if (params.usuario_id) {
    query = query.eq("usuario_id", params.usuario_id);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar compartilhamentos: ${error.message}`);
  }

  return (data as unknown as DocumentoCompartilhadoComUsuario[]) ?? [];
}

/**
 * Busca compartilhamento específico
 */
export async function buscarCompartilhamento(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoCompartilhado | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .select()
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar compartilhamento: ${error.message}`);
  }

  return data;
}

/**
 * Compartilha documento com múltiplos usuários
 */
export async function compartilharDocumentoComMultiplosUsuarios(
  documento_id: number,
  usuarios_ids: number[],
  permissao: "visualizar" | "editar",
  compartilhado_por: number
): Promise<DocumentoCompartilhado[]> {
  const supabase = createServiceClient();

  const compartilhamentos = usuarios_ids.map((usuario_id) => ({
    documento_id,
    usuario_id,
    permissao,
    compartilhado_por,
  }));

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .upsert(compartilhamentos, {
      onConflict: "documento_id,usuario_id",
    })
    .select();

  if (error) {
    throw new Error(
      `Erro ao compartilhar com múltiplos usuários: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Remove todos os compartilhamentos de um documento
 */
export async function removerTodosCompartilhamentos(
  documento_id: number
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_compartilhados")
    .delete()
    .eq("documento_id", documento_id);

  if (error) {
    throw new Error(
      `Erro ao remover todos os compartilhamentos: ${error.message}`
    );
  }
}

/**
 * Verifica se um usuário tem permissão específica em um documento
 */
export async function verificarPermissaoCompartilhamento(
  documento_id: number,
  usuario_id: number,
  permissao_requerida: "visualizar" | "editar"
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("documentos_compartilhados")
    .select("permissao")
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id)
    .single();

  if (!data) {
    return false;
  }

  // 'editar' inclui 'visualizar'
  if (permissao_requerida === "visualizar") {
    return true;
  }

  return data.permissao === "editar";
}

/**
 * Lista usuários com quem um documento foi compartilhado
 */
export async function listarUsuariosComAcesso(
  documento_id: number
): Promise<Array<{ usuario_id: number; permissao: "visualizar" | "editar" }>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .select("usuario_id, permissao")
    .eq("documento_id", documento_id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar usuários com acesso: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Busca compartilhamento por ID
 */
export async function buscarCompartilhamentoPorId(
  id: number
): Promise<DocumentoCompartilhado | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar compartilhamento: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza permissão de compartilhamento por ID
 */
export async function atualizarPermissaoCompartilhamentoPorId(
  id: number,
  permissao?: "visualizar" | "editar",
  pode_deletar?: boolean
): Promise<DocumentoCompartilhado> {
  const supabase = createServiceClient();

  const updateData: Partial<{
    permissao: "visualizar" | "editar";
    pode_deletar: boolean;
  }> = {};

  if (permissao) {
    updateData.permissao = permissao;
  }

  if (pode_deletar !== undefined) {
    updateData.pode_deletar = pode_deletar;
  }

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar permissão: ${error.message}`);
  }

  return data;
}

/**
 * Remove compartilhamento por ID
 */
export async function removerCompartilhamentoPorId(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_compartilhados")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao remover compartilhamento: ${error.message}`);
  }
}

// =============================================================================
// VERSOES
// =============================================================================

/**
 * Cria uma nova versão de documento
 */
export async function criarVersao(
  params: CriarVersaoParams,
  usuario_id: number
): Promise<DocumentoVersao> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_versoes")
    .insert({
      documento_id: params.documento_id,
      versao: params.versao,
      conteudo: params.conteudo,
      titulo: params.titulo,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar versão: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma versão específica por ID
 */
export async function buscarVersaoPorId(
  id: number
): Promise<DocumentoVersao | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_versoes")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar versão: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma versão específica por documento e número da versão
 */
export async function buscarVersaoPorNumero(
  documento_id: number,
  versao: number
): Promise<DocumentoVersao | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_versoes")
    .select()
    .eq("documento_id", documento_id)
    .eq("versao", versao)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar versão por número: ${error.message}`);
  }

  return data;
}

/**
 * Lista versões de um documento
 */
export async function listarVersoes(
  params: ListarVersoesParams
): Promise<{ versoes: DocumentoVersaoComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from("documentos_versoes")
    .select(buildVersaoWithCreatorSelect(), { count: "exact" })
    .eq("documento_id", params.documento_id);

  // Ordenação (mais recente primeiro)
  query = query.order("versao", { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar versões: ${error.message}`);
  }

  return {
    versoes: (data as unknown as DocumentoVersaoComUsuario[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Busca a versão mais recente de um documento
 */
export async function buscarVersaoMaisRecente(
  documento_id: number
): Promise<DocumentoVersao | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_versoes")
    .select()
    .eq("documento_id", documento_id)
    .order("versao", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar versão mais recente: ${error.message}`);
  }

  return data;
}

/**
 * Conta total de versões de um documento
 */
export async function contarVersoes(documento_id: number): Promise<number> {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from("documentos_versoes")
    .select("id", { count: "exact", head: true })
    .eq("documento_id", documento_id);

  if (error) {
    throw new Error(`Erro ao contar versões: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Deleta uma versão específica
 */
export async function deletarVersao(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_versoes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar versão: ${error.message}`);
  }
}

/**
 * Deleta todas as versões de um documento
 */
export async function deletarTodasVersoes(documento_id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_versoes")
    .delete()
    .eq("documento_id", documento_id);

  if (error) {
    throw new Error(`Erro ao deletar todas as versões: ${error.message}`);
  }
}

/**
 * Restaura uma versão anterior (cria nova versão com conteúdo antigo)
 */
export async function restaurarVersao(
  documento_id: number,
  versao_numero: number,
  usuario_id: number
): Promise<{ nova_versao: DocumentoVersao; documento_atualizado: boolean }> {
  const supabase = createServiceClient();

  // Buscar versão a ser restaurada
  const versaoAntiga = await buscarVersaoPorNumero(documento_id, versao_numero);
  if (!versaoAntiga) {
    throw new Error(`Versão ${versao_numero} não encontrada`);
  }

  // Buscar versão atual do documento
  const { data: documentoAtual } = await supabase
    .from("documentos")
    .select("versao, titulo")
    .eq("id", documento_id)
    .single();

  if (!documentoAtual) {
    throw new Error("Documento não encontrado");
  }

  const novaVersaoNumero = documentoAtual.versao + 1;

  // Criar nova versão com conteúdo da versão antiga
  const novaVersao = await criarVersao(
    {
      documento_id,
      versao: novaVersaoNumero,
      conteudo: versaoAntiga.conteudo,
      titulo: versaoAntiga.titulo,
    },
    usuario_id
  );

  // Atualizar documento principal
  const { error: updateError } = await supabase
    .from("documentos")
    .update({
      conteudo: versaoAntiga.conteudo,
      titulo: versaoAntiga.titulo,
      versao: novaVersaoNumero,
      editado_por: usuario_id,
      editado_em: new Date().toISOString(),
    })
    .eq("id", documento_id);

  if (updateError) {
    throw new Error(`Erro ao atualizar documento: ${updateError.message}`);
  }

  return {
    nova_versao: novaVersao,
    documento_atualizado: true,
  };
}

/**
 * Compara duas versões de um documento
 */
export async function compararVersoes(
  documento_id: number,
  versao_a: number,
  versao_b: number
): Promise<{
  versao_a: DocumentoVersao;
  versao_b: DocumentoVersao;
}> {
  const [versaoA, versaoB] = await Promise.all([
    buscarVersaoPorNumero(documento_id, versao_a),
    buscarVersaoPorNumero(documento_id, versao_b),
  ]);

  if (!versaoA) {
    throw new Error(`Versão ${versao_a} não encontrada`);
  }

  if (!versaoB) {
    throw new Error(`Versão ${versao_b} não encontrada`);
  }

  return {
    versao_a: versaoA,
    versao_b: versaoB,
  };
}

/**
 * Lista versões criadas por um usuário específico
 */
export async function listarVersoesPorUsuario(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoVersaoComUsuario[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_versoes")
    .select(buildVersaoWithCreatorSelect())
    .eq("documento_id", documento_id)
    .eq("criado_por", usuario_id)
    .order("versao", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar versões por usuário: ${error.message}`);
  }

  return (data as unknown as DocumentoVersaoComUsuario[]) ?? [];
}

/**
 * Busca versões em um intervalo de datas
 */
export async function listarVersoesIntervalo(
  documento_id: number,
  data_inicio: string,
  data_fim: string
): Promise<DocumentoVersaoComUsuario[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_versoes")
    .select(buildVersaoWithCreatorSelect())
    .eq("documento_id", documento_id)
    .gte("created_at", data_inicio)
    .lte("created_at", data_fim)
    .order("versao", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar versões por intervalo: ${error.message}`);
  }

  return (data as unknown as DocumentoVersaoComUsuario[]) ?? [];
}

/**
 * Limpa versões antigas mantendo apenas as N mais recentes
 */
export async function limparVersoesAntigas(
  documento_id: number,
  manter_ultimas_n = 10
): Promise<number> {
  const supabase = createServiceClient();

  // Buscar IDs das versões a manter
  const { data: versoesRecentes } = await supabase
    .from("documentos_versoes")
    .select("id")
    .eq("documento_id", documento_id)
    .order("versao", { ascending: false })
    .limit(manter_ultimas_n);

  if (!versoesRecentes || versoesRecentes.length === 0) {
    return 0;
  }

  const idsParaManter = versoesRecentes.map((v) => v.id);

  // Deletar versões não mantidas
  const { count, error } = await supabase
    .from("documentos_versoes")
    .delete({ count: "exact" })
    .eq("documento_id", documento_id)
    .not("id", "in", `(${idsParaManter.join(",")})`);

  if (error) {
    throw new Error(`Erro ao limpar versões antigas: ${error.message}`);
  }

  return count ?? 0;
}

// =============================================================================
// UPLOADS
// =============================================================================

/**
 * Registra um novo upload no banco de dados
 */
export async function registrarUpload(
  params: UploadArquivoParams,
  usuario_id: number
): Promise<DocumentoUpload> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .insert({
      documento_id: params.documento_id,
      nome_arquivo: params.nome_arquivo,
      tipo_mime: params.tipo_mime,
      tamanho_bytes: params.tamanho_bytes,
      b2_key: params.b2_key,
      b2_url: params.b2_url,
      tipo_media: params.tipo_media,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao registrar upload: ${error.message}`);
  }

  return data;
}

/**
 * Busca um upload por ID
 */
export async function buscarUploadPorId(
  id: number
): Promise<DocumentoUpload | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar upload: ${error.message}`);
  }

  return data;
}

/**
 * Busca um upload por B2 key
 */
export async function buscarUploadPorB2Key(
  b2_key: string
): Promise<DocumentoUpload | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("b2_key", b2_key)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar upload por B2 key: ${error.message}`);
  }

  return data;
}

/**
 * Lista uploads com filtros
 */
export async function listarUploads(
  params: ListarUploadsParams
): Promise<{ uploads: DocumentoUploadComInfo[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos_uploads").select(
    buildUploadWithInfoSelect(),
    { count: "exact" }
  );

  // Filtro: documento_id
  if (params.documento_id) {
    query = query.eq("documento_id", params.documento_id);
  }

  // Filtro: tipo_media
  if (params.tipo_media) {
    query = query.eq("tipo_media", params.tipo_media);
  }

  // Ordenação
  query = query.order("created_at", { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar uploads: ${error.message}`);
  }

  return {
    uploads: (data as unknown as DocumentoUploadComInfo[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Lista todos os uploads de um documento
 */
export async function listarUploadsPorDocumento(
  documento_id: number
): Promise<DocumentoUpload[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("documento_id", documento_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar uploads do documento: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Deleta um upload do banco e retorna informações para deletar do B2
 */
export async function deletarUpload(
  id: number
): Promise<{ b2_key: string; b2_url: string }> {
  const supabase = createServiceClient();

  // Buscar informações antes de deletar
  const upload = await buscarUploadPorId(id);
  if (!upload) {
    throw new Error("Upload não encontrado");
  }

  // Deletar do banco
  const { error } = await supabase
    .from("documentos_uploads")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar upload: ${error.message}`);
  }

  return {
    b2_key: upload.b2_key,
    b2_url: upload.b2_url,
  };
}

/**
 * Calcula tamanho total de uploads de um documento
 */
export async function calcularTamanhoTotalUploads(
  documento_id: number
): Promise<number> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select("tamanho_bytes")
    .eq("documento_id", documento_id);

  if (error) {
    throw new Error(`Erro ao calcular tamanho total: ${error.message}`);
  }

  const total = (data ?? []).reduce(
    (sum, upload) => sum + upload.tamanho_bytes,
    0
  );
  return total;
}

/**
 * Lista uploads por tipo de mídia
 */
export async function listarUploadsPorTipoMedia(
  documento_id: number,
  tipo_media: "imagem" | "video" | "audio" | "pdf" | "outros"
): Promise<DocumentoUpload[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("documento_id", documento_id)
    .eq("tipo_media", tipo_media)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar uploads por tipo: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Verifica se um arquivo já foi enviado (por B2 key)
 */
export async function verificarUploadExistente(
  b2_key: string
): Promise<boolean> {
  const upload = await buscarUploadPorB2Key(b2_key);
  return upload !== null;
}

/**
 * Atualiza URL do B2 (útil se a URL mudar)
 */
export async function atualizarUrlB2(
  id: number,
  nova_url: string
): Promise<DocumentoUpload> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .update({ b2_url: nova_url })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar URL do B2: ${error.message}`);
  }

  return data;
}

/**
 * Lista uploads recentes (últimos N uploads)
 */
export async function listarUploadsRecentes(
  limite = 10,
  usuario_id?: number
): Promise<DocumentoUploadComInfo[]> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos_uploads").select(buildUploadWithInfoSelect());

  if (usuario_id) {
    query = query.eq("criado_por", usuario_id);
  }

  query = query.order("created_at", { ascending: false }).limit(limite);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar uploads recentes: ${error.message}`);
  }

  return (data as unknown as DocumentoUploadComInfo[]) ?? [];
}

/**
 * Calcula estatísticas de uploads de um usuário
 */
export async function calcularEstatisticasUploads(usuario_id: number): Promise<{
  total_arquivos: number;
  tamanho_total_bytes: number;
  por_tipo: Record<string, { count: number; tamanho_bytes: number }>;
}> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select("tipo_media, tamanho_bytes")
    .eq("criado_por", usuario_id);

  if (error) {
    throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
  }

  const uploads = data ?? [];

  const estatisticas = {
    total_arquivos: uploads.length,
    tamanho_total_bytes: uploads.reduce((sum, u) => sum + u.tamanho_bytes, 0),
    por_tipo: {} as Record<string, { count: number; tamanho_bytes: number }>,
  };

  uploads.forEach((upload) => {
    if (!estatisticas.por_tipo[upload.tipo_media]) {
      estatisticas.por_tipo[upload.tipo_media] = { count: 0, tamanho_bytes: 0 };
    }
    estatisticas.por_tipo[upload.tipo_media].count++;
    estatisticas.por_tipo[upload.tipo_media].tamanho_bytes +=
      upload.tamanho_bytes;
  });

  return estatisticas;
}

// =============================================================================
// ARQUIVOS
// =============================================================================

/**
 * Cria um novo arquivo genérico no banco de dados
 */
export async function criarArquivo(
  params: CriarArquivoParams,
  usuario_id: number
): Promise<Arquivo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .insert({
      nome: params.nome,
      tipo_mime: params.tipo_mime,
      tamanho_bytes: params.tamanho_bytes,
      pasta_id: params.pasta_id ?? null,
      b2_key: params.b2_key,
      b2_url: params.b2_url,
      tipo_media: params.tipo_media,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Busca um arquivo por ID
 */
export async function buscarArquivoPorId(id: number): Promise<Arquivo | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Busca um arquivo com informações do criador
 */
export async function buscarArquivoComUsuario(
  id: number
): Promise<ArquivoComUsuario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .select(buildArquivoWithCreatorSelect())
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar arquivo: ${error.message}`);
  }

  return data as unknown as ArquivoComUsuario;
}

/**
 * Lista arquivos genéricos com filtros
 */
export async function listarArquivos(
  params: ListarArquivosParams
): Promise<{ arquivos: ArquivoComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase.from("arquivos").select(
    buildArquivoWithCreatorSelect(),
    { count: "exact" }
  );

  // Filtro: deleted_at
  if (!params.incluir_deletados) {
    query = query.is("deleted_at", null);
  }

  // Filtro: pasta_id
  if (params.pasta_id !== undefined) {
    if (params.pasta_id === null) {
      query = query.is("pasta_id", null);
    } else {
      query = query.eq("pasta_id", params.pasta_id);
    }
  }

  // Filtro: busca
  if (params.busca) {
    query = query.ilike("nome", `%${params.busca}%`);
  }

  // Filtro: tipo_media
  if (params.tipo_media) {
    query = query.eq("tipo_media", params.tipo_media);
  }

  // Filtro: criado_por
  if (params.criado_por) {
    query = query.eq("criado_por", params.criado_por);
  }

  // Ordenação e paginação
  query = query
    .order("created_at", { ascending: false })
    .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar arquivos: ${error.message}`);
  }

  return {
    arquivos: (data as unknown as ArquivoComUsuario[]) || [],
    total: count || 0,
  };
}

/**
 * Atualiza um arquivo existente
 */
export async function atualizarArquivo(
  id: number,
  params: AtualizarArquivoParams
): Promise<Arquivo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete de um arquivo
 */
export async function deletarArquivo(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("arquivos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`);
  }
}

/**
 * Restaura um arquivo deletado
 */
export async function restaurarArquivo(id: number): Promise<Arquivo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Lista itens unificados (pastas, documentos e arquivos) para o FileManager
 */
export async function listarItensUnificados(
  params: ListarArquivosParams
): Promise<{ itens: ItemDocumento[]; total: number }> {
  // Buscar documentos Plate.js
  const { documentos, total: totalDocs } = await listarDocumentos({
    pasta_id: params.pasta_id,
    busca: params.busca,
    criado_por: params.criado_por,
    limit: params.limit,
    offset: params.offset,
  });

  // Buscar arquivos genéricos
  const { arquivos, total: totalArquivos } = await listarArquivos(params);

  // Buscar pastas se estiver na raiz ou pasta específica
  const pastas = await listarPastasComContadores(
    params.pasta_id,
    params.criado_por
  );

  // Unificar resultados
  const itens: ItemDocumento[] = [
    ...pastas.map((p) => ({ tipo: "pasta" as const, dados: p })),
    ...documentos.map((d) => ({ tipo: "documento" as const, dados: d })),
    ...arquivos.map((a) => ({ tipo: "arquivo" as const, dados: a })),
  ];

  return { itens, total: totalDocs + totalArquivos + pastas.length };
}
