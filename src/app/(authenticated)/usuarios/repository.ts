import { createServiceClient } from "@/lib/supabase/service-client";
import {
  getCached,
  setCached,
  deleteCached,
  getUsuariosListKey,
  invalidateUsuariosCache,
  getCargosListKey,
} from "@/lib/redis";
import {
  Usuario,
  UsuarioDados,
  ListarUsuariosParams,
  ListarUsuariosResult,
  GeneroUsuario,
  Endereco,
} from "./domain";
import { normalizarCpf } from "./utils";
import {
  getUsuarioColumnsWithCargo,
} from "./domain";

// =============================================================================
// RE-EXPORTS — Repositórios especializados
// =============================================================================
export {
  buscarEstatisticasAtividades,
  buscarProcessosAtribuidos,
  buscarAudienciasAtribuidas,
  buscarPendentesAtribuidos,
  buscarContratosAtribuidos,
} from "./repository-atividades";
export type { AtividadeEstatisticas } from "./repository-atividades";

export {
  buscarAtividadesUsuario,
  contarAtividadesUsuario,
} from "./repository-audit-atividades";
export type { AtividadeLog } from "./repository-audit-atividades";

export {
  buscarAuthLogsPorUsuario,
} from "./repository-auth-logs";
export type { AuthLogEntry } from "./repository-auth-logs";

// Conversores
/**
 * Normaliza uma string de data para o formato YYYY-MM-DD sem criar objetos Date.
 * Evita problemas de timezone que ocorrem ao converter string→Date→string.
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const trimmed = dateString.trim();

  // Já está no formato ISO date-only (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    if (isValidDateParts(+y, +m, +d)) return `${y}-${m}-${d}`;
    return null;
  }

  // Formato ISO com time component (YYYY-MM-DDTHH:mm:ss...) — extrai apenas a data UTC
  const isoFullMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoFullMatch) {
    const [, y, m, d] = isoFullMatch;
    if (isValidDateParts(+y, +m, +d)) return `${y}-${m}-${d}`;
    return null;
  }

  // Formato BR (DD/MM/YYYY)
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    if (isValidDateParts(+y, +m, +d)) return `${y}-${m}-${d}`;
    return null;
  }

  return null;
}

/** Valida se dia/mês/ano formam uma data válida sem criar Date objects */
function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || year < 1) return false;
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) daysInMonth[2] = 29;
  return day <= daysInMonth[month];
}

function converterParaUsuario(data: Record<string, unknown>): Usuario {
  const cargos = data.cargos as Record<string, unknown> | undefined;
  return {
    id: data.id as number,
    authUserId: (data.auth_user_id as string | null) ?? null,
    nomeCompleto: data.nome_completo as string,
    nomeExibicao: data.nome_exibicao as string,
    cpf: data.cpf as string,
    rg: (data.rg as string | null) ?? null,
    dataNascimento: (data.data_nascimento as string | null) ?? null,
    genero: (data.genero as GeneroUsuario | null) ?? null,
    oab: (data.oab as string | null) ?? null,
    ufOab: (data.uf_oab as string | null) ?? null,
    emailPessoal: (data.email_pessoal as string | null) ?? null,
    emailCorporativo: data.email_corporativo as string,
    telefone: (data.telefone as string | null) ?? null,
    ramal: (data.ramal as string | null) ?? null,
    endereco: (data.endereco as Endereco | null) ?? null,
    cargoId: (data.cargo_id as number | null) ?? null,
    cargo: cargos
      ? {
        id: cargos.id as number,
        nome: cargos.nome as string,
        descricao: (cargos.descricao as string | null) ?? null,
      }
      : undefined,
    avatarUrl: (data.avatar_url as string | null) ?? null,
    coverUrl: (data.cover_url as string | null) ?? null,
    isSuperAdmin: (data.is_super_admin as boolean) ?? false,
    ativo: data.ativo as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

export const usuarioRepository = {
  async findById(id: number): Promise<Usuario | null> {
    const cacheKey = `usuarios:id:${id}`;
    const cached = await getCached<Usuario>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select(getUsuarioColumnsWithCargo())
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }

    if (!data) return null;
    const usuario = converterParaUsuario(data as unknown as Record<string, unknown>);
    await setCached(cacheKey, usuario, 1800);
    return usuario;
  },

  async findByIds(ids: number[]): Promise<Usuario[]> {
    if (!ids.length) return [];

    // Sort and unique to create stable cache key or just fetch from DB
    const uniqueIds = [...new Set(ids)].sort((a, b) => a - b);

    // For now, let's just fetch from DB to ensure consistency,
    // or implement multi-get if redis supports it (it does, but getCached is single)
    // We can optimization later.

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select(getUsuarioColumnsWithCargo())
      .in("id", uniqueIds);

    if (error) {
      throw new Error(`Erro ao buscar usuários por IDs: ${error.message}`);
    }

    return (data || []).map((item) => converterParaUsuario(item as unknown as Record<string, unknown>));
  },

  async findByCpf(cpf: string): Promise<Usuario | null> {
    const cpfNormalizado = normalizarCpf(cpf);
    const cacheKey = `usuarios:cpf:${cpfNormalizado}`;
    const cached = await getCached<Usuario>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select(getUsuarioColumnsWithCargo())
      .eq("cpf", cpfNormalizado)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Erro ao buscar usuário por CPF: ${error.message}`);
    }

    if (!data) return null;
    const usuario = converterParaUsuario(data as unknown as Record<string, unknown>);
    await setCached(cacheKey, usuario, 1800);
    return usuario;
  },

  async findByEmail(email: string): Promise<Usuario | null> {
    const emailLower = email.trim().toLowerCase();
    const cacheKey = `usuarios:email:${emailLower}`;
    const cached = await getCached<Usuario>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select(getUsuarioColumnsWithCargo())
      .eq("email_corporativo", emailLower)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Erro ao buscar usuário por e-mail: ${error.message}`);
    }

    if (!data) return null;
    const usuario = converterParaUsuario(data as unknown as Record<string, unknown>);
    await setCached(cacheKey, usuario, 1800);
    return usuario;
  },

  async findAll(
    params: ListarUsuariosParams = {}
  ): Promise<ListarUsuariosResult> {
    const cacheKey = getUsuariosListKey(params);
    const cached = await getCached<ListarUsuariosResult>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    // Detectar se deve buscar sem paginação
    const semPaginacao = params.pagina === undefined && params.limite === undefined;

    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = semPaginacao ? 0 : (pagina - 1) * limite;

    let query = supabase
      .from("usuarios")
      .select(getUsuarioColumnsWithCargo(), {
        count: "exact",
      });

    if (params.busca) {
      const busca = params.busca.trim();
      query = query.or(
        `nome_completo.ilike.%${busca}%,nome_exibicao.ilike.%${busca}%,cpf.ilike.%${busca}%,email_corporativo.ilike.%${busca}%`
      );
    }

    if (params.ativo !== undefined) {
      query = query.eq("ativo", params.ativo);
    }

    if (params.oab) {
      query = query.eq("oab", params.oab.trim());
    }

    if (params.ufOab) {
      query = query.eq("uf_oab", params.ufOab.trim());
    }

    if (params.cargoId) {
      query = query.eq("cargo_id", params.cargoId);
    }

    if (params.isSuperAdmin !== undefined) {
      query = query.eq("is_super_admin", params.isSuperAdmin);
    }

    query = query.order("created_at", { ascending: false });

    // Aplicar range apenas se houver paginação
    if (!semPaginacao) {
      query = query.range(offset, offset + limite - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao listar usuários: ${error.message}`);

    const usuarios = (data || []).map((item) => converterParaUsuario(item as unknown as Record<string, unknown>));
    const total = count ?? usuarios.length;

    const result: ListarUsuariosResult = {
      usuarios,
      total,
      pagina: semPaginacao ? 1 : pagina,
      limite: semPaginacao ? total : limite,
      totalPaginas: semPaginacao ? 1 : Math.ceil(total / limite),
    };

    await setCached(cacheKey, result);
    return result;
  },

  async create(params: UsuarioDados): Promise<Usuario> {
    const supabase = createServiceClient();

    // Normalizações antes de salvar
    const cpfNormalizado = normalizarCpf(params.cpf);
    const emailCorporativoLower = params.emailCorporativo.trim().toLowerCase();

    // Limpar endereço vazio
    let enderecoFinal = params.endereco;
    if (enderecoFinal && Object.keys(enderecoFinal).length === 0) {
      enderecoFinal = null;
    }

    const dadosNovos = {
      auth_user_id: params.authUserId || null,
      nome_completo: params.nomeCompleto.trim(),
      nome_exibicao: params.nomeExibicao.trim(),
      cpf: cpfNormalizado,
      rg: params.rg?.trim() || null,
      data_nascimento: parseDate(params.dataNascimento),
      genero: params.genero || null,
      oab: params.oab?.trim() || null,
      uf_oab: params.ufOab?.trim() || null,
      email_pessoal: params.emailPessoal?.trim().toLowerCase() || null,
      email_corporativo: emailCorporativoLower,
      telefone: params.telefone?.trim() || null,
      ramal: params.ramal?.trim() || null,
      endereco: enderecoFinal,
      cargo_id: params.cargoId ?? null,
      is_super_admin: params.isSuperAdmin ?? false,
      ativo: params.ativo ?? true,
    };

    const { data, error } = await supabase
      .from("usuarios")
      .insert(dadosNovos)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);

    await invalidateUsuariosCache();
    // Cache individual keys? No need immediately as they are usually fetched by list first or id.

    return converterParaUsuario(data);
  },

  async update(id: number, params: Partial<UsuarioDados>): Promise<Usuario> {
    const supabase = createServiceClient();

    const dadosAtualizacao: Record<string, unknown> = {};

    if (params.nomeCompleto !== undefined)
      dadosAtualizacao.nome_completo = params.nomeCompleto.trim();
    if (params.nomeExibicao !== undefined)
      dadosAtualizacao.nome_exibicao = params.nomeExibicao.trim();
    if (params.cpf !== undefined)
      dadosAtualizacao.cpf = normalizarCpf(params.cpf);
    if (params.rg !== undefined)
      dadosAtualizacao.rg = params.rg?.trim() || null;
    if (params.dataNascimento !== undefined)
      dadosAtualizacao.data_nascimento = parseDate(params.dataNascimento);
    if (params.genero !== undefined)
      dadosAtualizacao.genero = params.genero || null;
    if (params.oab !== undefined)
      dadosAtualizacao.oab = params.oab?.trim() || null;
    if (params.ufOab !== undefined)
      dadosAtualizacao.uf_oab = params.ufOab?.trim() || null;
    if (params.emailPessoal !== undefined)
      dadosAtualizacao.email_pessoal =
        params.emailPessoal?.trim().toLowerCase() || null;
    if (params.emailCorporativo !== undefined)
      dadosAtualizacao.email_corporativo = params.emailCorporativo
        .trim()
        .toLowerCase();
    if (params.telefone !== undefined)
      dadosAtualizacao.telefone = params.telefone?.trim() || null;
    if (params.ramal !== undefined)
      dadosAtualizacao.ramal = params.ramal?.trim() || null;
    if (params.endereco !== undefined)
      dadosAtualizacao.endereco = params.endereco; // Validação de objeto vazio deve ser feita antes se necessário, mas update parcial assume valor
    if (params.avatarUrl !== undefined)
      dadosAtualizacao.avatar_url = params.avatarUrl || null;
    if (params.coverUrl !== undefined)
      dadosAtualizacao.cover_url = params.coverUrl || null;
    if (params.cargoId !== undefined)
      dadosAtualizacao.cargo_id = params.cargoId;
    if (params.authUserId !== undefined)
      dadosAtualizacao.auth_user_id = params.authUserId || null;
    if (params.isSuperAdmin !== undefined)
      dadosAtualizacao.is_super_admin = params.isSuperAdmin;
    if (params.ativo !== undefined) dadosAtualizacao.ativo = params.ativo;

    const { data, error } = await supabase
      .from("usuarios")
      .update(dadosAtualizacao)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    if (!data) throw new Error("Erro ao atualizar usuário: registro não retornado após atualização");

    await invalidateUsuariosCache();
    await deleteCached(`usuarios:id:${id}`);
    if (params.cpf)
      await deleteCached(`usuarios:cpf:${normalizarCpf(params.cpf)}`);
    if (params.emailCorporativo)
      await deleteCached(
        `usuarios:email:${params.emailCorporativo.trim().toLowerCase()}`
      );

    return converterParaUsuario(data);
  },

  // Busca cargos para dropdowns
  async listarCargos() {
    // Implementação básica para carregar cargos
    // Como não foi especificado um arquivo de repository de cargos, fazemos aqui por enquanto
    const cacheKey = getCargosListKey({});
    const cached = await getCached<Array<Record<string, unknown>>>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cargos")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) return [];

    await setCached(cacheKey, data, 3600);
    return data;
  },

  // Desativação completa com desatribuição
  async desativarComDesatribuicao(usuarioId: number, executorId: number) {
    const supabase = createServiceClient();

    // Contar antes
    const queries = [
      "acervo",
      "audiencias",
      "expedientes",
      "expedientes_manuais",
      "contratos",
    ].map((table) =>
      supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("responsavel_id", usuarioId)
    );

    const results = await Promise.all(queries);
    const contagens = {
      processos: results[0].count ?? 0,
      audiencias: results[1].count ?? 0,
      pendentes: results[2].count ?? 0,
      expedientes_manuais: results[3].count ?? 0,
      contratos: results[4].count ?? 0,
    };

    // Configurar contexto
    await supabase.rpc("set_config", {
      setting_name: "app.current_user_id",
      new_value: executorId.toString(),
      is_local: false,
    });

    // RPCs
    if (contagens.processos > 0)
      await supabase.rpc("desatribuir_todos_processos_usuario", {
        p_usuario_id: usuarioId,
      });
    if (contagens.audiencias > 0)
      await supabase.rpc("desatribuir_todas_audiencias_usuario", {
        p_usuario_id: usuarioId,
      });
    if (contagens.pendentes > 0)
      await supabase.rpc("desatribuir_todos_pendentes_usuario", {
        p_usuario_id: usuarioId,
      });
    if (contagens.expedientes_manuais > 0)
      await supabase.rpc("desatribuir_todos_expedientes_usuario", {
        p_usuario_id: usuarioId,
      });
    if (contagens.contratos > 0)
      await supabase.rpc("desatribuir_todos_contratos_usuario", {
        p_usuario_id: usuarioId,
      });

    // Update users
    const { error: errorUpdate } = await supabase
      .from("usuarios")
      .update({ ativo: false })
      .eq("id", usuarioId);
    if (errorUpdate) throw new Error(errorUpdate.message);

    await invalidateUsuariosCache();
    await deleteCached(`usuarios:id:${usuarioId}`);

    return contagens;
  },

  async buscarUsuariosAuthNaoSincronizados() {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc(
      "list_auth_users_nao_sincronizados"
    );
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getCargoById(id: number) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("cargos")
      .select("id")
      .eq("id", id)
      .single();
    return data;
  },
};

// =============================================================================
// PERMISSÕES REPOSITORY
// =============================================================================

export interface Permissao {
  recurso: string;
  operacao: string;
  permitido: boolean;
}

/**
 * Lista todas as permissões de um usuário
 */
export async function listarPermissoesUsuario(
  usuarioId: number
): Promise<Permissao[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("permissoes")
    .select("recurso, operacao, permitido")
    .eq("usuario_id", usuarioId)
    .eq("permitido", true);

  if (error) {
    throw new Error(`Erro ao listar permissões: ${error.message}`);
  }

  return (data || []).map((p) => ({
    recurso: p.recurso,
    operacao: p.operacao,
    permitido: p.permitido,
  }));
}

/**
 * Atribui múltiplas permissões a um usuário (upsert)
 */
export async function atribuirPermissoesBatch(
  usuarioId: number,
  permissoes: Permissao[],
  _executorId: number
): Promise<void> {
  const supabase = createServiceClient();

  // Preparar dados para upsert
  const dadosPermissoes = permissoes.map((p) => ({
    usuario_id: usuarioId,
    recurso: p.recurso,
    operacao: p.operacao,
    permitido: p.permitido,
  }));

  // Upsert em batch
  const { error } = await supabase.from("permissoes").upsert(dadosPermissoes, {
    onConflict: "usuario_id,recurso,operacao",
  });

  if (error) {
    throw new Error(`Erro ao atribuir permissões: ${error.message}`);
  }
}

/**
 * Substitui todas as permissões de um usuário (deleta todas e adiciona novas)
 */
export async function substituirPermissoes(
  usuarioId: number,
  permissoes: Permissao[],
  _executorId: number
): Promise<void> {
  const supabase = createServiceClient();

  // Iniciar transação: deletar todas as permissões existentes
  const { error: deleteError } = await supabase
    .from("permissoes")
    .delete()
    .eq("usuario_id", usuarioId);

  if (deleteError) {
    throw new Error(
      `Erro ao remover permissões antigas: ${deleteError.message}`
    );
  }

  // Inserir novas permissões
  if (permissoes.length > 0) {
    const dadosPermissoes = permissoes.map((p) => ({
      usuario_id: usuarioId,
      recurso: p.recurso,
      operacao: p.operacao,
      permitido: p.permitido,
    }));

    const { error: insertError } = await supabase
      .from("permissoes")
      .insert(dadosPermissoes);

    if (insertError) {
      throw new Error(
        `Erro ao inserir novas permissões: ${insertError.message}`
      );
    }
  }
}
