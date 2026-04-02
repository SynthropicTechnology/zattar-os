'use server';

/**
 * Partes Feature Module - Server Actions entrypoint
 *
 * IMPORTANTE (Next.js): arquivos com "use server" só podem exportar funções async.
 * Este arquivo expõe um conjunto de Server Actions estáveis para importação a partir de
 * Client Components e Server Components, sem deep-imports.
 */

import type { ListarClientesParams } from './domain';
import type { PoloProcessoParte } from './types';

type DashboardDateFilterInput =
  | { mode: 'all' }
  | { mode: 'range'; from: string; to: string };

import {
  actionListarClientes as _actionListarClientes,
  actionContarClientesComEstatisticas as _actionContarClientesComEstatisticas,
  actionContarClientesPorEstado as _actionContarClientesPorEstado,
} from './actions/clientes-actions';

import {
  actionContarPartesContrariasComEstatisticas as _actionContarPartesContrariasComEstatisticas,
} from './actions/partes-contrarias-actions';

import {
  actionBuscarPartesPorProcessoEPolo as _actionBuscarPartesPorProcessoEPolo,
} from './actions/processo-partes-actions';

import {
  actionDesativarClientesEmMassa as _actionDesativarClientesEmMassa,
} from './actions/clientes-actions';

import {
  actionCriarCliente as _actionCriarCliente,
  actionAtualizarClienteForm as _actionAtualizarClienteForm,
  actionDesativarCliente as _actionDesativarCliente,
  actionCriarParteContraria as _actionCriarParteContraria,
  actionAtualizarParteContraria as _actionAtualizarParteContraria,
  actionCriarTerceiro as _actionCriarTerceiro,
  actionAtualizarTerceiro as _actionAtualizarTerceiro,
} from './actions/partes-form-actions';

export type { ActionResult } from './actions/partes-form-actions';

export async function actionListarClientes(params: ListarClientesParams = {}) {
  return _actionListarClientes(params);
}

export async function actionContarClientesComEstatisticas(dateFilter?: DashboardDateFilterInput) {
  return _actionContarClientesComEstatisticas(dateFilter);
}

export async function actionContarClientesPorEstado(limit = 4, dateFilter?: DashboardDateFilterInput) {
  return _actionContarClientesPorEstado(limit, dateFilter);
}

export async function actionContarPartesContrariasComEstatisticas(dateFilter?: DashboardDateFilterInput) {
  return _actionContarPartesContrariasComEstatisticas(dateFilter);
}

export async function actionBuscarPartesPorProcessoEPolo(
  processoId: number,
  polo: PoloProcessoParte
) {
  return _actionBuscarPartesPorProcessoEPolo(processoId, polo);
}

export async function actionCriarCliente(
  prevState: import('./actions/partes-form-actions').ActionResult | null,
  formData: FormData
) {
  return _actionCriarCliente(prevState, formData);
}

export async function actionAtualizarClienteForm(
  id: number,
  prevState: import('./actions/partes-form-actions').ActionResult | null,
  formData: FormData
) {
  return _actionAtualizarClienteForm(id, prevState, formData);
}

export async function actionDesativarCliente(id: number) {
  return _actionDesativarCliente(id);
}

export async function actionDesativarClientesEmMassa(ids: number[]) {
  return _actionDesativarClientesEmMassa(ids);
}

export async function actionCriarParteContraria(
  prevState: import('./actions/partes-form-actions').ActionResult | null,
  formData: FormData
) {
  return _actionCriarParteContraria(prevState, formData);
}

export async function actionAtualizarParteContraria(
  id: number,
  prevState: import('./actions/partes-form-actions').ActionResult | null,
  formData: FormData
) {
  return _actionAtualizarParteContraria(id, prevState, formData);
}

export async function actionCriarTerceiro(
  prevState: import('./actions/partes-form-actions').ActionResult | null,
  formData: FormData
) {
  return _actionCriarTerceiro(prevState, formData);
}

export async function actionAtualizarTerceiro(
  id: number,
  prevState: import('./actions/partes-form-actions').ActionResult | null,
  formData: FormData
) {
  return _actionAtualizarTerceiro(id, prevState, formData);
}
