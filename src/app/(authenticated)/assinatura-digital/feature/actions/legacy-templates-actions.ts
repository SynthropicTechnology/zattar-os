'use server';

import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import { AssinaturaDigitalService } from '../service';
import {
  createTemplateSchema,
  Template,
} from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { indexText, indexDocument } from '@/lib/ai/services/indexing.service';
import { extractKeyFromUrl } from '@/lib/ai/services/storage-adapter.service';

// Helper para lidar com erros
const handleError = (error: unknown) => {
  console.error('AssinaturaDigital Action Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Um erro inesperado ocorreu.',
  };
};

export async function listarTemplatesAction(filtros?: {
  segmento_id?: number;
  tipo_template?: 'pdf' | 'markdown';
  ativo?: boolean;
}) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'listar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para listar templates.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const templates = await assinaturaDigitalService.listarTemplates(filtros);
    return { success: true, data: templates };
  } catch (error) {
    return handleError(error);
  }
}

export async function criarTemplateAction(
  input: z.infer<typeof createTemplateSchema>,
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'criar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para criar templates.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const template = await assinaturaDigitalService.criarTemplate(input);

    // 🆕 AI Indexing Hook
    const userId = user.id;
    after(async () => {
      try {
        console.log(`🧠 [AI] Indexando template de assinatura digital ${template.id}`);

        const metadata = {
          nome: template.nome,
          descricao: template.descricao,
          segmento_id: template.segmento_id,
          indexed_by: userId,
        };

        if (template.tipo_template === 'markdown' && template.conteudo_markdown) {
          await indexText(template.conteudo_markdown, {
            entity_type: 'assinatura_digital',
            entity_id: template.id,
            metadata: { ...metadata, type: 'markdown_template' },
          });
        } else if (template.tipo_template === 'pdf' && template.pdf_url) {
          const key = extractKeyFromUrl(template.pdf_url);
          if (key) {
            await indexDocument({
              entity_type: 'assinatura_digital',
              entity_id: template.id,
              storage_provider: 'backblaze',
              storage_key: key,
              content_type: 'application/pdf',
              metadata: { ...metadata, type: 'pdf_template' },
            });
          }
        }
      } catch (error) {
        console.error(`❌ [AI] Erro ao indexar template ${template.id}:`, error);
      }
    });

    revalidatePath('/app/assinatura-digital/templates');
    return { success: true, data: template };
  } catch (error) {
    return handleError(error);
  }
}

export async function processarTemplateAction(
  templateId: number,
  data: Record<string, unknown>,
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'visualizar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para processar templates.' };
    }

    const supabase = await createClient();
    const { data: templateData, error: templateError } = await supabase
      .from('assinatura_digital_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !templateData) {
      throw new Error('Template não encontrado.');
    }

    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const processedContent =
      await assinaturaDigitalService.processarVariaveisMarkdown(
        templateData as Template,
        data,
      );

    return { success: true, data: processedContent };
  } catch (error) {
    return handleError(error);
  }
}

export async function gerarPdfDeMarkdownAction(
  markdownContent: string,
  data: Record<string, unknown>,
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'visualizar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para gerar PDF.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const pdfBuffer = await assinaturaDigitalService.gerarPdfDeMarkdown(
      markdownContent,
      data,
    );
    return { success: true, data: pdfBuffer.toString('base64') };
  } catch (error) {
    return handleError(error);
  }
}
