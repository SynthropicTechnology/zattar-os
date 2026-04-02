/**
 * PARTES SERVICE - Camada de Regras de Negocio (Casos de Uso)
 *
 * Este arquivo contem a logica de negocio para Clientes, Partes Contrarias e Terceiros.
 *
 * CONVENCOES:
 * - Funcoes nomeadas como acoes: criar, atualizar, listar, buscar, remover
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositorio)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import {
  type Cliente,
  type ParteContraria,
  type Terceiro,
  type CreateClienteInput,
  type UpdateClienteInput,
  type ListarClientesParams,
  type CreateParteContrariaInput,
  type UpdateParteContrariaInput,
  type ListarPartesContrariasParams,
  type CreateTerceiroInput,
  type UpdateTerceiroInput,
  type ListarTerceirosParams,
  createClienteSchema,
  updateClienteSchema,
  createParteContrariaSchema,
  updateParteContrariaSchema,
  createTerceiroSchema,
  updateTerceiroSchema,
  normalizarDocumento,
} from './domain';
import {
  findClienteById,
  findClienteByCPF,
  findClienteByCNPJ,
  findClientesByNome,
  findAllClientes,
  findAllClientesComEndereco,
  findAllClientesComEnderecoEProcessos,
  saveCliente,
  updateCliente as updateClienteRepo,
  upsertClienteByCPF,
  upsertClienteByCNPJ,
  softDeleteCliente,
  softDeleteClientesEmMassa,
  softDeletePartesContrariasEmMassa,
  softDeleteTerceirosEmMassa,
  countClientes,
  countClientesAteData,
  countClientesEntreDatas,
  countClientesPorEstado,
  countClientesPorEstadoComFiltro,
  findParteContrariaById,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
  findAllPartesContrariasComEnderecoEProcessos,
  saveParteContraria,
  updateParteContraria as updateParteContrariaRepo,
  countPartesContrarias,
  countPartesContrariasAteData,
  countPartesContrariasEntreDatas,
  findTerceiroById,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  findAllTerceiros,
  findAllTerceirosComEnderecoEProcessos,
  saveTerceiro,
  updateTerceiro as updateTerceiroRepo,
  countTerceiros,
  countTerceirosEntreDatas,
} from './repository';
import {
  listarRepresentantesRepo,
  listarRepresentantesComEnderecoRepo,
  listarRepresentantesComEnderecoEProcessosRepo,
  buscarRepresentantePorIdRepo,
  buscarRepresentantePorIdComEnderecoRepo,
  buscarRepresentantePorCPFRepo,
  buscarRepresentantePorNomeRepo,
  buscarRepresentantesPorOABRepo,
  criarRepresentanteRepo,
  atualizarRepresentanteRepo,
  deletarRepresentanteRepo,
  deletarRepresentantesEmMassaRepo,
  upsertRepresentantePorCPFRepo,
  countRepresentantesRepo,
  countRepresentantesEntreDatasRepo,
} from './repository';
import type {
  ClienteComEndereco,
  ClienteComEnderecoEProcessos,
  ParteContrariaComEnderecoEProcessos,
  TerceiroComEnderecoEProcessos,
} from './domain';
import type {
  AtualizarRepresentanteParams,
  BuscarRepresentantesPorOABParams,
  CriarRepresentanteParams,
  ListarRepresentantesParams,
  UpsertRepresentantePorCPFParams,
  Representante,
  RepresentanteComEndereco,
} from './types/representantes';
import {
  clienteCpfDuplicadoError,
  clienteCnpjDuplicadoError,
  clienteNaoEncontradoError,
  toAppError,
} from './errors';
import { validarInput, verificarDuplicidadeDocumento } from './utils';

// =============================================================================
// SERVICOS - CLIENTE
// =============================================================================

/**
 * Cria um novo cliente
 */
export async function criarCliente(input: CreateClienteInput): Promise<Result<Cliente>> {
  // 1. Validar input com Zod
  const valResult = validarInput<CreateClienteInput>(createClienteSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  // 2. Verificar duplicidade
  if (dadosValidados.tipo_pessoa === 'pf') {
    const dupResult = await verificarDuplicidadeDocumento(
      dadosValidados.cpf,
      findClienteByCPF,
      (doc, id) => toAppError(clienteCpfDuplicadoError(doc, id))
    );
    if (!dupResult.success) return err(dupResult.error);
  } else {
    const dupResult = await verificarDuplicidadeDocumento(
      dadosValidados.cnpj,
      findClienteByCNPJ,
      (doc, id) => toAppError(clienteCnpjDuplicadoError(doc, id))
    );
    if (!dupResult.success) return err(dupResult.error);
  }

  // 3. Persistir via repositorio
  return saveCliente(dadosValidados);
}

/**
 * Busca um cliente pelo ID
 */
export async function buscarCliente(id: number): Promise<Result<Cliente | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findClienteById(id);
}

/**
 * Busca um cliente pelo documento (CPF ou CNPJ)
 */
export async function buscarClientePorDocumento(documento: string): Promise<Result<Cliente | null>> {
  if (!documento?.trim()) {
    return err(appError('VALIDATION_ERROR', 'Documento e obrigatorio'));
  }

  const docNormalizado = normalizarDocumento(documento);

  if (docNormalizado.length === 11) {
    return findClienteByCPF(docNormalizado);
  } else if (docNormalizado.length === 14) {
    return findClienteByCNPJ(docNormalizado);
  } else {
    return err(appError('VALIDATION_ERROR', 'Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos'));
  }
}

/**
 * Busca cliente por CPF com endereco e processos relacionados (para MCP)
 */
export async function buscarClientePorCPF(cpf: string): Promise<Result<ClienteComEnderecoEProcessos | null>> {
  if (!cpf?.trim()) {
    return err(appError('VALIDATION_ERROR', 'CPF e obrigatorio'));
  }

  const cpfNormalizado = normalizarDocumento(cpf);

  if (cpfNormalizado.length !== 11) {
    return err(appError('VALIDATION_ERROR', 'CPF deve conter 11 digitos'));
  }

  // Busca cliente por CPF
  const clienteResult = await findClienteByCPF(cpfNormalizado);
  if (!clienteResult.success) return err(clienteResult.error);
  if (!clienteResult.data) return ok(null);

  // Busca com endereco e processos relacionados
  const clienteComDadosResult = await findAllClientesComEnderecoEProcessos({
    cpf: cpfNormalizado,
    limite: 1,
  });

  if (!clienteComDadosResult.success) return err(clienteComDadosResult.error);
  if (clienteComDadosResult.data.data.length === 0) return ok(null);

  return ok(clienteComDadosResult.data.data[0]);
}

/**
 * Busca cliente por CNPJ com endereco e processos relacionados (para MCP)
 */
export async function buscarClientePorCNPJ(cnpj: string): Promise<Result<ClienteComEnderecoEProcessos | null>> {
  if (!cnpj?.trim()) {
    return err(appError('VALIDATION_ERROR', 'CNPJ e obrigatorio'));
  }

  const cnpjNormalizado = normalizarDocumento(cnpj);

  if (cnpjNormalizado.length !== 14) {
    return err(appError('VALIDATION_ERROR', 'CNPJ deve conter 14 digitos'));
  }

  // Busca cliente por CNPJ
  const clienteResult = await findClienteByCNPJ(cnpjNormalizado);
  if (!clienteResult.success) return err(clienteResult.error);
  if (!clienteResult.data) return ok(null);

  // Busca com endereco e processos relacionados
  const clienteComDadosResult = await findAllClientesComEnderecoEProcessos({
    cnpj: cnpjNormalizado,
    limite: 1,
  });

  if (!clienteComDadosResult.success) return err(clienteComDadosResult.error);
  if (clienteComDadosResult.data.data.length === 0) return ok(null);

  return ok(clienteComDadosResult.data.data[0]);
}

/**
 * Busca clientes pelo nome (busca parcial)
 */
export async function buscarClientesPorNome(
  nome: string,
  limite: number = 100
): Promise<Result<Cliente[]>> {
  if (!nome?.trim()) {
    return ok([]);
  }

  const limiteSeguro = Math.min(limite, 100);
  return findClientesByNome(nome, limiteSeguro);
}

/**
 * Lista clientes com filtros e paginacao
 */
export async function listarClientes(
  params: ListarClientesParams = {}
): Promise<Result<PaginatedResponse<Cliente | ClienteComEndereco | ClienteComEnderecoEProcessos>>> {
  const sanitizedParams: ListarClientesParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  if (sanitizedParams.incluir_processos) {
    return findAllClientesComEnderecoEProcessos(sanitizedParams);
  }

  if (sanitizedParams.incluir_endereco) {
    return findAllClientesComEndereco(sanitizedParams);
  }

  return findAllClientes(sanitizedParams);
}

/**
 * Conta o total de clientes no banco
 */
export async function contarClientes(): Promise<Result<number>> {
  return countClientes();
}

/**
 * Conta clientes criados até uma data específica
 */
export async function contarClientesAteData(dataLimite: Date): Promise<Result<number>> {
  return countClientesAteData(dataLimite);
}

/**
 * Conta clientes criados entre duas datas (inclusive)
 */
export async function contarClientesEntreDatas(dataInicio: Date, dataFim: Date): Promise<Result<number>> {
  return countClientesEntreDatas(dataInicio, dataFim);
}

/**
 * Conta clientes agrupados por estado
 */
export async function contarClientesPorEstado(limite: number = 4): Promise<Result<Array<{ estado: string; count: number }>>> {
  return countClientesPorEstado(limite);
}

/**
 * Conta clientes por estado com filtro de período (via created_at do cliente)
 */
export async function contarClientesPorEstadoComFiltro(params: {
  limite?: number;
  dataInicio?: Date;
  dataFim?: Date;
}): Promise<Result<Array<{ estado: string; count: number }>>> {
  return countClientesPorEstadoComFiltro(params);
}

/**
 * Atualiza um cliente existente
 */
export async function atualizarCliente(
  id: number,
  input: UpdateClienteInput
): Promise<Result<Cliente>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  // 2. Validar input
  const valResult = validarInput<UpdateClienteInput>(updateClienteSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  // 3. Verificar se cliente existe
  const existingResult = await findClienteById(id);
  if (!existingResult.success) return existingResult;
  if (!existingResult.data) {
    return err(toAppError(clienteNaoEncontradoError(id)));
  }

  const clienteExistente = existingResult.data;

  // 4. Verificar duplicidade de CPF (verificação manual para updates)
  if (dadosValidados.cpf && dadosValidados.cpf !== clienteExistente.cpf) {
    const existing = await findClienteByCPF(dadosValidados.cpf);
    if (existing.success && existing.data && existing.data.id !== id) {
      return err(toAppError(clienteCpfDuplicadoError(dadosValidados.cpf, existing.data.id)));
    }
  }

  if (dadosValidados.cnpj && dadosValidados.cnpj !== clienteExistente.cnpj) {
      const existing = await findClienteByCNPJ(dadosValidados.cnpj);
       if (existing.success && existing.data && existing.data.id !== id) {
          return err(toAppError(clienteCnpjDuplicadoError(dadosValidados.cnpj, existing.data.id)));
       }
  }

  // 5. Atualizar
  return updateClienteRepo(id, dadosValidados, clienteExistente);
}

/**
 * Upsert de cliente por documento
 */
export async function upsertCliente(
  input: CreateClienteInput
): Promise<Result<{ cliente: Cliente; created: boolean }>> {
  const valResult = validarInput<CreateClienteInput>(createClienteSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  if (dadosValidados.tipo_pessoa === 'pf') {
    return upsertClienteByCPF(dadosValidados.cpf, dadosValidados);
  } else {
    return upsertClienteByCNPJ(dadosValidados.cnpj, dadosValidados);
  }
}

/**
 * Desativa um cliente
 */
export async function desativarCliente(id: number): Promise<Result<void>> {
  if (!id || id <= 0) return err(appError('VALIDATION_ERROR', 'ID invalido'));
  
  const existingResult = await findClienteById(id);
  if (!existingResult.success) return existingResult;
  if (!existingResult.data) return err(appError('NOT_FOUND', `Cliente com ID ${id} nao encontrado`));

  return softDeleteCliente(id);
}

/**
 * Desativa múltiplos clientes (soft delete em massa)
 */
export async function desativarClientesEmMassa(ids: number[]): Promise<Result<number>> {
  if (!ids.length) return err(appError('VALIDATION_ERROR', 'Nenhum ID informado'));
  const uniqueIds = [...new Set(ids.filter((id) => id > 0))];
  if (!uniqueIds.length) return err(appError('VALIDATION_ERROR', 'IDs invalidos'));

  return softDeleteClientesEmMassa(uniqueIds);
}

// =============================================================================
// SERVICOS - PARTE CONTRARIA
// =============================================================================

/**
 * Cria uma nova parte contraria
 */
export async function criarParteContraria(
  input: CreateParteContrariaInput
): Promise<Result<ParteContraria>> {
  const valResult = validarInput<CreateParteContrariaInput>(createParteContrariaSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  if (dadosValidados.tipo_pessoa === 'pf') {
    const dupResult = await verificarDuplicidadeDocumento(
      dadosValidados.cpf,
      findParteContrariaByCPF,
      (doc, id) => appError('CONFLICT', 'Parte contraria com este CPF ja cadastrada', { field: 'cpf', existingId: id })
    );
    if (!dupResult.success) return err(dupResult.error);
  } else {
    const dupResult = await verificarDuplicidadeDocumento(
      dadosValidados.cnpj,
      findParteContrariaByCNPJ,
      (doc, id) => appError('CONFLICT', 'Parte contraria com este CNPJ ja cadastrada', { field: 'cnpj', existingId: id })
    );
    if (!dupResult.success) return err(dupResult.error);
  }

  return saveParteContraria(dadosValidados);
}

/**
 * Busca uma parte contraria pelo ID
 */
export async function buscarParteContraria(id: number): Promise<Result<ParteContraria | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findParteContrariaById(id);
}

/**
 * Busca uma parte contraria pelo documento
 */
export async function buscarParteContrariaPorDocumento(
  documento: string
): Promise<Result<ParteContraria | null>> {
  if (!documento?.trim()) {
    return err(appError('VALIDATION_ERROR', 'Documento e obrigatorio'));
  }

  const docNormalizado = normalizarDocumento(documento);

  if (docNormalizado.length === 11) {
    return findParteContrariaByCPF(docNormalizado);
  } else if (docNormalizado.length === 14) {
    return findParteContrariaByCNPJ(docNormalizado);
  } else {
    return err(appError('VALIDATION_ERROR', 'Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos'));
  }
}

/**
 * Lista partes contrarias
 */
export async function listarPartesContrarias(
  params: ListarPartesContrariasParams = {}
): Promise<Result<PaginatedResponse<ParteContraria | ParteContrariaComEnderecoEProcessos>>> {
  const sanitizedParams: ListarPartesContrariasParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  if (sanitizedParams.incluir_processos || sanitizedParams.incluir_endereco) {
    return findAllPartesContrariasComEnderecoEProcessos(sanitizedParams);
  }

  return findAllPartesContrarias(sanitizedParams);
}

/**
 * Conta o total de partes contrárias no banco
 */
export async function contarPartesContrarias(): Promise<Result<number>> {
  return countPartesContrarias();
}

/**
 * Conta partes contrárias criadas até uma data específica
 */
export async function contarPartesContrariasAteData(dataLimite: Date): Promise<Result<number>> {
  return countPartesContrariasAteData(dataLimite);
}

/**
 * Conta partes contrárias criadas entre duas datas (inclusive)
 */
export async function contarPartesContrariasEntreDatas(dataInicio: Date, dataFim: Date): Promise<Result<number>> {
  return countPartesContrariasEntreDatas(dataInicio, dataFim);
}

/**
 * Atualiza uma parte contraria existente
 */
export async function atualizarParteContraria(
  id: number,
  input: UpdateParteContrariaInput
): Promise<Result<ParteContraria>> {
  if (!id || id <= 0) return err(appError('VALIDATION_ERROR', 'ID invalido'));

  const valResult = validarInput<UpdateParteContrariaInput>(updateParteContrariaSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  const existingResult = await findParteContrariaById(id);
  if (!existingResult.success) return existingResult;
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Parte contraria com ID ${id} nao encontrada`));
  }
  const parteExistente = existingResult.data;

  // Verificar duplicidade (manual check for update)
  if (dadosValidados.cpf && dadosValidados.cpf !== parteExistente.cpf) {
     const existing = await findParteContrariaByCPF(dadosValidados.cpf);
     if (existing.success && existing.data && existing.data.id !== id) {
        return err(appError('CONFLICT', 'Outra parte contraria com este CPF ja cadastrada', { field: 'cpf', existingId: existing.data.id }));
     }
  }

  if (dadosValidados.cnpj && dadosValidados.cnpj !== parteExistente.cnpj) {
     const existing = await findParteContrariaByCNPJ(dadosValidados.cnpj);
     if (existing.success && existing.data && existing.data.id !== id) {
        return err(appError('CONFLICT', 'Outra parte contraria com este CNPJ ja cadastrada', { field: 'cnpj', existingId: existing.data.id }));
     }
  }

  return updateParteContrariaRepo(id, dadosValidados, parteExistente);
}

/**
 * Desativa múltiplas partes contrárias (soft delete em massa)
 */
export async function desativarPartesContrariasEmMassa(ids: number[]): Promise<Result<number>> {
  if (!ids.length) return err(appError('VALIDATION_ERROR', 'Nenhum ID informado'));
  const uniqueIds = [...new Set(ids.filter((id) => id > 0))];
  if (!uniqueIds.length) return err(appError('VALIDATION_ERROR', 'IDs invalidos'));

  return softDeletePartesContrariasEmMassa(uniqueIds);
}

// =============================================================================
// SERVICOS - TERCEIRO
// =============================================================================

/**
 * Cria um novo terceiro
 */
export async function criarTerceiro(input: CreateTerceiroInput): Promise<Result<Terceiro>> {
  const valResult = validarInput<CreateTerceiroInput>(createTerceiroSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  if (dadosValidados.tipo_pessoa === 'pf') {
     const dupResult = await verificarDuplicidadeDocumento(
      dadosValidados.cpf,
      findTerceiroByCPF,
      (doc, id) => appError('CONFLICT', 'Terceiro com este CPF ja cadastrado', { field: 'cpf', existingId: id })
    );
    if (!dupResult.success) return err(dupResult.error);
  } else {
     const dupResult = await verificarDuplicidadeDocumento(
      dadosValidados.cnpj,
      findTerceiroByCNPJ,
      (doc, id) => appError('CONFLICT', 'Terceiro com este CNPJ ja cadastrado', { field: 'cnpj', existingId: id })
    );
    if (!dupResult.success) return err(dupResult.error);
  }

  return saveTerceiro(dadosValidados);
}

/**
 * Busca um terceiro pelo ID
 */
export async function buscarTerceiro(id: number): Promise<Result<Terceiro | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findTerceiroById(id);
}

/**
 * Busca um terceiro pelo documento
 */
export async function buscarTerceiroPorDocumento(documento: string): Promise<Result<Terceiro | null>> {
  if (!documento?.trim()) {
    return err(appError('VALIDATION_ERROR', 'Documento e obrigatorio'));
  }

  const docNormalizado = normalizarDocumento(documento);

  if (docNormalizado.length === 11) {
    return findTerceiroByCPF(docNormalizado);
  } else if (docNormalizado.length === 14) {
    return findTerceiroByCNPJ(docNormalizado);
  } else {
    return err(appError('VALIDATION_ERROR', 'Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos'));
  }
}

/**
 * Busca terceiros pelo nome (busca parcial)
 */
export async function buscarTerceirosPorNome(nome: string): Promise<Result<Terceiro[]>> {
  if (!nome?.trim()) {
    return ok([]);
  }
  
  const result = await findAllTerceiros({ nome, limite: 100 });
  if (!result.success) return err(result.error);
  return ok(result.data.data);
}

/**
 * Lista terceiros
 */
export async function listarTerceiros(
  params: ListarTerceirosParams = {}
): Promise<Result<PaginatedResponse<Terceiro | TerceiroComEnderecoEProcessos>>> {
  const sanitizedParams: ListarTerceirosParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  if (sanitizedParams.incluir_processos || sanitizedParams.incluir_endereco) {
    return findAllTerceirosComEnderecoEProcessos(sanitizedParams);
  }

  return findAllTerceiros(sanitizedParams);
}

/**
 * Atualiza um terceiro existente
 */
export async function atualizarTerceiro(
  id: number,
  input: UpdateTerceiroInput
): Promise<Result<Terceiro>> {
  if (!id || id <= 0) return err(appError('VALIDATION_ERROR', 'ID invalido'));

  const valResult = validarInput<UpdateTerceiroInput>(updateTerceiroSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  const existingResult = await findTerceiroById(id);
  if (!existingResult.success) return existingResult;
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Terceiro com ID ${id} nao encontrado`));
  }
  const terceiroExistente = existingResult.data;

  if (dadosValidados.cpf && dadosValidados.cpf !== terceiroExistente.cpf) {
     const existing = await findTerceiroByCPF(dadosValidados.cpf);
     if (existing.success && existing.data && existing.data.id !== id) {
        return err(appError('CONFLICT', 'Outro terceiro com este CPF ja cadastrado', { field: 'cpf', existingId: existing.data.id }));
     }
  }

  if (dadosValidados.cnpj && dadosValidados.cnpj !== terceiroExistente.cnpj) {
     const existing = await findTerceiroByCNPJ(dadosValidados.cnpj);
     if (existing.success && existing.data && existing.data.id !== id) {
        return err(appError('CONFLICT', 'Outro terceiro com este CNPJ ja cadastrado', { field: 'cnpj', existingId: existing.data.id }));
     }
  }

  return updateTerceiroRepo(id, dadosValidados, terceiroExistente);
}

/**
 * Desativa múltiplos terceiros (soft delete em massa)
 */
export async function desativarTerceirosEmMassa(ids: number[]): Promise<Result<number>> {
  if (!ids.length) return err(appError('VALIDATION_ERROR', 'Nenhum ID informado'));
  const uniqueIds = [...new Set(ids.filter((id) => id > 0))];
  if (!uniqueIds.length) return err(appError('VALIDATION_ERROR', 'IDs invalidos'));

  return softDeleteTerceirosEmMassa(uniqueIds);
}

/**
 * Conta o total de terceiros no banco
 */
export async function contarTerceiros(): Promise<Result<number>> {
  return countTerceiros();
}

/**
 * Conta terceiros criados entre duas datas (inclusive)
 */
export async function contarTerceirosEntreDatas(dataInicio: Date, dataFim: Date): Promise<Result<number>> {
  return countTerceirosEntreDatas(dataInicio, dataFim);
}

// =============================================================================
// SERVICOS - REPRESENTANTE
// =============================================================================

function validarCpfBasico(cpf: string): boolean {
  const d = cpf.replace(/[.\-\s]/g, '');
  return d.length === 11 && !/^(\d)\1{10}$/.test(d);
}

export async function listarRepresentantes(
  params: ListarRepresentantesParams
): Promise<Result<PaginatedResponse<Representante>>> {
  try {
    const result = await listarRepresentantesRepo(params);
    return ok({
      data: result.representantes,
      pagination: {
        page: result.pagina,
        limit: result.limite,
        total: result.total,
        totalPages: result.totalPaginas,
        hasMore: result.pagina < result.totalPaginas
      }
    });
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function listarRepresentantesComEndereco(
  params: ListarRepresentantesParams
): Promise<Result<PaginatedResponse<Representante>>> {
  try {
    const result = await listarRepresentantesComEnderecoRepo(params);
    return ok({
      data: result.representantes,
      pagination: {
        page: result.pagina,
        limit: result.limite,
        total: result.total,
        totalPages: result.totalPaginas,
        hasMore: result.pagina < result.totalPaginas
      }
    });
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function listarRepresentantesComEnderecoEProcessos(
  params: ListarRepresentantesParams
): Promise<Result<PaginatedResponse<Representante>>> {
  try {
    const result = await listarRepresentantesComEnderecoEProcessosRepo(params);
    return ok({
      data: result.representantes,
      pagination: {
        page: result.pagina,
        limit: result.limite,
        total: result.total,
        totalPages: result.totalPaginas,
        hasMore: result.pagina < result.totalPaginas
      }
    });
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function buscarRepresentantePorId(id: number): Promise<Result<Representante | null>> {
  try {
    const result = await buscarRepresentantePorIdRepo(id);
    return ok(result);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function buscarRepresentantePorIdComEndereco(
  id: number
): Promise<Result<RepresentanteComEndereco | null>> {
  try {
    const result = await buscarRepresentantePorIdComEnderecoRepo(id);
    return ok(result);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function buscarRepresentantePorCPF(cpf: string): Promise<Result<Representante | null>> {
  try {
    const result = await buscarRepresentantePorCPFRepo(cpf);
    return ok(result);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function buscarRepresentantePorNome(nome: string): Promise<Result<Representante[]>> {
  try {
    const n = nome.trim();
    if (n.length < 3) return err(appError('VALIDATION_ERROR', 'Nome deve ter pelo menos 3 caracteres para busca.'));
    const result = await buscarRepresentantePorNomeRepo(n);
    return ok(result);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function buscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<Result<Representante[]>> {
  try {
    if (!params.oab?.trim()) return err(appError('VALIDATION_ERROR', 'Número OAB não informado'));
    const result = await buscarRepresentantesPorOABRepo(params);
    return ok(result);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function criarRepresentante(params: CriarRepresentanteParams): Promise<Result<Representante>> {
  try {
    if (!params.cpf || !params.nome) {
      return err(appError('VALIDATION_ERROR', 'Campos obrigatórios não informados (cpf, nome)'));
    }
    if (!validarCpfBasico(params.cpf)) {
      return err(appError('VALIDATION_ERROR', 'CPF inválido'));
    }
    const result = await criarRepresentanteRepo(params);
    if (!result.sucesso) return err(appError('DATABASE_ERROR', result.erro || 'Erro desconhecido'));
    if (!result.representante) return err(appError('DATABASE_ERROR', 'Representante não retornado'));
    return ok(result.representante);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function atualizarRepresentante(
  params: AtualizarRepresentanteParams
): Promise<Result<Representante>> {
  try {
    if (!params.id || params.id <= 0) return err(appError('VALIDATION_ERROR', 'ID inválido'));
    if (params.cpf && !validarCpfBasico(params.cpf)) return err(appError('VALIDATION_ERROR', 'CPF inválido'));
    const result = await atualizarRepresentanteRepo(params);
    if (!result.sucesso) return err(appError('DATABASE_ERROR', result.erro || 'Erro desconhecido'));
    if (!result.representante) return err(appError('DATABASE_ERROR', 'Representante não retornado'));
    return ok(result.representante);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function deletarRepresentante(id: number): Promise<Result<void>> {
  try {
    if (!id || id <= 0) return err(appError('VALIDATION_ERROR', 'ID inválido'));
    const result = await deletarRepresentanteRepo(id);
    if (!result.sucesso) return err(appError('DATABASE_ERROR', result.erro || 'Erro desconhecido'));
    return ok(undefined);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

/**
 * Exclui múltiplos representantes permanentemente (hard delete em massa)
 */
export async function deletarRepresentantesEmMassa(ids: number[]): Promise<Result<number>> {
  if (!ids.length) return err(appError('VALIDATION_ERROR', 'Nenhum ID informado'));
  const uniqueIds = [...new Set(ids.filter((id) => id > 0))];
  if (!uniqueIds.length) return err(appError('VALIDATION_ERROR', 'IDs invalidos'));

  try {
    const result = await deletarRepresentantesEmMassaRepo(uniqueIds);
    if (!result.sucesso) return err(appError('DATABASE_ERROR', result.erro || 'Erro desconhecido'));
    return ok(result.total);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

export async function upsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<Result<{ representante: Representante; created: boolean }>> {
  try {
    if (!params.cpf || !params.nome) {
      return err(appError('VALIDATION_ERROR', 'Campos obrigatórios não informados (cpf, nome)'));
    }
    if (!validarCpfBasico(params.cpf)) {
      return err(appError('VALIDATION_ERROR', 'CPF inválido'));
    }
    const result = await upsertRepresentantePorCPFRepo(params);
    if (!result.sucesso) return err(appError('DATABASE_ERROR', result.erro || 'Erro desconhecido'));
    if (!result.representante) return err(appError('DATABASE_ERROR', 'Representante não retornado'));
    return ok({ representante: result.representante, created: result.criado ?? false });
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

/**
 * Conta o total de representantes no banco
 */
export async function contarRepresentantes(): Promise<Result<number>> {
  try {
    const total = await countRepresentantesRepo();
    return ok(total);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}

/**
 * Conta representantes criados entre duas datas (inclusive)
 */
export async function contarRepresentantesEntreDatas(dataInicio: Date, dataFim: Date): Promise<Result<number>> {
  try {
    const total = await countRepresentantesEntreDatasRepo(dataInicio, dataFim);
    return ok(total);
  } catch (e) {
    return err(appError('DATABASE_ERROR', String(e)));
  }
}
