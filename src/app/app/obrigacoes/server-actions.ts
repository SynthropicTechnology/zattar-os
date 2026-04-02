'use server';

import {
  actionListarAcordos as _actionListarAcordos,
  actionBuscarAcordo as _actionBuscarAcordo,
  actionCriarAcordoComParcelas as _actionCriarAcordoComParcelas,
  actionAtualizarAcordo as _actionAtualizarAcordo,
  actionDeletarAcordo as _actionDeletarAcordo,
  actionListarObrigacoesPorPeriodo as _actionListarObrigacoesPorPeriodo,
  actionBuscarAcordosPorCPF as _actionBuscarAcordosPorCPF,
  actionBuscarAcordosPorCNPJ as _actionBuscarAcordosPorCNPJ,
  actionBuscarAcordosPorNumeroProcesso as _actionBuscarAcordosPorNumeroProcesso,
} from './actions/acordos';

import {
  actionMarcarParcelaRecebida as _actionMarcarParcelaRecebida,
  actionAtualizarParcela as _actionAtualizarParcela,
  actionRecalcularDistribuicao as _actionRecalcularDistribuicao,
} from './actions/parcelas';

import {
  actionListarRepassesPendentes as _actionListarRepassesPendentes,
  actionAnexarDeclaracao as _actionAnexarDeclaracao,
  actionRegistrarRepasse as _actionRegistrarRepasse,
} from './actions/repasses';

export async function actionListarAcordos(...args: Parameters<typeof _actionListarAcordos>) {
  return _actionListarAcordos(...args);
}

export async function actionBuscarAcordo(...args: Parameters<typeof _actionBuscarAcordo>) {
  return _actionBuscarAcordo(...args);
}

export async function actionCriarAcordoComParcelas(...args: Parameters<typeof _actionCriarAcordoComParcelas>) {
  return _actionCriarAcordoComParcelas(...args);
}

export async function actionAtualizarAcordo(...args: Parameters<typeof _actionAtualizarAcordo>) {
  return _actionAtualizarAcordo(...args);
}

export async function actionDeletarAcordo(...args: Parameters<typeof _actionDeletarAcordo>) {
  return _actionDeletarAcordo(...args);
}

export async function actionListarObrigacoesPorPeriodo(...args: Parameters<typeof _actionListarObrigacoesPorPeriodo>) {
  return _actionListarObrigacoesPorPeriodo(...args);
}

export async function actionBuscarAcordosPorCPF(...args: Parameters<typeof _actionBuscarAcordosPorCPF>) {
  return _actionBuscarAcordosPorCPF(...args);
}

export async function actionBuscarAcordosPorCNPJ(...args: Parameters<typeof _actionBuscarAcordosPorCNPJ>) {
  return _actionBuscarAcordosPorCNPJ(...args);
}

export async function actionBuscarAcordosPorNumeroProcesso(...args: Parameters<typeof _actionBuscarAcordosPorNumeroProcesso>) {
  return _actionBuscarAcordosPorNumeroProcesso(...args);
}

export async function actionMarcarParcelaRecebida(...args: Parameters<typeof _actionMarcarParcelaRecebida>) {
  return _actionMarcarParcelaRecebida(...args);
}

export async function actionAtualizarParcela(...args: Parameters<typeof _actionAtualizarParcela>) {
  return _actionAtualizarParcela(...args);
}

export async function actionRecalcularDistribuicao(...args: Parameters<typeof _actionRecalcularDistribuicao>) {
  return _actionRecalcularDistribuicao(...args);
}

export async function actionListarRepassesPendentes(...args: Parameters<typeof _actionListarRepassesPendentes>) {
  return _actionListarRepassesPendentes(...args);
}

export async function actionAnexarDeclaracao(...args: Parameters<typeof _actionAnexarDeclaracao>) {
  return _actionAnexarDeclaracao(...args);
}

export async function actionRegistrarRepasse(...args: Parameters<typeof _actionRegistrarRepasse>) {
  return _actionRegistrarRepasse(...args);
}
