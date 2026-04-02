/**
 * CHAT REPOSITORY - Camada de Persistência
 *
 * Repositórios para salas, mensagens, chamadas e membros do chat.
 * Usa pattern de classes com factory functions.
 *
 * CONVENÇÕES:
 * - Classes com factory functions (createXxxRepository)
 * - Retornam Result<T, Error> via neverthrow
 * - NUNCA fazer validação de negócio aqui
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "neverthrow";
import { fromCamelToSnake, fromSnakeToCamel } from "@/lib/utils";
import type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  ChatItem,
  UsuarioChat,
  SalaChatRow,
  UsuarioChatRow,
  MensagemChatRow,
  ListarSalasParams,
  ListarMensagensParams,
  PaginatedResponse,
  Chamada,
  ChamadaComParticipantes,
  ChamadaParticipante,
  ChamadaParticipanteRow,
  ChamadaRow,
  ListarChamadasParams,
} from "./domain";
import { StatusChamada } from "./domain";

// =============================================================================
// CONVERTERS
// =============================================================================

/**
 * Converte row de sala do banco (snake_case) para domínio (camelCase)
 */
export function converterParaSalaChat(data: SalaChatRow): SalaChat {
  return fromSnakeToCamel(data) as unknown as SalaChat;
}

/**
 * Converte row de mensagem do banco (snake_case) para domínio (camelCase)
 */
export function converterParaMensagemChat(data: MensagemChatRow): MensagemChat {
  return fromSnakeToCamel(data) as unknown as MensagemChat;
}

/**
 * Converte MensagemChatRow (com usuario opcional) para MensagemComUsuario
 */
export function converterParaMensagemComUsuario(
  data: MensagemChatRow,
  currentUserId?: number
): MensagemComUsuario {
  // Extrair usuario antes de converter a mensagem
  const usuarioRow = data.usuario;

  if (!usuarioRow) {
    throw new Error("Usuário não encontrado na mensagem");
  }

  // Converter usuario
  const usuario = fromSnakeToCamel(usuarioRow) as unknown as UsuarioChat;

  // Mapear avatar_url para avatar
  if (usuarioRow.avatar_url) {
    usuario.avatar = usuarioRow.avatar_url;
  }

  // Converter mensagem usando fromSnakeToCamel
  const mensagemConvertida = fromSnakeToCamel({
    id: data.id,
    sala_id: data.sala_id,
    usuario_id: data.usuario_id,
    conteudo: data.conteudo,
    tipo: data.tipo,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
    status: data.status,
    data: data.data,
  }) as unknown as {
    id: number;
    salaId: number;
    usuarioId: number;
    conteudo: string;
    tipo: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    status?: "sent" | "forwarded" | "read";
    data?: unknown;
  };

  // Construir MensagemComUsuario garantindo todos os campos necessários
  const mensagemComUsuario: MensagemComUsuario = {
    id: mensagemConvertida.id,
    salaId: mensagemConvertida.salaId,
    usuarioId: mensagemConvertida.usuarioId,
    conteudo: mensagemConvertida.conteudo,
    tipo: mensagemConvertida.tipo as MensagemChat["tipo"],
    createdAt: mensagemConvertida.createdAt,
    updatedAt: mensagemConvertida.updatedAt,
    deletedAt: mensagemConvertida.deletedAt,
    status: mensagemConvertida.status,
    data: mensagemConvertida.data as MensagemChat["data"],
    usuario,
    ownMessage: currentUserId ? data.usuario_id === currentUserId : false,
  };

  return mensagemComUsuario;
}

/**
 * Converte row de chamada do banco (snake_case) para domínio (camelCase)
 */
export function converterParaChamada(data: ChamadaRow): Chamada {
  return fromSnakeToCamel(data) as unknown as Chamada;
}

/**
 * Converte row de participante de chamada do banco (snake_case) para domínio (camelCase)
 */
export function converterParaChamadaParticipante(data: ChamadaParticipanteRow): ChamadaParticipante {
  return fromSnakeToCamel(data) as unknown as ChamadaParticipante;
}

// =============================================================================
// ROOMS REPOSITORY
// =============================================================================

/**
 * Repository para operações de persistência de salas
 */
export class RoomsRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Busca uma sala por ID
   */
  async findSalaById(id: number): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("salas_chat")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return err(new Error("Erro ao buscar sala de chat."));
      }

      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao buscar sala."));
    }
  }

  /**
   * Busca a Sala Geral do sistema
   */
  async findSalaGeral(): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("salas_chat")
        .select("*")
        .eq("tipo", "geral")
        .eq("nome", "Sala Geral")
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return err(new Error("Erro ao buscar Sala Geral."));
      }

      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao buscar Sala Geral."));
    }
  }

  /**
   * Lista salas do usuário com paginação e dados expandidos.
   * Combina duas fontes para garantir que salas privadas apareçam:
   * 1. membros_sala_chat (para grupos e salas com membership ativa)
   * 2. salas_chat.criado_por/participante_id (para salas privadas, como fallback)
   */
  async findSalasByUsuario(
    usuarioId: number,
    params: ListarSalasParams
  ): Promise<Result<PaginatedResponse<ChatItem>, Error>> {
    try {
      // Buscar IDs de salas por duas vias em paralelo
      const [membrosResult, privateSalasResult, inactiveMembrosResult] = await Promise.all([
        // Via 1: Memberships ativas
        this.supabase
          .from("membros_sala_chat")
          .select("sala_id")
          .eq("usuario_id", usuarioId)
          .eq("is_active", true),
        // Via 2: Salas privadas onde o usuário é criador ou participante
        this.supabase
          .from("salas_chat")
          .select("id")
          .eq("tipo", "privado")
          .or(`criado_por.eq.${usuarioId},participante_id.eq.${usuarioId}`),
        // Via 3: Salas soft-deleted pelo usuário (para excluí-las)
        this.supabase
          .from("membros_sala_chat")
          .select("sala_id")
          .eq("usuario_id", usuarioId)
          .eq("is_active", false),
      ]);

      if (membrosResult.error) {
        console.error("Erro ao buscar membros:", membrosResult.error);
        return err(new Error("Erro ao buscar conversas."));
      }

      const memberSalaIds = membrosResult.data?.map((m) => m.sala_id) || [];
      const privateSalaIds = privateSalasResult.data?.map((s) => s.id) || [];
      const softDeletedIds = new Set(inactiveMembrosResult.data?.map((m) => m.sala_id) || []);

      // Combinar e remover duplicatas, excluindo salas soft-deleted
      const salasAtivasIds = [
        ...new Set([...memberSalaIds, ...privateSalaIds]),
      ].filter((id) => !softDeletedIds.has(id));

      // Se não há salas ativas, retornar lista vazia
      if (salasAtivasIds.length === 0) {
        return ok({
          data: [],
          pagination: {
            currentPage: 1,
            pageSize: params.limite || 50,
            totalCount: 0,
            totalPages: 1,
          },
        });
      }

      // Query para buscar detalhes das salas ativas
      let query = this.supabase
        .from("salas_chat")
        .select(
          `
          *,
          last_message:mensagens_chat(
            conteudo,
            created_at,
            tipo
          ),
          criador:usuarios!salas_chat_criado_por_fkey(
            id, nome_completo, nome_exibicao, email_corporativo,
            avatar_url, online_status, last_seen
          ),
          participante:usuarios!salas_chat_participante_id_fkey(
            id, nome_completo, nome_exibicao, email_corporativo,
            avatar_url, online_status, last_seen
          )
        `,
          { count: "exact" }
        )
        // Filtrar apenas salas onde o usuário é membro ativo
        .in("id", salasAtivasIds);

      if (params.tipo) query = query.eq("tipo", params.tipo);
      if (params.documentoId)
        query = query.eq("documento_id", params.documentoId);

      // Filtro de arquivadas
      if (params.arquivadas !== undefined) {
        query = query.eq("is_archive", params.arquivadas);
      } else {
        // Por padrão não mostra arquivadas
        query = query.eq("is_archive", false);
      }

      const limite = params.limite || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limite - 1);

      // Ordenação: idealmente pela data da última mensagem, mas isso é complexo em SQL simples.
      // Vou ordenar por updated_at da sala.
      query = query.order("updated_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error(
          "Erro findSalasByUsuario:",
          JSON.stringify(error, null, 2)
        );
        return err(
          new Error(`Erro ao listar salas: ${error.message || "Unknown error"}`)
        );
      }

      // Processar dados para formato ChatItem
      const chatItems: ChatItem[] = data.map((row: SalaChatRow) => {
        const sala = converterParaSalaChat(row);
        const lastMsg = row.last_message?.[0]; // Supabase retorna array para relação 1:N

        // Determinar o "outro" usuário para exibir info
        let displayUser: UsuarioChatRow | null = null;
        if (sala.tipo === "privado") {
          if (row.criado_por === usuarioId) {
            displayUser = row.participante ?? null;
          } else {
            displayUser = row.criador ?? null;
          }
        } else {
          // Para grupos ou geral, pode mostrar criador ou null
          displayUser = row.criador ?? null; // Ex: admin do grupo
        }

        // Mapear usuario do DB para UsuarioChat
        const usuario: UsuarioChat | undefined = displayUser
          ? {
              id: displayUser.id,
              nomeCompleto: displayUser.nome_completo,
              nomeExibicao: displayUser.nome_exibicao,
              emailCorporativo: displayUser.email_corporativo,
              avatar: displayUser.avatar_url,
              email: displayUser.email_corporativo ?? undefined,
              onlineStatus:
                (displayUser.online_status as "online" | "away" | "offline") ||
                "offline",
              lastSeen: displayUser.last_seen ?? undefined,
            }
          : undefined;

        // Formatar ChatItem
        return {
          ...sala,
          name:
            sala.tipo === "privado" && usuario
              ? usuario.nomeExibicao || usuario.nomeCompleto
              : sala.nome,
          image:
            sala.tipo === "privado" && usuario ? usuario.avatar : undefined, // TODO: imagem do grupo se tiver
          lastMessage: lastMsg?.conteudo || "",
          date: lastMsg?.created_at || sala.updatedAt,
          usuario: usuario,
          isArchive: row.is_archive || false,
        };
      });

      return ok({
        data: chatItems,
        pagination: {
          currentPage: Math.floor(offset / limite) + 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: count ? Math.ceil(count / limite) : 1,
        },
      });
    } catch (e) {
      console.error(e);
      return err(new Error("Erro inesperado ao listar salas."));
    }
  }

  /**
   * Cria uma nova sala
   */
  async saveSala(input: Partial<SalaChat>): Promise<Result<SalaChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from("salas_chat")
        .insert(snakeInput)
        .select()
        .single();

      if (error) return err(new Error("Erro ao criar sala."));
      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao criar sala."));
    }
  }

  /**
   * Atualiza uma sala existente
   */
  async updateSala(
    id: number,
    input: Partial<SalaChat>
  ): Promise<Result<SalaChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from("salas_chat")
        .update(snakeInput)
        .eq("id", id)
        .select()
        .single();

      if (error) return err(new Error("Erro ao atualizar sala."));
      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao atualizar sala."));
    }
  }

  /**
   * Arquiva uma sala
   */
  async archiveSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("salas_chat")
        .update({ is_archive: true })
        .eq("id", id);

      if (error) return err(new Error("Erro ao arquivar sala."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao arquivar sala."));
    }
  }

  /**
   * Desarquiva uma sala
   */
  async unarchiveSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("salas_chat")
        .update({ is_archive: false })
        .eq("id", id);

      if (error) return err(new Error("Erro ao desarquivar sala."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao desarquivar sala."));
    }
  }

  /**
   * Lista salas arquivadas
   */
  async findArchivedSalas(
    usuarioId: number
  ): Promise<Result<SalaChat[], Error>> {
    // Reutiliza findSalasByUsuario com filtro arquivadas=true
    const result = await this.findSalasByUsuario(usuarioId, {
      arquivadas: true,
      limite: 100,
    });
    if (result.isOk()) {
      return ok(result.value.data);
    }
    return err(result.error);
  }

  /**
   * Deleta uma sala (hard delete - use apenas para admin ou cleanup)
   */
  async deleteSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("salas_chat")
        .delete()
        .eq("id", id);

      if (error) return err(new Error("Erro ao deletar sala."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao deletar sala."));
    }
  }

  /**
   * Busca sala privada existente entre dois usuários
   */
  async findPrivateSalaBetweenUsers(
    criadorId: number,
    participanteId: number
  ): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("salas_chat")
        .select("*")
        .eq("tipo", "privado")
        .or(
          `and(criado_por.eq.${criadorId},participante_id.eq.${participanteId}),` +
            `and(criado_por.eq.${participanteId},participante_id.eq.${criadorId})`
        )
        .maybeSingle();

      if (error) {
        return err(new Error("Erro ao buscar sala privada existente."));
      }

      return ok(data ? converterParaSalaChat(data) : null);
    } catch {
      return err(new Error("Erro inesperado ao buscar sala privada."));
    }
  }
}

/**
 * Cria uma instância do RoomsRepository com cliente Supabase
 */
export async function createRoomsRepository(): Promise<RoomsRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new RoomsRepository(supabase);
}

// =============================================================================
// MESSAGES REPOSITORY
// =============================================================================

/**
 * Repository para operações de persistência de mensagens
 */
export class MessagesRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lista mensagens de uma sala com paginação e dados completos
   */
  async findMensagensBySala(
    params: ListarMensagensParams,
    currentUserId?: number
  ): Promise<Result<PaginatedResponse<MensagemComUsuario>, Error>> {
    try {
      let query = this.supabase
        .from("mensagens_chat")
        .select(
          `
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo,
            avatar_url
          )
        `,
          { count: "exact" }
        )
        .eq("sala_id", params.salaId)
        .is("deleted_at", null);

      if (params.antesDe) {
        query = query.lt("created_at", params.antesDe);
      }

      const limite = params.limite || 50;
      query = query.order("created_at", { ascending: true }).limit(limite);

      const { data, error, count } = await query;

      if (error) return err(new Error("Erro ao buscar mensagens."));

      const mensagens = (data as MensagemChatRow[]).map((msg) => {
        return converterParaMensagemComUsuario(msg, currentUserId);
      });

      return ok({
        data: mensagens,
        pagination: {
          currentPage: 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: 1,
        },
      });
    } catch {
      return err(new Error("Erro inesperado ao buscar mensagens."));
    }
  }

  /**
   * Busca últimas N mensagens de uma sala (ordem cronológica)
   */
  async findUltimasMensagens(
    salaId: number,
    limite: number,
    currentUserId?: number
  ): Promise<Result<MensagemComUsuario[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from("mensagens_chat")
        .select(
          `
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo,
            avatar_url
          )
        `
        )
        .eq("sala_id", salaId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) return err(new Error("Erro ao buscar últimas mensagens."));

      const mensagens = (data as MensagemChatRow[])
        .map((msg) => {
          return converterParaMensagemComUsuario(msg, currentUserId);
        })
        .reverse();

      return ok(mensagens);
    } catch {
      return err(new Error("Erro inesperado ao buscar últimas mensagens."));
    }
  }

  /**
   * Salva uma nova mensagem
   */
  async saveMensagem(
    input: Partial<MensagemChat>
  ): Promise<Result<MensagemChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);

      // Garantir status inicial
      if (!snakeInput.status) {
        snakeInput.status = "sent";
      }

      const { data, error } = await this.supabase
        .from("mensagens_chat")
        .insert(snakeInput)
        .select()
        .single();

      if (error) {
        console.error("Erro saveMensagem:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return err(new Error(`Erro ao salvar mensagem: ${error.message}`));
      }
      return ok(converterParaMensagemChat(data));
    } catch (e) {
      console.error(e);
      return err(new Error("Erro inesperado ao salvar mensagem."));
    }
  }

  /**
   * Atualiza status da mensagem
   */
  async updateMessageStatus(
    id: number,
    status: "sent" | "forwarded" | "read"
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("mensagens_chat")
        .update({ status })
        .eq("id", id);

      if (error)
        return err(new Error("Erro ao atualizar status da mensagem."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao atualizar status."));
    }
  }

  /**
   * Soft delete de uma mensagem
   */
  async softDeleteMensagem(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("mensagens_chat")
        .update({
          deleted_at: new Date().toISOString(),
          conteudo: "[Mensagem deletada]",
        })
        .eq("id", id)
        .is("deleted_at", null);

      if (error) return err(new Error("Erro ao deletar mensagem."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao deletar mensagem."));
    }
  }
}

/**
 * Cria uma instância do MessagesRepository com cliente Supabase
 */
export async function createMessagesRepository(): Promise<MessagesRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new MessagesRepository(supabase);
}

// =============================================================================
// CALLS REPOSITORY
// =============================================================================

/**
 * Repository para operações de persistência de chamadas
 */
export class CallsRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Salva nova chamada
   */
  async saveChamada(input: Partial<Chamada>): Promise<Result<Chamada, Error>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const snakeInput = fromCamelToSnake(input) as any;
      const meetingIdValue = snakeInput.meeting_id as string;

      // INSERT sem RETURNING para evitar conflito com SELECT RLS policy
      const { error: insertError } = await this.supabase
        .from("chamadas")
        .insert(snakeInput);

      if (insertError) {
        console.error("Erro saveChamada INSERT:", JSON.stringify({
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        }, null, 2));
        return err(
          new Error(
            `Erro ao criar chamada: ${insertError.message || "Erro desconhecido"}`
          )
        );
      }

      // Buscar a row inserida pelo meeting_id (unique index)
      const { data, error: selectError } = await this.supabase
        .from("chamadas")
        .select()
        .eq("meeting_id", meetingIdValue)
        .single();

      if (selectError) {
        return err(new Error(`Chamada criada mas erro ao recuperar: ${selectError.message}`));
      }

      return ok(converterParaChamada(data));
    } catch {
      return err(new Error("Erro inesperado ao criar chamada."));
    }
  }

  /**
   * Busca chamada por ID com participantes
   */
  async findChamadaById(
    id: number
  ): Promise<Result<ChamadaComParticipantes | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("chamadas")
        .select(
          `
          *,
          participantes:chamadas_participantes(*),
          iniciador:usuarios!chamadas_iniciado_por_fkey(
            id, nome_completo, nome_exibicao, email_corporativo, avatar_url
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return err(new Error("Erro ao buscar chamada."));
      }

      const chamada = converterParaChamada(data);
      const participantes = (
        data.participantes as ChamadaParticipanteRow[]
      ).map(converterParaChamadaParticipante);

      const iniciador = data.iniciador
        ? ({
            id: data.iniciador.id,
            nomeCompleto: data.iniciador.nome_completo,
            nomeExibicao: data.iniciador.nome_exibicao,
            emailCorporativo: data.iniciador.email_corporativo,
            avatar: data.iniciador.avatar_url,
          } as UsuarioChat)
        : undefined;

      return ok({
        ...chamada,
        participantes,
        iniciador,
      });
    } catch (e) {
      console.error(e);
      return err(new Error("Erro inesperado ao buscar chamada."));
    }
  }

  /**
   * Busca chamada por Meeting ID (Dyte)
   */
  async findChamadaByMeetingId(
    meetingId: string
  ): Promise<Result<Chamada | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("chamadas")
        .select("*")
        .eq("meeting_id", meetingId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return err(new Error("Erro ao buscar chamada por meeting ID."));
      }

      return ok(converterParaChamada(data));
    } catch {
      return err(new Error("Erro inesperado ao buscar chamada."));
    }
  }

  /**
   * Lista chamadas de uma sala
   */
  async findChamadasBySala(
    salaId: number,
    limite: number = 20
  ): Promise<Result<ChamadaComParticipantes[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from("chamadas")
        .select(
          `
          *,
          participantes:chamadas_participantes(*),
          iniciador:usuarios!chamadas_iniciado_por_fkey(
            id, nome_completo, nome_exibicao, email_corporativo, avatar_url
          )
        `
        )
        .eq("sala_id", salaId)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) return err(new Error("Erro ao listar chamadas."));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chamadas = data.map((row: any) => {
        const chamada = converterParaChamada(row);
        const participantes = (
          row.participantes as ChamadaParticipanteRow[]
        ).map(converterParaChamadaParticipante);
        const iniciador = row.iniciador
          ? ({
              id: row.iniciador.id,
              nomeCompleto: row.iniciador.nome_completo,
              nomeExibicao: row.iniciador.nome_exibicao,
              emailCorporativo: row.iniciador.email_corporativo,
              avatar: row.iniciador.avatar_url,
            } as UsuarioChat)
          : undefined;

        return { ...chamada, participantes, iniciador };
      });

      return ok(chamadas);
    } catch {
      return err(new Error("Erro inesperado ao listar chamadas."));
    }
  }

  /**
   * Busca chamadas com filtros avançados
   */
  async findChamadasComFiltros(
    params: ListarChamadasParams
  ): Promise<Result<PaginatedResponse<ChamadaComParticipantes>, Error>> {
    try {
      // Se usuarioId for fornecido, usar subquery para evitar pruning do array participantes
      let chamadaIds: number[] | undefined;
      if (params.usuarioId) {
        const { data: partIds, error: partError } = await this.supabase
          .from("chamadas_participantes")
          .select("chamada_id")
          .eq("usuario_id", params.usuarioId);

        if (partError) {
          const errorDetails = {
            message: partError.message,
            code: partError.code,
            details: partError.details,
            hint: partError.hint,
          };
          console.error(
            "Erro ao buscar participantes:",
            JSON.stringify(errorDetails, null, 2)
          );
          console.error("Params usuarioId:", params.usuarioId);
          return err(
            new Error(
              `Erro ao buscar histórico de chamadas: ${partError.message || "Erro desconhecido"}`
            )
          );
        }

        chamadaIds = partIds?.map((p) => p.chamada_id) || [];
        if (chamadaIds.length === 0) {
          return ok({
            data: [],
            pagination: {
              currentPage: 1,
              pageSize: params.limite || 50,
              totalCount: 0,
              totalPages: 1,
            },
          });
        }
      }

      // Query principal: selecionar participantes SEM !inner e SEM filtro no join
      // Isso garante que o array participantes contenha TODOS os participantes
      let query = this.supabase
        .from("chamadas")
        .select(
          `
          *,
          participantes:chamadas_participantes(*),
          iniciador:usuarios!chamadas_iniciado_por_fkey(
            id, nome_completo, nome_exibicao, email_corporativo, avatar_url
          )
        `,
          { count: "exact" }
        );

      // Aplicar filtro de IDs se houver subquery de usuário
      if (chamadaIds && chamadaIds.length > 0) {
        query = query.in("id", chamadaIds);
      }

      // Aplicar outros filtros na tabela principal
      if (params.tipo) {
        query = query.eq("tipo", params.tipo);
      }

      if (params.status) {
        query = query.eq("status", params.status);
      }

      if (params.dataInicio) {
        query = query.gte("created_at", params.dataInicio);
      }

      if (params.dataFim) {
        query = query.lte("created_at", params.dataFim);
      }

      const limite = params.limite || 50;
      const offset = params.offset || 0;

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limite - 1);

      const { data, error, count } = await query;

      if (error) {
        // Serializar erro do Supabase corretamente
        const errorDetails = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        };
        console.error(
          "Erro findChamadasComFiltros:",
          JSON.stringify(errorDetails, null, 2)
        );
        console.error("Query params:", {
          tipo: params.tipo,
          status: params.status,
          dataInicio: params.dataInicio,
          dataFim: params.dataFim,
          usuarioId: params.usuarioId,
          limite: params.limite,
          offset: params.offset,
          chamadaIds: chamadaIds?.length || 0,
        });
        return err(
          new Error(
            `Erro ao buscar histórico de chamadas: ${error.message || "Erro desconhecido"}`
          )
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chamadas = data.map((row: any) => {
        const chamada = converterParaChamada(row);
        // Agora o array participantes contém TODOS os participantes (não foi filtrado no join)
        const participantes = (
          row.participantes as ChamadaParticipanteRow[]
        ).map(converterParaChamadaParticipante);
        const iniciador = row.iniciador
          ? ({
              id: row.iniciador.id,
              nomeCompleto: row.iniciador.nome_completo,
              nomeExibicao: row.iniciador.nome_exibicao,
              emailCorporativo: row.iniciador.email_corporativo,
              avatar: row.iniciador.avatar_url,
            } as UsuarioChat)
          : undefined;

        return { ...chamada, participantes, iniciador };
      });

      return ok({
        data: chamadas,
        pagination: {
          currentPage: Math.floor(offset / limite) + 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: count ? Math.ceil(count / limite) : 1,
        },
      });
    } catch {
      return err(new Error("Erro inesperado ao buscar histórico."));
    }
  }

  /**
   * Busca chamadas onde usuário participou (Helper simplificado)
   */
  async findChamadasPorUsuario(
    usuarioId: number,
    limite: number = 20,
    offset: number = 0
  ): Promise<Result<PaginatedResponse<ChamadaComParticipantes>, Error>> {
    return this.findChamadasComFiltros({
      usuarioId,
      limite,
      offset,
    });
  }

  /**
   * Atualiza status da chamada
   */
  async updateChamadaStatus(
    id: number,
    status: StatusChamada
  ): Promise<Result<void, Error>> {
    try {
      const updates: { status: string; finalizada_em?: string } = { status };
      if (status === StatusChamada.Finalizada) {
        updates.finalizada_em = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from("chamadas")
        .update(updates)
        .eq("id", id);

      if (error) return err(new Error("Erro ao atualizar status da chamada."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao atualizar status."));
    }
  }

  /**
   * Atualiza transcrição da chamada
   */
  async updateTranscricao(
    chamadaId: number,
    transcricao: string
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas")
        .update({ transcricao })
        .eq("id", chamadaId);

      if (error) return err(new Error("Erro ao salvar transcrição."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao salvar transcrição."));
    }
  }

  /**
   * Atualiza URL de gravação da chamada
   */
  async updateGravacaoUrl(
    chamadaId: number,
    gravacaoUrl: string
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas")
        .update({ gravacao_url: gravacaoUrl })
        .eq("id", chamadaId);

      if (error) return err(new Error("Erro ao salvar URL de gravação."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao salvar URL de gravação."));
    }
  }

  /**
   * Atualiza resumo da chamada
   */
  async updateResumo(
    chamadaId: number,
    resumo: string
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas")
        .update({ resumo })
        .eq("id", chamadaId);

      if (error) return err(new Error("Erro ao salvar resumo."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao salvar resumo."));
    }
  }

  /**
   * Finaliza chamada e calcula duração
   */
  async finalizarChamada(
    id: number,
    duracaoSegundos?: number
  ): Promise<Result<void, Error>> {
    try {
      const updates: {
        status: string;
        finalizada_em: string;
        duracao_segundos?: number;
      } = {
        status: StatusChamada.Finalizada,
        finalizada_em: new Date().toISOString(),
      };
      if (duracaoSegundos) updates.duracao_segundos = duracaoSegundos;

      const { error } = await this.supabase
        .from("chamadas")
        .update(updates)
        .eq("id", id);

      if (error) return err(new Error("Erro ao finalizar chamada."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao finalizar chamada."));
    }
  }
}

/**
 * Cria uma instância do CallsRepository com cliente Supabase
 */
export async function createCallsRepository(): Promise<CallsRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new CallsRepository(supabase);
}

// =============================================================================
// MEMBERS REPOSITORY
// =============================================================================

/**
 * Repository para operações de persistência de membros e participantes
 */
export class MembersRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===========================================================================
  // MEMBROS DE SALA (Soft Delete por Usuário)
  // ===========================================================================

  /**
   * Adiciona um membro a uma sala.
   * Usa insert ao invés de upsert para evitar conflitos com RLS UPDATE policy.
   * Se o membro já existe, trata como sucesso (idempotente).
   * Se já existe mas está inativo, reativa via update separado.
   */
  async addMembro(salaId: number, usuarioId: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("membros_sala_chat")
        .insert({
          sala_id: salaId,
          usuario_id: usuarioId,
          is_active: true,
        });

      if (error) {
        // Unique constraint violation = membro já existe
        if (error.code === "23505") {
          // Reativar se estava inativo
          await this.supabase
            .from("membros_sala_chat")
            .update({ is_active: true, deleted_at: null })
            .eq("sala_id", salaId)
            .eq("usuario_id", usuarioId);
          return ok(undefined);
        }
        console.error("[Chat] Erro addMembro:", { salaId, usuarioId, code: error.code, message: error.message });
        return err(new Error(`Erro ao adicionar membro à sala: ${error.message}`));
      }
      return ok(undefined);
    } catch (e) {
      console.error("[Chat] Erro inesperado addMembro:", e);
      return err(new Error("Erro inesperado ao adicionar membro."));
    }
  }

  /**
   * Soft delete de uma conversa para um usuário específico
   * A conversa continua existindo para outros membros
   */
  async softDeleteSalaParaUsuario(
    salaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("membros_sala_chat")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("sala_id", salaId)
        .eq("usuario_id", usuarioId);

      if (error) {
        console.error("Erro softDeleteSalaParaUsuario:", error);
        return err(new Error("Erro ao remover conversa."));
      }
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao remover conversa."));
    }
  }

  /**
   * Restaura uma conversa para um usuário (desfaz soft delete)
   */
  async restaurarSalaParaUsuario(
    salaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("membros_sala_chat")
        .update({
          is_active: true,
          deleted_at: null,
        })
        .eq("sala_id", salaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao restaurar conversa."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao restaurar conversa."));
    }
  }

  /**
   * Verifica se o usuário é membro ativo de uma sala
   */
  async isMembroAtivo(
    salaId: number,
    usuarioId: number
  ): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("membros_sala_chat")
        .select("is_active")
        .eq("sala_id", salaId)
        .eq("usuario_id", usuarioId)
        .maybeSingle();

      if (error) return err(new Error("Erro ao verificar membro."));
      return ok(data?.is_active ?? false);
    } catch {
      return err(new Error("Erro inesperado ao verificar membro."));
    }
  }

  // ===========================================================================
  // PARTICIPANTES DA CHAMADA
  // ===========================================================================

  /**
   * Adiciona participante
   */
  async addParticipante(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas_participantes")
        .insert({
          chamada_id: chamadaId,
          usuario_id: usuarioId,
          aceitou: null, // Pendente
        });

      if (error) {
        // Ignora erro se já existe (unique constraint)
        if (error.code === "23505") return ok(undefined);
        return err(new Error("Erro ao adicionar participante."));
      }
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao adicionar participante."));
    }
  }

  /**
   * Responde convite de chamada (aceitar/recusar)
   */
  async responderChamada(
    chamadaId: number,
    usuarioId: number,
    aceitou: boolean
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas_participantes")
        .update({
          aceitou,
          respondeu_em: new Date().toISOString(),
        })
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao responder chamada."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao responder chamada."));
    }
  }

  /**
   * Registra entrada na chamada
   */
  async registrarEntrada(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas_participantes")
        .update({
          entrou_em: new Date().toISOString(),
          aceitou: true, // Confirma aceitação se entrar
        })
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao registrar entrada."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao registrar entrada."));
    }
  }

  /**
   * Registra saída da chamada
   */
  async registrarSaida(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      // Primeiro busca data de entrada para calcular duração
      const { data, error: fetchError } = await this.supabase
        .from("chamadas_participantes")
        .select("entrou_em")
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId)
        .single();

      if (fetchError)
        return err(new Error("Erro ao buscar dados do participante."));

      const saiuEm = new Date();
      let duracao = 0;

      if (data?.entrou_em) {
        const entrouEm = new Date(data.entrou_em);
        duracao = Math.floor((saiuEm.getTime() - entrouEm.getTime()) / 1000);
      }

      const { error } = await this.supabase
        .from("chamadas_participantes")
        .update({
          saiu_em: saiuEm.toISOString(),
          duracao_segundos: duracao,
        })
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao registrar saída."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao registrar saída."));
    }
  }

  /**
   * Busca participantes de uma chamada
   */
  async findParticipantesByChamada(
    chamadaId: number
  ): Promise<Result<ChamadaParticipante[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from("chamadas_participantes")
        .select("*")
        .eq("chamada_id", chamadaId);

      if (error) return err(new Error("Erro ao buscar participantes."));

      return ok(
        (data as ChamadaParticipanteRow[]).map(converterParaChamadaParticipante)
      );
    } catch {
      return err(new Error("Erro inesperado ao buscar participantes."));
    }
  }
}

/**
 * Cria uma instância do MembersRepository com cliente Supabase
 */
export async function createMembersRepository(): Promise<MembersRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new MembersRepository(supabase);
}
