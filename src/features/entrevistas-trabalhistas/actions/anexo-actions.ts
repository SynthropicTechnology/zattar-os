'use server';

import { revalidatePath } from 'next/cache';
import { createAnexoSchema } from '../domain';
import { createAnexo, deleteAnexo } from '../repository';
import { uploadToSupabase } from '@/lib/storage/supabase-storage.service';
import type { EntrevistaActionResult } from './entrevista-actions';

const ALLOWED_FILE_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
] as const;

const MAX_FILE_SIZE = 25 * 1024 * 1024;

// =============================================================================
// UPLOAD ANEXO
// =============================================================================

export async function uploadAnexoAction(
  entrevistaId: number,
  contratoId: number,
  modulo: string,
  noReferencia: string | undefined,
  tipoAnexo: string,
  arquivoUrl: string,
  descricao?: string,
): Promise<EntrevistaActionResult> {
  try {
    const validation = createAnexoSchema.safeParse({
      entrevistaId,
      modulo,
      noReferencia,
      tipoAnexo,
      arquivoUrl,
      descricao,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
        message: 'Erro de validação ao enviar anexo',
      };
    }

    const result = await createAnexo(validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${contratoId}`);

    return {
      success: true,
      data: result.data,
      message: 'Anexo enviado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao enviar anexo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao enviar anexo. Tente novamente.',
    };
  }
}

export async function uploadArquivoAnexoAction(
  formData: FormData,
): Promise<EntrevistaActionResult> {
  try {
    const entrevistaId = Number(formData.get('entrevistaId'));
    const contratoId = Number(formData.get('contratoId'));
    const modulo = String(formData.get('modulo') ?? '');
    const tipoAnexo = String(formData.get('tipoAnexo') ?? 'outro');
    const descricao = String(formData.get('descricao') ?? '');
    const noReferenciaRaw = formData.get('noReferencia');
    const noReferencia = noReferenciaRaw ? String(noReferenciaRaw) : undefined;
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        error: 'Arquivo não fornecido',
        message: 'Selecione um arquivo para anexar.',
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
      return {
        success: false,
        error: 'Tipo de arquivo não permitido',
        message: 'Use áudio, imagem, vídeo, PDF, DOC ou DOCX.',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'Arquivo excede o tamanho máximo',
        message: 'Tamanho máximo permitido: 25MB.',
      };
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const storageKey = `entrevistas/${entrevistaId}/${modulo}/${uniqueName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToSupabase({
      buffer,
      key: storageKey,
      contentType: file.type,
      upsert: false,
    });

    const validation = createAnexoSchema.safeParse({
      entrevistaId,
      modulo,
      noReferencia,
      tipoAnexo,
      arquivoUrl: uploadResult.url,
      descricao,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
        message: 'Erro de validação ao enviar anexo',
      };
    }

    const result = await createAnexo(validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${contratoId}`);

    return {
      success: true,
      data: result.data,
      message: 'Anexo enviado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao enviar arquivo de anexo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao enviar anexo. Tente novamente.',
    };
  }
}

// =============================================================================
// EXCLUIR ANEXO
// =============================================================================

export async function deleteAnexoAction(
  anexoId: number,
  contratoId: number,
): Promise<EntrevistaActionResult> {
  try {
    const result = await deleteAnexo(anexoId);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${contratoId}`);

    return {
      success: true,
      data: null,
      message: 'Anexo excluído com sucesso',
    };
  } catch (error) {
    console.error('Erro ao excluir anexo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao excluir anexo. Tente novamente.',
    };
  }
}
