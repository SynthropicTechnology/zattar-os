'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';

export async function actionListarVersoes(documento_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const { versoes, total } = await service.listarVersoes(documento_id, user.id);
    return { success: true, data: versoes, total };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionRestaurarVersao(versao_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const documento = await service.restaurarVersao(versao_id, user.id);
    revalidatePath(`/app/documentos/${documento.id}`);
    revalidatePath(`/app/documentos/${documento.id}/versoes`);
    return { success: true, data: documento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
