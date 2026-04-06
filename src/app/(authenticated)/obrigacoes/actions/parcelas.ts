
'use server'

import { revalidatePath } from 'next/cache';
import * as service from '../service';
import { AtualizarParcelaParams, MarcarParcelaRecebidaParams } from '../types';

export async function actionMarcarParcelaRecebida(
  parcelaId: number, 
  dados: MarcarParcelaRecebidaParams
) {
  try {
    const data = await service.marcarParcelaRecebida(parcelaId, dados);
    revalidatePath('/app/obrigacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarParcela(
  parcelaId: number,
  valores: AtualizarParcelaParams
) {
  try {
    const data = await service.atualizarParcela(parcelaId, valores);
    revalidatePath('/app/obrigacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionRecalcularDistribuicao(acordoId: number) {
  try {
    const data = await service.recalcularDistribuicao(acordoId);
    revalidatePath(`/app/obrigacoes/${acordoId}`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

