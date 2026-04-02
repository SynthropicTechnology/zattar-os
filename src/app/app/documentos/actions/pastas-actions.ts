'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';
import { CriarPastaParams } from '../types';

export async function actionListarPastas() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const pastas = await service.listarPastas(user.id);
    return { success: true, data: pastas };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarPasta(formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const params: CriarPastaParams = {
      nome: formData.get('nome') as string,
      pasta_pai_id: formData.get('pasta_pai_id') ? parseInt(formData.get('pasta_pai_id') as string) : null,
      tipo: formData.get('tipo') as 'comum' | 'privada',
      descricao: formData.get('descricao') as string | undefined,
      cor: formData.get('cor') as string | undefined,
      icone: formData.get('icone') as string | undefined,
    };

    const pasta = await service.criarPasta(params, user.id);
    revalidatePath('/app/documentos');
    return { success: true, data: pasta };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionMoverDocumento(documento_id: number, pasta_id: number | null) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const documento = await service.moverDocumento(documento_id, pasta_id, user.id);
    revalidatePath('/app/documentos');
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarPasta(id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    await service.deletarPasta(id, user.id);
    revalidatePath('/app/documentos');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
