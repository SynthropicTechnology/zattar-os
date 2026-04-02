
'use server'

import { revalidatePath } from 'next/cache';
import * as service from '../service';
import { FiltrosRepasses, RegistrarRepasseParams } from '../types';

export async function actionListarRepassesPendentes(filtros?: FiltrosRepasses) {
  try {
    const data = await service.listarRepassesPendentes(filtros);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAnexarDeclaracao(
  parcelaId: number,
  url: string
) {
  try {
    const data = await service.anexarDeclaracaoPrestacaoContas(parcelaId, url);
    revalidatePath('/app/repasses');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionRegistrarRepasse(
  parcelaId: number,
  dados: RegistrarRepasseParams
) {
  try {
    const data = await service.registrarRepasse(parcelaId, dados);
    revalidatePath('/app/repasses');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
