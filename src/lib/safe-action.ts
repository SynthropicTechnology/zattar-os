/**
 * Safe Action Wrapper para Arquitetura Synthropic 2.0
 *
 * Fornece wrappers padronizados para Server Actions que:
 * - Validam automaticamente com Zod schemas
 * - Tratam erros de forma consistente
 * - Injetam contexto do usuário autenticado
 * - São compatíveis com consumo por UI React E ferramentas MCP
 */

import { type ZodSchema, type ZodError } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';

// =============================================================================
// TIPOS
// =============================================================================

export type AuthenticatedUser = {
  id: number;
  nomeCompleto: string;
  emailCorporativo: string;
};

export type ActionContext = {
  user: AuthenticatedUser;
};

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

export type SafeActionHandler<TInput, TOutput> = (
  data: TInput,
  context: ActionContext
) => Promise<TOutput>;

export type PublicActionHandler<TInput, TOutput> = (
  data: TInput
) => Promise<TOutput>;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Converte erros do Zod para formato de errors por campo
 */
function formatZodErrors(zodError: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const err of zodError.errors) {
    const key = err.path.join('.');
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(err.message);
  }
  return errors;
}

/**
 * Extrai dados de FormData ou objeto JSON
 */
function extractInputData<T>(input: FormData | T): T {
  if (input instanceof FormData) {
    const data: Record<string, unknown> = {};
    input.forEach((value, key) => {
      // Trata arrays (campos com mesmo nome)
      if (data[key]) {
        if (Array.isArray(data[key])) {
          (data[key] as unknown[]).push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        // Converte strings vazias para undefined para campos opcionais
        if (value === '' || value === 'null' || value === 'undefined') {
          data[key] = undefined;
        } else if (value === 'true') {
          data[key] = true;
        } else if (value === 'false') {
          data[key] = false;
        } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
          // Tenta converter números, mas mantém strings que são números com zeros à esquerda
          const num = Number(value);
          if (value === num.toString() || value === num.toFixed(0)) {
            data[key] = num;
          } else {
            data[key] = value;
          }
        } else {
          data[key] = value;
        }
      }
    });
    return data as T;
  }
  return input;
}

// =============================================================================
// WRAPPERS DE ACTIONS
// =============================================================================

/**
 * Cria uma Server Action autenticada com validação Zod
 *
 * @example
 * ```ts
 * const createUserAction = authenticatedAction(
 *   z.object({ name: z.string(), email: z.string().email() }),
 *   async (data, { user }) => {
 *     const newUser = await createUser({ ...data, createdBy: user.id });
 *     return { user: newUser, message: 'Usuário criado com sucesso' };
 *   }
 * );
 * ```
 */
export function authenticatedAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: SafeActionHandler<TInput, TOutput>
): (input: FormData | TInput) => Promise<ActionResult<TOutput>> {
  return async (input: FormData | TInput): Promise<ActionResult<TOutput>> => {
    try {
      // 1. Verificar autenticação
      const user = await authenticateRequest();
      if (!user) {
        return {
          success: false,
          error: 'Não autenticado',
          message: 'Você precisa estar autenticado para realizar esta ação',
        };
      }

      // 2. Extrair dados do input (FormData ou JSON)
      const rawData = extractInputData(input);

      // 3. Validar com Zod
      const validation = schema.safeParse(rawData);
      if (!validation.success) {
        return {
          success: false,
          error: 'Erro de validação',
          errors: formatZodErrors(validation.error),
          message: validation.error.errors[0]?.message || 'Dados inválidos',
        };
      }

      // 4. Executar handler com contexto
      const result = await handler(validation.data, { user });

      return {
        success: true,
        data: result,
        message: 'Operação realizada com sucesso',
      };
    } catch (error) {
      console.error('[SafeAction] Erro:', error);

      // Trata erros conhecidos
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
          message: error.message,
        };
      }

      return {
        success: false,
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado. Tente novamente.',
      };
    }
  };
}

/**
 * Cria uma Server Action pública (sem autenticação) com validação Zod
 *
 * @example
 * ```ts
 * const searchAction = publicAction(
 *   z.object({ query: z.string().min(3) }),
 *   async (data) => {
 *     const results = await search(data.query);
 *     return { results, count: results.length };
 *   }
 * );
 * ```
 */
export function publicAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: PublicActionHandler<TInput, TOutput>
): (input: FormData | TInput) => Promise<ActionResult<TOutput>> {
  return async (input: FormData | TInput): Promise<ActionResult<TOutput>> => {
    try {
      // 1. Extrair dados do input (FormData ou JSON)
      const rawData = extractInputData(input);

      // 2. Validar com Zod
      const validation = schema.safeParse(rawData);
      if (!validation.success) {
        return {
          success: false,
          error: 'Erro de validação',
          errors: formatZodErrors(validation.error),
          message: validation.error.errors[0]?.message || 'Dados inválidos',
        };
      }

      // 3. Executar handler
      const result = await handler(validation.data);

      return {
        success: true,
        data: result,
        message: 'Operação realizada com sucesso',
      };
    } catch (error) {
      console.error('[SafeAction] Erro:', error);

      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
          message: error.message,
        };
      }

      return {
        success: false,
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado. Tente novamente.',
      };
    }
  };
}

/**
 * Cria uma Server Action autenticada para uso com useActionState
 * (compatível com o padrão (prevState, formData) do React)
 *
 * @example
 * ```ts
 * const [state, formAction] = useActionState(createUserFormAction, null);
 * ```
 */
export function authenticatedFormAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: SafeActionHandler<TInput, TOutput>
): (
  prevState: ActionResult<TOutput> | null,
  formData: FormData
) => Promise<ActionResult<TOutput>> {
  const action = authenticatedAction(schema, handler);
  return async (
    _prevState: ActionResult<TOutput> | null,
    formData: FormData
  ): Promise<ActionResult<TOutput>> => {
    return action(formData);
  };
}

/**
 * Cria uma Server Action pública para uso com useActionState
 */
export function publicFormAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: PublicActionHandler<TInput, TOutput>
): (
  prevState: ActionResult<TOutput> | null,
  formData: FormData
) => Promise<ActionResult<TOutput>> {
  const action = publicAction(schema, handler);
  return async (
    _prevState: ActionResult<TOutput> | null,
    formData: FormData
  ): Promise<ActionResult<TOutput>> => {
    return action(formData);
  };
}
