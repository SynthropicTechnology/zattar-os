'use server';

/**
 * FILE ACTIONS
 * 
 * Server Actions for file uploads in chat.
 */

import { createClient } from '@/lib/supabase/server';
import { uploadToBackblaze, deleteFromBackblaze } from '@/lib/storage/backblaze-b2.service';
import { generateFileKey, getFileTypeFromMime, validateFileType } from '@/lib/storage/utils';
import { ActionResult } from '../domain';

// Helper to get current user
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  return data?.id || null;
}

export async function actionUploadFile(
  salaId: number,
  formData: FormData
): Promise<ActionResult<{
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileType: string; // 'imagem' | 'video' | ...
  fileSize: string;
  mimeType: string;
}>> {
  try {
    const usuarioId = await getCurrentUser();
    if (!usuarioId) {
      return { success: false, error: 'Unauthorized', message: 'Usuário não autenticado.' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file', message: 'Nenhum arquivo enviado.' };
    }

    // Server-side validation
    try {
      validateFileType(file);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Tipo de arquivo inválido';
      return { success: false, error: errorMessage, message: errorMessage };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = generateFileKey(salaId, file.name);
    
    // Use the project-standard B2 service
    const { url } = await uploadToBackblaze({
      buffer, 
      key: fileKey, 
      contentType: file.type
    });
    
    const fileType = getFileTypeFromMime(file.type);

    return {
      success: true,
      data: {
        fileUrl: url,
        fileKey: fileKey,
        fileName: file.name,
        fileType: fileType,
        fileSize: file.size.toString(),
        mimeType: file.type,
      },
      message: 'Upload concluído.',
    };

  } catch (error: unknown) {
    console.error('Erro no upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      error: errorMessage,
      message: 'Erro ao fazer upload do arquivo.',
    };
  }
}

export async function actionDeleteFile(fileKey: string): Promise<ActionResult<void>> {
  try {
    const usuarioId = await getCurrentUser();
    if (!usuarioId) {
      return { success: false, error: 'Unauthorized', message: 'Usuário não autenticado.' };
    }

    await deleteFromBackblaze(fileKey);

    return {
      success: true,
      data: undefined,
      message: 'Arquivo deletado.',
    };
  } catch (error: unknown) {
    console.error('Erro ao deletar arquivo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      error: errorMessage,
      message: 'Erro ao deletar arquivo.',
    };
  }
}