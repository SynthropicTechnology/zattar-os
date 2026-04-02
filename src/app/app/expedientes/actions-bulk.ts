"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth";
import { realizarBaixa } from "./service";
import { atribuirResponsavel } from "./service";
import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

const bulkTransferirResponsavelSchema = z.object({
  expedienteIds: z.array(z.number().int().positive()).min(1, "Selecione pelo menos um expediente"),
  responsavelId: z.number().int().positive().nullable(),
});

const bulkBaixarSchema = z.object({
  expedienteIds: z.array(z.number().int().positive()).min(1, "Selecione pelo menos um expediente"),
  justificativaBaixa: z.string().min(1, "Justificativa é obrigatória para baixa sem protocolo"),
});

// =============================================================================
// BULK ACTIONS
// =============================================================================

export async function actionBulkTransferirResponsavel(
  expedienteIds: number[],
  prevState: ActionResult | null,
  formData: FormData | ActionResult | null
): Promise<ActionResult> {
  try {
    await authenticateRequest();

    // useActionState pode passar FormData ou o estado anterior
    if (!(formData instanceof FormData)) {
      return prevState || {
        success: false,
        error: "Dados inválidos",
        message: "Formulário inválido",
      };
    }

    const responsavelIdValue = formData.get("responsavelId");
    const responsavelId = responsavelIdValue === "" || responsavelIdValue === "null" 
      ? null 
      : responsavelIdValue ? parseInt(responsavelIdValue as string, 10) : null;

    const validation = bulkTransferirResponsavelSchema.safeParse({
      expedienteIds,
      responsavelId,
    });

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const supabase = await createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return {
        success: false,
        error: "Não autenticado",
        message: "Usuário não autenticado.",
      };
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: "Usuário não encontrado",
        message: "Usuário não encontrado no sistema.",
      };
    }

    // Transferir responsável para cada expediente
    const results = await Promise.allSettled(
      expedienteIds.map((id) => atribuirResponsavel(id, responsavelId, usuario.id))
    );

    const sucessos = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const falhas = results.length - sucessos;

    if (falhas > 0) {
      return {
        success: false,
        error: "Alguns expedientes não puderam ser atualizados",
        message: `${sucessos} expediente(s) atualizado(s), ${falhas} falha(s).`,
      };
    }

    revalidatePath("/app/expedientes");
    revalidatePath("/app/expedientes/semana");
    revalidatePath("/app/expedientes/mes");
    revalidatePath("/app/expedientes/ano");
    revalidatePath("/app/expedientes/lista");

    return {
      success: true,
      data: { sucessos, total: expedienteIds.length },
      message: `${sucessos} expediente(s) transferido(s) com sucesso.`,
    };
  } catch (error) {
    console.error("Erro ao transferir responsável em massa:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao transferir responsável. Tente novamente.",
    };
  }
}

export async function actionBulkBaixar(
  expedienteIds: number[],
  prevState: ActionResult | null,
  formData: FormData | ActionResult | null
): Promise<ActionResult> {
  try {
    await authenticateRequest();

    // useActionState pode passar FormData ou o estado anterior
    if (!(formData instanceof FormData)) {
      return prevState || {
        success: false,
        error: "Dados inválidos",
        message: "Formulário inválido",
      };
    }

    const justificativaBaixa = formData.get("justificativaBaixa") as string;

    const validation = bulkBaixarSchema.safeParse({
      expedienteIds,
      justificativaBaixa,
    });

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const supabase = await createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return {
        success: false,
        error: "Não autenticado",
        message: "Usuário não autenticado.",
      };
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: "Usuário não encontrado",
        message: "Usuário não encontrado no sistema.",
      };
    }

    // Baixar cada expediente com a mesma justificativa
    const results = await Promise.allSettled(
      expedienteIds.map((id) =>
        realizarBaixa(
          id,
          {
            expedienteId: id,
            justificativaBaixa,
            // Não incluir protocoloId para baixa sem protocolo
          },
          usuario.id
        )
      )
    );

    const sucessos = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const falhas = results.length - sucessos;

    if (falhas > 0) {
      return {
        success: false,
        error: "Alguns expedientes não puderam ser baixados",
        message: `${sucessos} expediente(s) baixado(s), ${falhas} falha(s).`,
      };
    }

    revalidatePath("/app/expedientes");
    revalidatePath("/app/expedientes/semana");
    revalidatePath("/app/expedientes/mes");
    revalidatePath("/app/expedientes/ano");
    revalidatePath("/app/expedientes/lista");

    return {
      success: true,
      data: { sucessos, total: expedienteIds.length },
      message: `${sucessos} expediente(s) baixado(s) com sucesso.`,
    };
  } catch (error) {
    console.error("Erro ao baixar expedientes em massa:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao baixar expedientes. Tente novamente.",
    };
  }
}

// Re-exportar tipo ActionResult
export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | {
      success: false;
      error: string;
      errors?: Record<string, string[]>;
      message: string;
    };

