'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';

export async function actionListarLixeira() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const documentos = await service.listarLixeira(user.id);
    return { success: true, data: documentos };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionRestaurarDaLixeira(documento_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const documento = await service.restaurarDaLixeira(documento_id, user.id);
    revalidatePath('/app/documentos');
    revalidatePath('/app/documentos/lixeira');
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionLimparLixeira() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    // A implementação atual de service.limparLixeira remove apenas documentos do usuário
    // que estão na lixeira.
    const resultado = await service.limparLixeira(user.id);
    revalidatePath('/app/documentos/lixeira');
    return { success: true, data: resultado };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarPermanentemente(documento_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    await service.deletarDocumentoPermanentemente(documento_id, user.id);
    revalidatePath('/app/documentos/lixeira');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
