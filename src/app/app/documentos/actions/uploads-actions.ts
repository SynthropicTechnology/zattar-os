'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';
import { isContentTypeSupported } from '@/lib/ai/services/extraction.service';
import { createServiceClient } from '@/lib/supabase/service-client';

export async function actionUploadArquivo(formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const file = formData.get('file') as File;
    const documento_id = formData.get('documento_id') ? parseInt(formData.get('documento_id') as string) : null;

    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado.' };
    }

    const upload = await service.uploadArquivo(file, documento_id, user.id);

    // Enfileirar para indexação assíncrona via cron
    if (process.env.ENABLE_AI_INDEXING !== 'false') {
      queueMicrotask(async () => {
        try {
          const supabase = createServiceClient();
          
          // Tentar extrair texto do arquivo para enfileiramento
          // Se falhar ou tipo não suportado, marca para processamento posterior no cron
          let textoExtraido = '';
          if (isContentTypeSupported(upload.tipo_mime)) {
            try {
              const { extractText } = await import('@/lib/ai/services/extraction.service');
              textoExtraido = await extractText(upload.b2_key as unknown as Buffer, upload.tipo_mime);
            } catch (extractError) {
              console.warn(`[AI] Falha ao extrair texto para upload ${upload.id}:`, extractError);
              // Deixar texto vazio para reprocessamento no cron
            }
          }
          
          await supabase.from('documentos_pendentes_indexacao').insert({
            tipo: 'documento',
            entity_id: upload.id,
            texto: textoExtraido, // populado com extração, ou vazio para reprocessar no cron
            metadata: {
              storage_key: upload.b2_key,
              content_type: upload.tipo_mime,
              parent_id: documento_id,
              nome_arquivo: upload.nome_arquivo,
              usuario_id: user.id,
              documento_id,
              content_type_unknown: !isContentTypeSupported(upload.tipo_mime) || undefined,
              requer_extracao: !textoExtraido, // flag indicando se precisa extrair no cron
            },
          });
          console.log(`[AI] Documento ${upload.id} adicionado à fila de indexação`);
        } catch (error) {
          console.error('[AI] Erro ao enfileirar documento:', error);
        }
      });
    }

    revalidatePath(`/app/documentos/${documento_id}`);
    return { success: true, data: upload };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarUploads(documento_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const { uploads, total } = await service.listarUploads(documento_id, user.id);
    return { success: true, data: uploads, total };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionGerarPresignedUrl(filename: string, contentType: string, size?: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    // Validação de usuário e limites implementada no service
    const presignedUrlData = await service.gerarPresignedUrl(filename, contentType, user.id, size);
    return { success: true, data: presignedUrlData };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionGerarUrlDownload(key: string) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const url = await service.gerarUrlDownload(key);
    return { success: true, data: { url } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
