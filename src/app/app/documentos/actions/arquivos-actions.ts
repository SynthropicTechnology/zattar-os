"use server";

import { revalidatePath } from "next/cache";
import { authenticateRequest } from "@/lib/auth/session";
import * as service from "../service";
import type { ListarArquivosParams } from "../domain";

/**
 * Faz upload de um arquivo genérico para o storage
 */
export async function actionUploadArquivoGenerico(formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    const file = formData.get("file") as File;
    const pastaIdStr = formData.get("pasta_id") as string | null;
    const pasta_id = pastaIdStr ? parseInt(pastaIdStr) : null;

    if (!file) {
      return { success: false, error: "Nenhum arquivo enviado." };
    }

    const arquivo = await service.uploadArquivoGenerico(
      file,
      pasta_id,
      user.id
    );

    revalidatePath("/app/documentos");
    return { success: true, data: arquivo };
  } catch (error) {
    console.error("Erro ao fazer upload de arquivo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Lista itens unificados (pastas, documentos e arquivos) para o FileManager
 */
export async function actionListarItensUnificados(
  params: ListarArquivosParams
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    const { itens, total } = await service.listarItensUnificados(
      params,
      user.id
    );
    return { success: true, data: itens, total };
  } catch (error) {
    console.error("Erro ao listar itens:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Move um arquivo para outra pasta
 */
export async function actionMoverArquivo(
  arquivo_id: number,
  pasta_id: number | null
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    const arquivo = await service.moverArquivo(arquivo_id, pasta_id, user.id);
    revalidatePath("/app/documentos");
    return { success: true, data: arquivo };
  } catch (error) {
    console.error("Erro ao mover arquivo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Deleta um arquivo (soft delete - move para lixeira)
 */
export async function actionDeletarArquivo(arquivo_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    await service.deletarArquivo(arquivo_id, user.id);
    revalidatePath("/app/documentos");
    revalidatePath("/app/documentos/lixeira");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Busca breadcrumbs (caminho da pasta)
 */
export async function actionBuscarCaminhoPasta(pasta_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    const caminho = await service.buscarCaminhoPasta(pasta_id, user.id);
    return { success: true, data: caminho };
  } catch (error) {
    console.error("Erro ao buscar breadcrumbs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
