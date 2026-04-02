/**
 * PARTES ERRORS - Erros Customizados do Dominio
 *
 * Este arquivo define erros especificos do modulo de Partes
 * (Clientes, Partes Contrarias e Terceiros).
 *
 * CONVENCOES:
 * - Classes de erro estendem Error
 * - Cada erro tem propriedade `name` para identificacao
 * - Helpers para conversao de/para AppError
 * - Type guards para verificacao de tipo
 */

import { appError, type AppError } from '@/types';

// =============================================================================
// CLASSES DE ERRO
// =============================================================================

/**
 * Erro para documento duplicado (CPF ou CNPJ ja cadastrado)
 */
export class DocumentoDuplicadoError extends Error {
  public readonly tipoDocumento: 'CPF' | 'CNPJ';
  public readonly documento: string;
  public readonly entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  public readonly existingId?: number;

  constructor(
    tipoDocumento: 'CPF' | 'CNPJ',
    documento: string,
    entidade: 'cliente' | 'parte_contraria' | 'terceiro' = 'cliente',
    existingId?: number
  ) {
    const entidadeLabel = {
      cliente: 'Cliente',
      parte_contraria: 'Parte contraria',
      terceiro: 'Terceiro',
    }[entidade];

    super(`${entidadeLabel} com ${tipoDocumento} ${documento} ja cadastrado`);
    this.name = 'DocumentoDuplicadoError';
    this.tipoDocumento = tipoDocumento;
    this.documento = documento;
    this.entidade = entidade;
    this.existingId = existingId;
  }
}

/**
 * Erro para documento invalido (CPF ou CNPJ com formato incorreto)
 */
export class DocumentoInvalidoError extends Error {
  public readonly tipoDocumento: 'CPF' | 'CNPJ';
  public readonly documento: string;
  public readonly motivo?: string;

  constructor(tipoDocumento: 'CPF' | 'CNPJ', documento: string, motivo?: string) {
    const mensagem = motivo
      ? `${tipoDocumento} invalido: ${documento}. ${motivo}`
      : `${tipoDocumento} invalido: ${documento}`;
    super(mensagem);
    this.name = 'DocumentoInvalidoError';
    this.tipoDocumento = tipoDocumento;
    this.documento = documento;
    this.motivo = motivo;
  }
}

/**
 * Erro para tentativa de alterar tipo_pessoa (PF <-> PJ)
 */
export class TipoPessoaIncompativelError extends Error {
  public readonly tipoAtual: 'pf' | 'pj';
  public readonly tipoSolicitado: 'pf' | 'pj';

  constructor(tipoAtual: 'pf' | 'pj', tipoSolicitado: 'pf' | 'pj') {
    super(
      `Nao e possivel alterar tipo_pessoa de '${tipoAtual}' para '${tipoSolicitado}'. ` +
        `Esta operacao nao e permitida.`
    );
    this.name = 'TipoPessoaIncompativelError';
    this.tipoAtual = tipoAtual;
    this.tipoSolicitado = tipoSolicitado;
  }
}

/**
 * Erro para entidade nao encontrada
 */
export class EntidadeNaoEncontradaError extends Error {
  public readonly entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  public readonly identificador: number | string;
  public readonly tipoIdentificador: 'id' | 'cpf' | 'cnpj';

  constructor(
    entidade: 'cliente' | 'parte_contraria' | 'terceiro',
    identificador: number | string,
    tipoIdentificador: 'id' | 'cpf' | 'cnpj' = 'id'
  ) {
    const entidadeLabel = {
      cliente: 'Cliente',
      parte_contraria: 'Parte contraria',
      terceiro: 'Terceiro',
    }[entidade];

    super(`${entidadeLabel} com ${tipoIdentificador.toUpperCase()} ${identificador} nao encontrado`);
    this.name = 'EntidadeNaoEncontradaError';
    this.entidade = entidade;
    this.identificador = identificador;
    this.tipoIdentificador = tipoIdentificador;
  }
}

/**
 * Erro para validacao de campos
 */
export class CampoObrigatorioError extends Error {
  public readonly campo: string;
  public readonly entidade: string;

  constructor(campo: string, entidade: string = 'registro') {
    super(`Campo '${campo}' e obrigatorio para ${entidade}`);
    this.name = 'CampoObrigatorioError';
    this.campo = campo;
    this.entidade = entidade;
  }
}

/**
 * Erro para email invalido
 */
export class EmailInvalidoError extends Error {
  public readonly email: string;

  constructor(email: string) {
    super(`E-mail invalido: ${email}`);
    this.name = 'EmailInvalidoError';
    this.email = email;
  }
}

// =============================================================================
// HELPERS DE CONVERSAO
// =============================================================================

/**
 * Converte erros customizados do dominio para AppError
 */
export function toAppError(error: Error): AppError {
  if (error instanceof DocumentoDuplicadoError) {
    return appError('CONFLICT', error.message, {
      tipoDocumento: error.tipoDocumento,
      documento: error.documento,
      entidade: error.entidade,
      existingId: error.existingId,
    });
  }

  if (error instanceof DocumentoInvalidoError) {
    return appError('VALIDATION_ERROR', error.message, {
      tipoDocumento: error.tipoDocumento,
      documento: error.documento,
      motivo: error.motivo,
    });
  }

  if (error instanceof TipoPessoaIncompativelError) {
    return appError('VALIDATION_ERROR', error.message, {
      tipoAtual: error.tipoAtual,
      tipoSolicitado: error.tipoSolicitado,
    });
  }

  if (error instanceof EntidadeNaoEncontradaError) {
    return appError('NOT_FOUND', error.message, {
      entidade: error.entidade,
      identificador: error.identificador,
      tipoIdentificador: error.tipoIdentificador,
    });
  }

  if (error instanceof CampoObrigatorioError) {
    return appError('VALIDATION_ERROR', error.message, {
      campo: error.campo,
      entidade: error.entidade,
    });
  }

  if (error instanceof EmailInvalidoError) {
    return appError('VALIDATION_ERROR', error.message, {
      email: error.email,
    });
  }

  // Erro generico
  return appError('INTERNAL_ERROR', error.message, undefined, error);
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Verifica se erro e DocumentoDuplicadoError
 */
export function isDocumentoDuplicadoError(error: unknown): error is DocumentoDuplicadoError {
  return error instanceof DocumentoDuplicadoError;
}

/**
 * Verifica se erro e DocumentoInvalidoError
 */
export function isDocumentoInvalidoError(error: unknown): error is DocumentoInvalidoError {
  return error instanceof DocumentoInvalidoError;
}

/**
 * Verifica se erro e TipoPessoaIncompativelError
 */
export function isTipoPessoaIncompativelError(error: unknown): error is TipoPessoaIncompativelError {
  return error instanceof TipoPessoaIncompativelError;
}

/**
 * Verifica se erro e EntidadeNaoEncontradaError
 */
export function isEntidadeNaoEncontradaError(error: unknown): error is EntidadeNaoEncontradaError {
  return error instanceof EntidadeNaoEncontradaError;
}

/**
 * Verifica se erro e CampoObrigatorioError
 */
export function isCampoObrigatorioError(error: unknown): error is CampoObrigatorioError {
  return error instanceof CampoObrigatorioError;
}

/**
 * Verifica se erro e EmailInvalidoError
 */
export function isEmailInvalidoError(error: unknown): error is EmailInvalidoError {
  return error instanceof EmailInvalidoError;
}

/**
 * Verifica se erro e qualquer erro customizado de Partes
 */
export function isPartesError(
  error: unknown
): error is
  | DocumentoDuplicadoError
  | DocumentoInvalidoError
  | TipoPessoaIncompativelError
  | EntidadeNaoEncontradaError
  | CampoObrigatorioError
  | EmailInvalidoError {
  return (
    isDocumentoDuplicadoError(error) ||
    isDocumentoInvalidoError(error) ||
    isTipoPessoaIncompativelError(error) ||
    isEntidadeNaoEncontradaError(error) ||
    isCampoObrigatorioError(error) ||
    isEmailInvalidoError(error)
  );
}

// =============================================================================
// FABRICAS DE ERRO
// =============================================================================

/**
 * Cria erro de cliente com CPF duplicado
 */
export const clienteCpfDuplicadoError = (cpf: string, existingId?: number) =>
  new DocumentoDuplicadoError('CPF', cpf, 'cliente', existingId);

/**
 * Cria erro de cliente com CNPJ duplicado
 */
export const clienteCnpjDuplicadoError = (cnpj: string, existingId?: number) =>
  new DocumentoDuplicadoError('CNPJ', cnpj, 'cliente', existingId);

/**
 * Cria erro de parte contraria com CPF duplicado
 */
export const parteContrariaCpfDuplicadoError = (cpf: string, existingId?: number) =>
  new DocumentoDuplicadoError('CPF', cpf, 'parte_contraria', existingId);

/**
 * Cria erro de parte contraria com CNPJ duplicado
 */
export const parteContrariaCnpjDuplicadoError = (cnpj: string, existingId?: number) =>
  new DocumentoDuplicadoError('CNPJ', cnpj, 'parte_contraria', existingId);

/**
 * Cria erro de terceiro com CPF duplicado
 */
export const terceiroCpfDuplicadoError = (cpf: string, existingId?: number) =>
  new DocumentoDuplicadoError('CPF', cpf, 'terceiro', existingId);

/**
 * Cria erro de terceiro com CNPJ duplicado
 */
export const terceiroCnpjDuplicadoError = (cnpj: string, existingId?: number) =>
  new DocumentoDuplicadoError('CNPJ', cnpj, 'terceiro', existingId);

/**
 * Cria erro de cliente nao encontrado
 */
export const clienteNaoEncontradoError = (id: number) =>
  new EntidadeNaoEncontradaError('cliente', id);

/**
 * Cria erro de parte contraria nao encontrada
 */
export const parteContrariaNaoEncontradaError = (id: number) =>
  new EntidadeNaoEncontradaError('parte_contraria', id);

/**
 * Cria erro de terceiro nao encontrado
 */
export const terceiroNaoEncontradoError = (id: number) =>
  new EntidadeNaoEncontradaError('terceiro', id);

// =============================================================================
// CONVERSAO HTTP STATUS
// =============================================================================

import type { ErrorCode } from '@/types';

/**
 * Converte ErrorCode para HTTP status code
 */
export function errorCodeToHttpStatus(code: ErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
    case 'DATABASE_ERROR':
    case 'INTERNAL_ERROR':
    case 'EXTERNAL_SERVICE_ERROR':
    default:
      return 500;
  }
}

/**
 * Converte AppError para resposta HTTP padronizada
 */
export function appErrorToHttpResponse(error: AppError): {
  status: number;
  body: { error: string; code: ErrorCode; details?: Record<string, unknown> };
} {
  return {
    status: errorCodeToHttpStatus(error.code),
    body: {
      error: error.message,
      code: error.code,
      details: error.details,
    },
  };
}
