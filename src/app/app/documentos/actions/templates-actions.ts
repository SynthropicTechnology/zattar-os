'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';
import { CriarTemplateParams, ListarTemplatesParams } from '../types';

export async function actionListarTemplates(params: ListarTemplatesParams) {
  try {
    const user = await authenticateRequest();
    // User can be null for public templates
    const { templates, total } = await service.listarTemplates(params, user?.id);
    return { success: true, data: templates, total };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarTemplate(formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const params: CriarTemplateParams = {
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string | undefined,
      conteudo: formData.get('conteudo') ? JSON.parse(formData.get('conteudo') as string) : undefined,
      visibilidade: formData.get('visibilidade') as 'publico' | 'privado',
      categoria: formData.get('categoria') as string | undefined,
      thumbnail_url: formData.get('thumbnail_url') as string | undefined,
    };

    const template = await service.criarTemplate(params, user.id);
    revalidatePath('/app/templates');
    return { success: true, data: template };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionUsarTemplate(template_id: number, opcoes?: { titulo?: string; pasta_id?: number | null }) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const documento = await service.usarTemplate(template_id, user.id, opcoes);
    revalidatePath('/app/documentos');
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarTemplate(id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    await service.deletarTemplate(id, user.id);
    revalidatePath('/app/templates');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarCategorias() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const categorias = await service.listarCategoriasTemplates(user.id);
    return { success: true, data: categorias };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarTemplatesMaisUsados(limit: number = 10) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const templates = await service.listarTemplatesMaisUsados(limit, user.id);
    return { success: true, data: templates };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
