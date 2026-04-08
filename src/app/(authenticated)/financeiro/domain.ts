/**
 * Domain Layer — Re-export centralizado (padrão FSD)
 *
 * Este arquivo serve como ponto de entrada único para a camada de domínio.
 * A implementação real está em `domain/`.
 *
 * @example
 * import { validarCriacaoLancamento } from '@/app/(authenticated)/financeiro/domain';
 */
export * from './domain/index';
