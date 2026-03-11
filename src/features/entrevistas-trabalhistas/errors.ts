import type { AppError } from '@/types';

export function entrevistaNotFoundError(id: number): AppError {
  return {
    code: 'NOT_FOUND',
    message: `Entrevista trabalhista #${id} não encontrada`,
    details: { entrevistaId: id },
  };
}

export function entrevistaContratoNotFoundError(contratoId: number): AppError {
  return {
    code: 'NOT_FOUND',
    message: `Nenhuma entrevista encontrada para o contrato #${contratoId}`,
    details: { contratoId },
  };
}

export function entrevistaJaExisteError(contratoId: number): AppError {
  return {
    code: 'VALIDATION_ERROR',
    message: `Já existe uma entrevista para o contrato #${contratoId}`,
    details: { contratoId },
  };
}

export function entrevistaValidationError(
  message: string,
  details?: Record<string, unknown>,
): AppError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details,
  };
}

export function entrevistaDatabaseError(
  message: string,
  cause?: Error,
): AppError {
  return {
    code: 'DATABASE_ERROR',
    message,
    cause,
  };
}

export function entrevistaStatusInvalidoError(
  statusAtual: string,
  statusDesejado: string,
): AppError {
  return {
    code: 'VALIDATION_ERROR',
    message: `Transição de status inválida: ${statusAtual} → ${statusDesejado}`,
    details: { statusAtual, statusDesejado },
  };
}
