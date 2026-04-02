'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth'; // Assuming this utility exists
import * as service from '../service';
import { CriarDocumentoParams, AtualizarDocumentoParams, ListarDocumentosParams, AutoSavePayload } from '../types';

export async function actionListarDocumentos(params: ListarDocumentosParams) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const { documentos, total } = await service.listarDocumentos(params, user.id);
    return { success: true, data: documentos, total };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarDocumento(id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const documento = await service.buscarDocumento(id, user.id);
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarDocumento(formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const params: CriarDocumentoParams = {
      titulo: formData.get('titulo') as string,
      conteudo: formData.get('conteudo') ? JSON.parse(formData.get('conteudo') as string) : undefined,
      pasta_id: formData.get('pasta_id') ? parseInt(formData.get('pasta_id') as string) : null,
      descricao: formData.get('descricao') as string | undefined,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
    };

    const documento = await service.criarDocumento(params, user.id);

    revalidatePath('/app/documentos');
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarDocumento(id: number, formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const params: AtualizarDocumentoParams = {
      titulo: formData.get('titulo') as string | undefined,
      conteudo: formData.get('conteudo') ? JSON.parse(formData.get('conteudo') as string) : undefined,
      pasta_id: formData.get('pasta_id') ? parseInt(formData.get('pasta_id') as string) : null,
      descricao: formData.get('descricao') as string | undefined,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
    };

    const documento = await service.atualizarDocumento(id, params, user.id);

    revalidatePath('/app/documentos');
    revalidatePath(`/app/documentos/${id}`);
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarDocumento(id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    await service.deletarDocumento(id, user.id);
    revalidatePath('/app/documentos');
    revalidatePath('/app/documentos/lixeira');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAutoSalvar(id: number, formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const payload: AutoSavePayload = {
      documento_id: id,
      conteudo: formData.get('conteudo') ? JSON.parse(formData.get('conteudo') as string) : undefined,
      titulo: formData.get('titulo') as string | undefined,
    };

    const documento = await service.autoSalvarDocumento(payload, user.id);
    revalidatePath(`/app/documentos/${id}`); // Revalidar a página específica do documento
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
