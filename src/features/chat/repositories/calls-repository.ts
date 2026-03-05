/**
 * CHAT FEATURE - Calls Repository
 *
 * Repositório para operações de persistência de chamadas de áudio/vídeo.
 * Responsabilidades:
 * - CRUD de chamadas
 * - Gerenciamento de status
 * - Atualização de transcrição, gravação e resumo
 * - Listagem com filtros avançados
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "neverthrow";
import { fromCamelToSnake } from "@/lib/utils";
import type {
  Chamada,
  ChamadaComParticipantes,
  ChamadaParticipanteRow,
  ListarChamadasParams,
  PaginatedResponse,
  UsuarioChat,
} from "../domain";
import { StatusChamada } from "../domain";
import {
  converterParaChamada,
  converterParaChamadaParticipante,
} from "./shared/converters";

// =============================================================================
// REPOSITORY CLASS
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

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Cria uma instância do CallsRepository com cliente Supabase
 */
export async function createCallsRepository(): Promise<CallsRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new CallsRepository(supabase);
}
