/**
 * CHATWOOT SYNC HOOKS - Auto-sincronização com Chatwoot
 *
 * Funções wrapper que encapsulam operações de clientes e disparam
 * sincronização automática com o Chatwoot após create/update.
 *
 * Uso:
 * - Substitua `saveCliente` por `saveClienteComSync` para auto-sync
 * - Substitua `updateCliente` por `updateClienteComSync` para auto-sync
 */

import { Result, ok } from '@/types';
import type { Cliente, CreateClienteInput, UpdateClienteInput } from '@/app/(authenticated)/partes';
import {
  saveCliente,
  updateCliente,
} from '@/app/(authenticated)/partes/server';
import { sincronizarParteComChatwoot } from './service';
import { isChatwootConfigured } from '@/lib/chatwoot';

// =============================================================================
// Configuração
// =============================================================================

/**
 * Se true, erros de sincronização com Chatwoot não bloqueiam a operação principal
 * (fail-open). Se false, propaga o erro.
 */
const SYNC_FAIL_OPEN = true;

/**
 * Se true, logs de sincronização são emitidos no console
 */
const SYNC_LOGGING = process.env.NODE_ENV !== 'production';

// =============================================================================
// Helpers
// =============================================================================

function logSync(message: string, data?: unknown): void {
  if (SYNC_LOGGING) {
    console.log(`[Chatwoot Sync] ${message}`, data ?? '');
  }
}

function logSyncError(message: string, error: unknown): void {
  console.error(`[Chatwoot Sync Error] ${message}`, error);
}

/**
 * Dispara sincronização de cliente com Chatwoot de forma assíncrona (fire-and-forget)
 * Não bloqueia a operação principal
 */
async function triggerClienteSync(cliente: Cliente): Promise<void> {
  if (!(await isChatwootConfigured())) {
    logSync('Chatwoot não configurado, pulando sincronização');
    return;
  }

  try {
    logSync(`Sincronizando cliente ${cliente.id} (${cliente.nome})`);

    const result = await sincronizarParteComChatwoot(
      cliente as Parameters<typeof sincronizarParteComChatwoot>[0],
      'cliente'
    );

    if (result.success && result.data.sucesso) {
      logSync(`Cliente ${cliente.id} sincronizado com sucesso`, {
        chatwoot_contact_id: result.data.chatwoot_contact_id,
        criado: result.data.criado,
      });
    } else {
      const erro = result.success ? result.data.erro : result.error.message;
      logSyncError(`Falha ao sincronizar cliente ${cliente.id}`, erro);
    }
  } catch (error) {
    logSyncError(`Erro inesperado ao sincronizar cliente ${cliente.id}`, error);
  }
}

// =============================================================================
// Wrappers com Auto-Sync
// =============================================================================

/**
 * Salva um novo cliente e sincroniza automaticamente com Chatwoot
 *
 * @param input Dados do cliente a criar
 * @param syncImediato Se true (padrão), sincroniza imediatamente. Se false, retorna sem sincronizar.
 * @returns Result com o cliente criado
 */
export async function saveClienteComSync(
  input: CreateClienteInput,
  syncImediato = true
): Promise<Result<Cliente>> {
  // Primeiro, salva o cliente no banco
  const saveResult = await saveCliente(input);

  if (!saveResult.success) {
    return saveResult;
  }

  const cliente = saveResult.data;

  // Se sync imediato está habilitado, dispara sincronização
  if (syncImediato) {
    if (SYNC_FAIL_OPEN) {
      // Fire-and-forget: não espera nem propaga erro
      triggerClienteSync(cliente).catch((err) => {
        logSyncError('Erro no fire-and-forget sync', err);
      });
    } else {
      // Aguarda sync e propaga erro se falhar
      await triggerClienteSync(cliente);
    }
  }

  return ok(cliente);
}

/**
 * Atualiza um cliente existente e sincroniza automaticamente com Chatwoot
 *
 * @param id ID do cliente
 * @param input Dados a atualizar
 * @param dadosAnteriores Dados anteriores (para histórico)
 * @param syncImediato Se true (padrão), sincroniza imediatamente
 * @returns Result com o cliente atualizado
 */
export async function updateClienteComSync(
  id: number,
  input: UpdateClienteInput,
  dadosAnteriores?: Cliente,
  syncImediato = true
): Promise<Result<Cliente>> {
  // Primeiro, atualiza o cliente no banco
  const updateResult = await updateCliente(id, input, dadosAnteriores);

  if (!updateResult.success) {
    return updateResult;
  }

  const cliente = updateResult.data;

  // Se sync imediato está habilitado, dispara sincronização
  if (syncImediato) {
    if (SYNC_FAIL_OPEN) {
      // Fire-and-forget
      triggerClienteSync(cliente).catch((err) => {
        logSyncError('Erro no fire-and-forget sync', err);
      });
    } else {
      await triggerClienteSync(cliente);
    }
  }

  return ok(cliente);
}

// =============================================================================
// Sincronização Manual
// =============================================================================

/**
 * Sincroniza um cliente específico com Chatwoot (útil para re-sync manual)
 *
 * @param clienteId ID do cliente a sincronizar
 * @returns Result indicando sucesso ou falha
 */
export async function sincronizarClienteManual(
  clienteId: number
): Promise<Result<{ chatwoot_contact_id: number | null; criado: boolean }>> {
  const { findClienteById } = await import('@/app/(authenticated)/partes/server');

  const clienteResult = await findClienteById(clienteId);

  if (!clienteResult.success) {
    return clienteResult as Result<{ chatwoot_contact_id: number | null; criado: boolean }>;
  }

  if (!clienteResult.data) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Cliente ${clienteId} não encontrado` },
    } as Result<{ chatwoot_contact_id: number | null; criado: boolean }>;
  }

  const syncResult = await sincronizarParteComChatwoot(
    clienteResult.data as Parameters<typeof sincronizarParteComChatwoot>[0],
    'cliente'
  );

  if (!syncResult.success) {
    return syncResult as Result<{ chatwoot_contact_id: number | null; criado: boolean }>;
  }

  if (!syncResult.data.sucesso) {
    return {
      success: false,
      error: { code: 'EXTERNAL_SERVICE_ERROR', message: syncResult.data.erro ?? 'Falha na sincronização' },
    } as Result<{ chatwoot_contact_id: number | null; criado: boolean }>;
  }

  return ok({
    chatwoot_contact_id: syncResult.data.chatwoot_contact_id,
    criado: syncResult.data.criado,
  });
}
