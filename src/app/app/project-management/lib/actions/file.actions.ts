"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase";
import { ok, err, appError, type Result } from "@/types/result";
import { type Anexo, converterParaAnexo } from "../domain";
import {
  uploadToSupabase,
  deleteFromSupabase,
} from "@/lib/storage/supabase-storage.service";
import { getCurrentUser } from "@/lib/auth/server";
import { ALLOWED_MIME_TYPES } from "@/lib/storage/utils";

const PM_PATH = "/app/project-management";
const TABLE = "pm_anexos";
const STORAGE_FOLDER = "project-management";

export async function actionListarAnexos(
  projetoId: string
): Promise<Result<Anexo[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .select(
        `*,
        usuario:usuarios!pm_anexos_usuario_id_fkey(nome_completo)`
      )
      .eq("projeto_id", projetoId)
      .order("created_at", { ascending: false });

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    const anexos = (data ?? []).map((row) => {
      const flat = {
        ...row,
        usuario_nome: row.usuario?.nome_completo,
      };
      return converterParaAnexo(flat as Record<string, unknown>);
    });

    return ok(anexos);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar anexos",
        undefined,
        error as Error
      )
    );
  }
}

export async function actionUploadAnexo(
  formData: FormData
): Promise<Result<Anexo>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return err(appError("UNAUTHORIZED", "Usuário não autenticado"));
    }

    const file = formData.get("file") as File;
    const projetoId = formData.get("projetoId") as string;

    if (!file) {
      return err(appError("VALIDATION_ERROR", "Nenhum arquivo enviado"));
    }

    // File size validation (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return err(
        appError("VALIDATION_ERROR", "Arquivo muito grande. Máximo permitido: 50MB.")
      );
    }

    // MIME type validation (warn but allow for project files)
    const allAllowedMimes = Object.values(ALLOWED_MIME_TYPES).flat();
    if (!allAllowedMimes.includes(file.type)) {
      console.warn(
        `[file.actions] Tipo MIME não reconhecido: "${file.type}" para arquivo "${file.name}". Permitindo upload de arquivo de projeto.`
      );
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${STORAGE_FOLDER}/${projetoId}/${Date.now()}-${sanitizedName}`;

    const uploadResult = await uploadToSupabase({
      buffer,
      key,
      contentType: file.type,
    });

    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .insert({
        projeto_id: projetoId,
        usuario_id: user.id,
        nome_arquivo: file.name,
        url: uploadResult.url,
        tamanho_bytes: file.size,
        tipo_mime: file.type,
      })
      .select()
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    revalidatePath(`${PM_PATH}/projects/${projetoId}/files`);
    return ok(converterParaAnexo(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao fazer upload",
        undefined,
        error as Error
      )
    );
  }
}

export async function actionExcluirAnexo(
  anexoId: string,
  projetoId: string
): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // Buscar URL para extrair a key do storage
    const { data: anexo, error: fetchError } = await db
      .from(TABLE)
      .select("url")
      .eq("id", anexoId)
      .single();

    if (fetchError) {
      return err(appError("DATABASE_ERROR", fetchError.message));
    }

    // Deletar do banco
    const { error } = await db.from(TABLE).delete().eq("id", anexoId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    // Tentar deletar do storage (best-effort)
    if (anexo?.url) {
      try {
        const url = new URL(anexo.url as string);
        const match = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        if (match?.[1]) {
          await deleteFromSupabase(decodeURIComponent(match[1]));
        }
      } catch {
        // Deleção do storage é best-effort
      }
    }

    revalidatePath(`${PM_PATH}/projects/${projetoId}/files`);
    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir anexo",
        undefined,
        error as Error
      )
    );
  }
}
