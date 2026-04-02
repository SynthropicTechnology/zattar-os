/**
 * Compat layer: historically, other modules import types/schemas from
 * `@/app/app/expedientes/types`.
 *
 * The canonical source of truth for expedientes types and schemas lives in
 * `src/features/expedientes/domain.ts`.
 */

export * from './domain';


