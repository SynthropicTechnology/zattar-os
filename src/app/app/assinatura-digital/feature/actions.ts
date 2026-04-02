'use server';

import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import { AssinaturaDigitalService } from './service';
import {
  createSegmentoSchema,
  updateSegmentoSchema,
  createTemplateSchema,
  Template,
} from './types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { indexText, indexDocument } from '@/lib/ai/services/indexing.service';
import { extractKeyFromUrl } from '@/lib/ai/services/storage-adapter.service';
import {
  findClienteByCPF,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
  searchPartesContrariaComEndereco,
} from '@/app/app/partes/server';
import { normalizarDocumento } from '@/app/app/partes';
import type { Cliente, ParteContraria, ParteContrariaComEndereco } from '@/app/app/partes/types';

// Helper para lidar com erros
const handleError = (error: unknown) => {
  console.error('AssinaturaDigital Action Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Um erro inesperado ocorreu.',
  };
};

// Segmentos
export async function listarSegmentosAction(filtros?: {
  ativo?: boolean;
}) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'listar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para listar segmentos.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const segmentos = await assinaturaDigitalService.listarSegmentos(filtros);
    return { success: true, data: segmentos };
  } catch (error) {
    return handleError(error);
  }
}

export async function criarSegmentoAction(
  input: z.infer<typeof createSegmentoSchema>,
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'criar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para criar segmentos.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const segmento = await assinaturaDigitalService.criarSegmento(input);
    revalidatePath('/app/assinatura-digital/segmentos');
    return { success: true, data: segmento };
  } catch (error) {
    return handleError(error);
  }
}

export async function atualizarSegmentoAction(
  id: number,
  input: z.infer<typeof updateSegmentoSchema>,
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'editar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para editar segmentos.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const segmento = await assinaturaDigitalService.atualizarSegmento(id, input);
    revalidatePath('/app/assinatura-digital/segmentos');
    return { success: true, data: segmento };
  } catch (error) {
    return handleError(error);
  }
}

// Templates
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
            entity_type: 'assinatura_digital', // Usando tipo genérico mapeado no chat
            entity_id: template.id,
            metadata: { ...metadata, type: 'markdown_template' },
          });
        } else if (template.tipo_template === 'pdf' && template.pdf_url) {
          const key = extractKeyFromUrl(template.pdf_url);
          if (key) {
            await indexDocument({
              entity_type: 'assinatura_digital',
              entity_id: template.id,
              storage_provider: 'backblaze', // Assumindo backblaze padrão
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
    // Retornar o buffer como uma string base64 para facilitar o transporte via JSON
    return { success: true, data: pdfBuffer.toString('base64') };
  } catch (error) {
    return handleError(error);
  }
}

// Busca de Clientes e Partes Contrárias
/**
 * Busca um cliente por CPF
 */
export async function searchClienteByCPF(cpf: string): Promise<{
  success: boolean;
  data?: Cliente | null;
  error?: string;
}> {
  try {
    if (!cpf || cpf.trim().length === 0) {
      return { success: false, error: 'CPF é obrigatório' };
    }

    const result = await findClienteByCPF(cpf);

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca uma parte contrária por CPF, CNPJ ou nome
 */
export async function searchParteContraria(params: {
  cpf?: string;
  cnpj?: string;
  nome?: string;
}): Promise<{
  success: boolean;
  data?: ParteContraria | null;
  error?: string;
}> {
  try {
    const { cpf, cnpj, nome } = params;

    // Se não houver nenhum parâmetro, retorna erro
    if (!cpf && !cnpj && !nome) {
      return { success: false, error: 'Informe CPF, CNPJ ou nome para buscar' };
    }

    // Prioridade: CPF > CNPJ > Nome
    if (cpf && cpf.trim().length > 0) {
      const cpfNormalizado = normalizarDocumento(cpf);
      const result = await findParteContrariaByCPF(cpfNormalizado);

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        return { success: true, data: result.data };
      }
    }

    if (cnpj && cnpj.trim().length > 0) {
      const cnpjNormalizado = normalizarDocumento(cnpj);
      const result = await findParteContrariaByCNPJ(cnpjNormalizado);

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        return { success: true, data: result.data };
      }
    }

    if (nome && nome.trim().length > 0) {
      const result = await findAllPartesContrarias({
        busca: nome.trim(),
        limite: 1,
      });

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data.data.length > 0) {
        return { success: true, data: result.data.data[0] };
      }
    }

    // Não encontrado
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca partes contrárias por termo com endereço populado (para typeahead)
 */
export async function searchPartesContrariasList(busca: string): Promise<{
  success: boolean;
  data?: ParteContrariaComEndereco[];
  error?: string;
}> {
  try {
    if (!busca || busca.trim().length < 2) {
      return { success: true, data: [] };
    }

    const result = await searchPartesContrariaComEndereco(busca.trim(), 10);

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Formulários
export async function listarFormulariosAction(filtros?: {
  segmento_id?: number;
  ativo?: boolean;
}) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'listar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para listar formulários.' };
    }

    const { listFormularios } = await import('./services/formularios.service');
    const result = await listFormularios(filtros);
    return { success: true, data: result.formularios };
  } catch (error) {
    return handleError(error);
  }
}
