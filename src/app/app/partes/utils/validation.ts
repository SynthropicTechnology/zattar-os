import { ZodSchema } from 'zod';
import { Result, ok, err, appError, AppError } from '@/types';

/**
 * Valida o input usando um schema Zod
 */
export function validarInput<T>(schema: ZodSchema, input: unknown): Result<T> {
  const validation = schema.safeParse(input);
  
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }
  
  return ok(validation.data as T);
}

/**
 * Verifica duplicidade de documento (CPF/CNPJ)
 * Retorna erro se encontrar registro duplicado
 */
export async function verificarDuplicidadeDocumento<T extends { id: number }>(
  documento: string | undefined | null,
  finder: (doc: string) => Promise<Result<T | null>>,
  errorFactory: (doc: string, id: number) => AppError
): Promise<Result<void>> {
  if (!documento) return ok(undefined);
  
  const result = await finder(documento);
  if (!result.success) return err(result.error);
  
  if (result.data) {
    return err(errorFactory(documento, result.data.id));
  }
  
  return ok(undefined);
}

/**
 * Verifica duplicidade de documento para atualização (ignora o próprio ID)
 */
export async function verificarDuplicidadeDocumentoUpdate<T extends { id: number }>(
  documento: string | undefined | null,
  currentId: number,
  finder: (doc: string) => Promise<Result<T | null>>,
  errorFactory: (doc: string, id: number) => AppError
): Promise<Result<void>> {
  if (!documento) return ok(undefined);
  
  const result = await finder(documento);
  if (!result.success) return err(result.error);
  
  if (result.data && result.data.id !== currentId) {
    return err(errorFactory(documento, result.data.id));
  }
  
  return ok(undefined);
}
