'use server';

/**
 * CHATWOOT ACTIONS - Server Actions para sincronização
 *
 * Actions para sincronização em lote de partes com Chatwoot.
 */

import { Result, ok, err, appError } from '@/types';
import { getChatwootConfigFromDatabase } from '@/lib/chatwoot/config';

async function isChatwootConfigured(): Promise<boolean> {
  const config = await getChatwootConfigFromDatabase();
  return config !== null;
}

import {
  sincronizarParteComChatwoot,
  sincronizarChatwootParaApp,
  processarWebhook,
  sincronizarConversaChatwoot,
  atualizarStatusConversa,
  type SincronizarChatwootParaAppResult,
  type WebhookEventType,
} from './service';
import type { TipoEntidadeChatwoot } from './domain';
import {
  findAllClientesComEndereco,
  findClienteByIdComEndereco,
  findAllPartesContrariasComEnderecoEProcessos,
  findParteContrariaById,
  findAllTerceirosComEnderecoEProcessos,
  findTerceiroById,
} from '@/app/app/partes/server';

// =============================================================================
// Tipos
// =============================================================================

/**
 * Parâmetros para sincronização em lote de partes
 */
export interface SincronizarPartesParams {
  /** Tipo de entidade a sincronizar */
  tipoEntidade: TipoEntidadeChatwoot;
  /** Limite de registros por página (padrão: 100) */
  limite?: number;
  /** Página inicial (padrão: 1) */
  paginaInicial?: number;
  /** Página final (padrão: todas) */
  paginaFinal?: number;
  /** Se true, sincroniza apenas registros ativos */
  apenasAtivos?: boolean;
  /** Delay em ms entre cada sincronização (padrão: 100ms) */
  delayEntreSync?: number;
  /** Se true, para no primeiro erro. Se false, continua e reporta erros no final */
  pararNoErro?: boolean;
}

/**
 * Resultado da sincronização em lote
 */
export interface SincronizarPartesResult {
  tipo_entidade: TipoEntidadeChatwoot;
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
  contatos_criados: number;
  contatos_atualizados: number;
  erros: Array<{ entidade_id: number; nome: string; erro: string }>;
}

// Alias para retrocompatibilidade
export interface SincronizarClientesParams {
  /** Limite de clientes por página (padrão: 100) */
  limite?: number;
  /** Página inicial (padrão: 1) */
  paginaInicial?: number;
  /** Página final (padrão: todas) */
  paginaFinal?: number;
  /** Se true, sincroniza apenas clientes ativos */
  apenasAtivos?: boolean;
  /** Delay em ms entre cada sincronização (padrão: 100ms) */
  delayEntreSync?: number;
  /** Se true, para no primeiro erro. Se false, continua e reporta erros no final */
  pararNoErro?: boolean;
}

export interface SincronizarClientesResult {
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
  clientes_criados: number;
  clientes_atualizados: number;
  erros: Array<{ cliente_id: number; nome: string; erro: string }>;
}

// =============================================================================
// Helpers
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Sincroniza todos os clientes com Chatwoot em lote
 *
 * @example
 * // Sincronizar todos os clientes ativos
 * const result = await sincronizarTodosClientes({ apenasAtivos: true });
 *
 * // Sincronizar primeiros 50 clientes
 * const result = await sincronizarTodosClientes({ limite: 50, paginaFinal: 1 });
 */
export async function sincronizarTodosClientes(
  params: SincronizarClientesParams = {}
): Promise<Result<SincronizarClientesResult>> {
  // Verifica configuração
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  const {
    limite = 100,
    paginaInicial = 1,
    paginaFinal,
    apenasAtivos = false,
    delayEntreSync = 100,
    pararNoErro = false,
  } = params;

  const resultado: SincronizarClientesResult = {
    total_processados: 0,
    total_sucesso: 0,
    total_erros: 0,
    clientes_criados: 0,
    clientes_atualizados: 0,
    erros: [],
  };

  let paginaAtual = paginaInicial;
  let continuar = true;

  console.log('[Chatwoot Batch Sync] Iniciando sincronização em lote...');

  while (continuar) {
    // Busca página de clientes (com endereço para sincronização com Chatwoot)
    const clientesResult = await findAllClientesComEndereco({
      pagina: paginaAtual,
      limite,
      ativo: apenasAtivos ? true : undefined,
      ordenar_por: 'created_at',
      ordem: 'asc',
    });

    if (!clientesResult.success) {
      console.error('[Chatwoot Batch Sync] Erro ao buscar clientes:', clientesResult.error);
      return err(clientesResult.error);
    }

    const { data: clientes, pagination } = clientesResult.data;

    if (clientes.length === 0) {
      console.log('[Chatwoot Batch Sync] Nenhum cliente encontrado na página', paginaAtual);
      break;
    }

    console.log(
      `[Chatwoot Batch Sync] Processando página ${paginaAtual}/${pagination.totalPages} (${clientes.length} clientes)`
    );

    // Processa cada cliente
    for (const cliente of clientes) {
      resultado.total_processados++;

      try {
        const syncResult = await sincronizarParteComChatwoot(
          cliente as Parameters<typeof sincronizarParteComChatwoot>[0],
          'cliente'
        );

        if (syncResult.success && syncResult.data.sucesso) {
          resultado.total_sucesso++;
          if (syncResult.data.criado) {
            resultado.clientes_criados++;
          } else {
            resultado.clientes_atualizados++;
          }
        } else {
          resultado.total_erros++;
          const erro = syncResult.success ? syncResult.data.erro : syncResult.error.message;
          resultado.erros.push({
            cliente_id: cliente.id,
            nome: cliente.nome,
            erro: erro ?? 'Erro desconhecido',
          });

          if (pararNoErro) {
            console.error(
              `[Chatwoot Batch Sync] Erro no cliente ${cliente.id}, parando...`,
              erro
            );
            continuar = false;
            break;
          }
        }
      } catch (error) {
        resultado.total_erros++;
        resultado.erros.push({
          cliente_id: cliente.id,
          nome: cliente.nome,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        if (pararNoErro) {
          console.error(
            `[Chatwoot Batch Sync] Exceção no cliente ${cliente.id}, parando...`,
            error
          );
          continuar = false;
          break;
        }
      }

      // Delay entre syncs para não sobrecarregar a API
      if (delayEntreSync > 0) {
        await sleep(delayEntreSync);
      }
    }

    // Verifica se deve continuar para próxima página
    if (!continuar) break;

    if (paginaFinal && paginaAtual >= paginaFinal) {
      console.log('[Chatwoot Batch Sync] Página final atingida:', paginaFinal);
      break;
    }

    if (!pagination.hasMore) {
      console.log('[Chatwoot Batch Sync] Última página processada');
      break;
    }

    paginaAtual++;
  }

  console.log('[Chatwoot Batch Sync] Sincronização concluída:', resultado);

  return ok(resultado);
}

/**
 * Sincroniza um cliente específico com Chatwoot
 */
export async function sincronizarCliente(
  clienteId: number
): Promise<Result<{ chatwoot_contact_id: number | null; criado: boolean }>> {
  // Verifica configuração
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  // Busca cliente (com endereço para sincronização com Chatwoot)
  const clienteResult = await findClienteByIdComEndereco(clienteId);

  if (!clienteResult.success) {
    return err(clienteResult.error);
  }

  if (!clienteResult.data) {
    return err(appError('NOT_FOUND', `Cliente ${clienteId} não encontrado`));
  }

  // Sincroniza
  const syncResult = await sincronizarParteComChatwoot(
    clienteResult.data as Parameters<typeof sincronizarParteComChatwoot>[0],
    'cliente'
  );

  if (!syncResult.success) {
    return err(syncResult.error);
  }

  if (!syncResult.data.sucesso) {
    return err(
      appError('EXTERNAL_SERVICE_ERROR', syncResult.data.erro ?? 'Falha na sincronização')
    );
  }

  return ok({
    chatwoot_contact_id: syncResult.data.chatwoot_contact_id,
    criado: syncResult.data.criado,
  });
}

/**
 * Sincroniza múltiplos clientes por IDs
 */
export async function sincronizarClientesPorIds(
  clienteIds: number[],
  delayEntreSync = 100
): Promise<Result<SincronizarClientesResult>> {
  // Verifica configuração
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  const resultado: SincronizarClientesResult = {
    total_processados: 0,
    total_sucesso: 0,
    total_erros: 0,
    clientes_criados: 0,
    clientes_atualizados: 0,
    erros: [],
  };

  for (const clienteId of clienteIds) {
    resultado.total_processados++;

    const syncResult = await sincronizarCliente(clienteId);

    if (syncResult.success) {
      resultado.total_sucesso++;
      if (syncResult.data.criado) {
        resultado.clientes_criados++;
      } else {
        resultado.clientes_atualizados++;
      }
    } else {
      resultado.total_erros++;
      resultado.erros.push({
        cliente_id: clienteId,
        nome: `ID ${clienteId}`,
        erro: syncResult.error.message,
      });
    }

    if (delayEntreSync > 0 && clienteIds.indexOf(clienteId) < clienteIds.length - 1) {
      await sleep(delayEntreSync);
    }
  }

  return ok(resultado);
}

// =============================================================================
// Sincronização Genérica para Todos os Tipos de Partes
// =============================================================================

/**
 * Labels para cada tipo de entidade (para mensagens de log)
 */
const ENTIDADE_LABELS: Record<TipoEntidadeChatwoot, string> = {
  cliente: 'Clientes',
  parte_contraria: 'Partes Contrárias',
  terceiro: 'Terceiros',
};

/**
 * Sincroniza todas as partes de um tipo específico com Chatwoot
 *
 * @example
 * // Sincronizar todos os clientes ativos
 * const result = await sincronizarTodasPartes({ tipoEntidade: 'cliente', apenasAtivos: true });
 *
 * // Sincronizar partes contrárias com limite
 * const result = await sincronizarTodasPartes({ tipoEntidade: 'parte_contraria', limite: 50, paginaFinal: 1 });
 */
export async function sincronizarTodasPartes(
  params: SincronizarPartesParams
): Promise<Result<SincronizarPartesResult>> {
  // Verifica configuração
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  const {
    tipoEntidade,
    limite = 100,
    paginaInicial = 1,
    paginaFinal,
    apenasAtivos = false,
    delayEntreSync = 100,
    pararNoErro = false,
  } = params;

  const label = ENTIDADE_LABELS[tipoEntidade];
  const resultado: SincronizarPartesResult = {
    tipo_entidade: tipoEntidade,
    total_processados: 0,
    total_sucesso: 0,
    total_erros: 0,
    contatos_criados: 0,
    contatos_atualizados: 0,
    erros: [],
  };

  let paginaAtual = paginaInicial;
  let continuar = true;

  console.log(`[Chatwoot Batch Sync] Iniciando sincronização de ${label}...`);

  while (continuar) {
    // Busca página de registros baseado no tipo de entidade
    let registros: Array<{ id: number; nome: string; tipo_pessoa: 'pf' | 'pj'; cpf?: string; cnpj?: string; [key: string]: unknown }> = [];
    let totalPages = 1;
    let hasMore = false;

    if (tipoEntidade === 'cliente') {
      // Clientes com endereço para sincronização com Chatwoot
      const clientesResult = await findAllClientesComEndereco({
        pagina: paginaAtual,
        limite,
        ativo: apenasAtivos ? true : undefined,
        ordenar_por: 'created_at',
        ordem: 'asc',
      });

      if (!clientesResult.success) {
        console.error(`[Chatwoot Batch Sync] Erro ao buscar ${label}:`, clientesResult.error);
        return err(clientesResult.error);
      }

      const { data, pagination } = clientesResult.data;
      registros = data as unknown as typeof registros;
      totalPages = pagination.totalPages;
      hasMore = pagination.hasMore;
    } else if (tipoEntidade === 'parte_contraria') {
      // Partes contrárias com endereço para sincronização com Chatwoot
      const partesResult = await findAllPartesContrariasComEnderecoEProcessos({
        pagina: paginaAtual,
        limite,
        situacao: apenasAtivos ? 'A' : undefined,
        ordenar_por: 'created_at',
        ordem: 'asc',
      });

      if (!partesResult.success) {
        console.error(`[Chatwoot Batch Sync] Erro ao buscar ${label}:`, partesResult.error);
        return err(partesResult.error);
      }

      const { data, pagination } = partesResult.data;
      registros = data as unknown as typeof registros;
      totalPages = pagination.totalPages;
      hasMore = pagination.hasMore;
    } else if (tipoEntidade === 'terceiro') {
      // Terceiros com endereço para sincronização com Chatwoot
      const terceirosResult = await findAllTerceirosComEnderecoEProcessos({
        pagina: paginaAtual,
        limite,
        situacao: apenasAtivos ? 'A' : undefined,
        ordenar_por: 'created_at',
        ordem: 'asc',
      });

      if (!terceirosResult.success) {
        console.error(`[Chatwoot Batch Sync] Erro ao buscar ${label}:`, terceirosResult.error);
        return err(terceirosResult.error);
      }

      const { data, pagination } = terceirosResult.data;
      registros = data as unknown as typeof registros;
      totalPages = pagination.totalPages;
      hasMore = pagination.hasMore;
    }

    if (registros.length === 0) {
      console.log(`[Chatwoot Batch Sync] Nenhum registro encontrado na página ${paginaAtual}`);
      break;
    }

    console.log(
      `[Chatwoot Batch Sync] Processando página ${paginaAtual}/${totalPages} (${registros.length} registros de ${label})`
    );

    // Processa cada registro
    for (const registro of registros) {
      resultado.total_processados++;

      try {
        const syncResult = await sincronizarParteComChatwoot(
          registro as Parameters<typeof sincronizarParteComChatwoot>[0],
          tipoEntidade,
          tipoEntidade === 'terceiro' ? { tipo_parte: registro.tipo_parte as string } : undefined
        );

        if (syncResult.success && syncResult.data.sucesso) {
          resultado.total_sucesso++;
          if (syncResult.data.criado) {
            resultado.contatos_criados++;
          } else {
            resultado.contatos_atualizados++;
          }
        } else {
          resultado.total_erros++;
          const erro = syncResult.success ? syncResult.data.erro : syncResult.error.message;
          resultado.erros.push({
            entidade_id: registro.id,
            nome: registro.nome,
            erro: erro ?? 'Erro desconhecido',
          });

          if (pararNoErro) {
            console.error(
              `[Chatwoot Batch Sync] Erro no registro ${registro.id}, parando...`,
              erro
            );
            continuar = false;
            break;
          }
        }
      } catch (error) {
        resultado.total_erros++;
        resultado.erros.push({
          entidade_id: registro.id,
          nome: registro.nome,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        if (pararNoErro) {
          console.error(
            `[Chatwoot Batch Sync] Exceção no registro ${registro.id}, parando...`,
            error
          );
          continuar = false;
          break;
        }
      }

      // Delay entre syncs para não sobrecarregar a API
      if (delayEntreSync > 0) {
        await sleep(delayEntreSync);
      }
    }

    // Verifica se deve continuar para próxima página
    if (!continuar) break;

    if (paginaFinal && paginaAtual >= paginaFinal) {
      console.log(`[Chatwoot Batch Sync] Página final atingida: ${paginaFinal}`);
      break;
    }

    if (!hasMore) {
      console.log(`[Chatwoot Batch Sync] Última página processada`);
      break;
    }

    paginaAtual++;
  }

  console.log(`[Chatwoot Batch Sync] Sincronização de ${label} concluída:`, resultado);

  return ok(resultado);
}

/**
 * Sincroniza uma única parte específica (qualquer tipo)
 */
export async function sincronizarParte(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<{ chatwoot_contact_id: number | null; criado: boolean }>> {
  // Verifica configuração
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  // Busca registro baseado no tipo
  type RegistroParaSync = { id: number; nome: string; tipo_pessoa: 'pf' | 'pj'; cpf?: string; cnpj?: string; tipo_parte?: string; [key: string]: unknown };
  let registro: RegistroParaSync | null = null;

  if (tipoEntidade === 'cliente') {
    // Busca cliente com endereço para sincronização com Chatwoot
    const clienteResult = await findClienteByIdComEndereco(entidadeId);
    if (!clienteResult.success) return err(clienteResult.error);
    if (!clienteResult.data) {
      return err(appError('NOT_FOUND', `Cliente ${entidadeId} não encontrado`));
    }
    registro = clienteResult.data as unknown as RegistroParaSync;
  } else if (tipoEntidade === 'parte_contraria') {
    const parteResult = await findParteContrariaById(entidadeId);
    if (!parteResult.success) return err(parteResult.error);
    if (!parteResult.data) {
      return err(appError('NOT_FOUND', `Parte contrária ${entidadeId} não encontrada`));
    }
    registro = parteResult.data as unknown as RegistroParaSync;
  } else if (tipoEntidade === 'terceiro') {
    const terceiroResult = await findTerceiroById(entidadeId);
    if (!terceiroResult.success) return err(terceiroResult.error);
    if (!terceiroResult.data) {
      return err(appError('NOT_FOUND', `Terceiro ${entidadeId} não encontrado`));
    }
    registro = terceiroResult.data as unknown as RegistroParaSync;
  }

  if (!registro) {
    return err(appError('NOT_FOUND', `Registro ${tipoEntidade}:${entidadeId} não encontrado`));
  }

  // Extrai tipo_parte para terceiros antes de passar para sincronização
  const terceiroInfo = tipoEntidade === 'terceiro' && registro.tipo_parte
    ? { tipo_parte: registro.tipo_parte }
    : undefined;

  // Sincroniza
  const syncResult = await sincronizarParteComChatwoot(
    registro as Parameters<typeof sincronizarParteComChatwoot>[0],
    tipoEntidade,
    terceiroInfo
  );

  if (!syncResult.success) {
    return err(syncResult.error);
  }

  if (!syncResult.data.sucesso) {
    return err(
      appError('EXTERNAL_SERVICE_ERROR', syncResult.data.erro ?? 'Falha na sincronização')
    );
  }

  return ok({
    chatwoot_contact_id: syncResult.data.chatwoot_contact_id,
    criado: syncResult.data.criado,
  });
}

// =============================================================================
// Sincronização Completa (Two-Phase: Chatwoot->App, App->Chatwoot)
// =============================================================================

/**
 * Resultado da sincronização completa (duas fases)
 */
export interface SincronizarCompletoResult {
  /** Fase 1: Chatwoot -> App (por telefone) */
  fase1_chatwoot_para_app: SincronizarChatwootParaAppResult | null;
  /** Fase 2: App -> Chatwoot (partes restantes) */
  fase2_app_para_chatwoot: SincronizarPartesResult | null;
  /** Resumo geral */
  resumo: {
    total_vinculados_por_telefone: number;
    total_criados_no_chatwoot: number;
    total_atualizados: number;
    total_sem_match: number;
    total_erros: number;
  };
}

/**
 * Parâmetros para sincronização completa
 */
export interface SincronizarCompletoParams {
  /** Tipo de entidade a sincronizar (ou 'todos' para sincronizar todas) */
  tipoEntidade?: TipoEntidadeChatwoot | 'todos';
  /** Se true, sincroniza apenas registros ativos na fase 2 */
  apenasAtivos?: boolean;
  /** Delay em ms entre cada sincronização (padrão: 100ms) */
  delayEntreSync?: number;
}

/**
 * Sincronização completa em duas fases:
 *
 * Fase 1: Chatwoot -> App (por telefone)
 *   - Lista todos os contatos do Chatwoot
 *   - Para cada contato com telefone, busca parte correspondente no banco local
 *   - Se encontrar, cria mapeamento (vincula)
 *
 * Fase 2: App -> Chatwoot (partes restantes)
 *   - Busca partes que ainda não estão vinculadas
 *   - Filtra apenas partes que possuem telefone
 *   - Cria/atualiza contatos no Chatwoot
 *
 * @example
 * // Sincronizar apenas clientes
 * const result = await sincronizarCompletoComChatwoot({ tipoEntidade: 'cliente' });
 *
 * // Sincronizar todas as entidades
 * const result = await sincronizarCompletoComChatwoot({ tipoEntidade: 'todos' });
 */
export async function sincronizarCompletoComChatwoot(
  params: SincronizarCompletoParams = {}
): Promise<Result<SincronizarCompletoResult>> {
  // Verifica configuração
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  const {
    tipoEntidade = 'todos',
    apenasAtivos = false,
    delayEntreSync = 100,
  } = params;

  const resultado: SincronizarCompletoResult = {
    fase1_chatwoot_para_app: null,
    fase2_app_para_chatwoot: null,
    resumo: {
      total_vinculados_por_telefone: 0,
      total_criados_no_chatwoot: 0,
      total_atualizados: 0,
      total_sem_match: 0,
      total_erros: 0,
    },
  };

  // ============================================
  // FASE 1: Chatwoot -> App (por telefone)
  // ============================================
  console.log('[Sync Completo] Fase 1: Sincronizando Chatwoot -> App (por telefone)...');

  const fase1Result = await sincronizarChatwootParaApp();

  if (!fase1Result.success) {
    console.error('[Sync Completo] Erro na Fase 1:', fase1Result.error);
    return err(fase1Result.error);
  }

  resultado.fase1_chatwoot_para_app = fase1Result.data;
  resultado.resumo.total_vinculados_por_telefone = fase1Result.data.contatos_vinculados;
  resultado.resumo.total_atualizados += fase1Result.data.contatos_atualizados;
  resultado.resumo.total_sem_match = fase1Result.data.contatos_sem_match;
  resultado.resumo.total_erros += fase1Result.data.erros.length;

  console.log('[Sync Completo] Fase 1 concluída:', {
    total_contatos: fase1Result.data.total_contatos_chatwoot,
    vinculados: fase1Result.data.contatos_vinculados,
    sem_match: fase1Result.data.contatos_sem_match,
  });

  // ============================================
  // FASE 2: App -> Chatwoot (partes restantes)
  // ============================================
  console.log('[Sync Completo] Fase 2: Sincronizando App -> Chatwoot (partes com telefone)...');

  // Determina quais tipos de entidade sincronizar
  const tiposParaSincronizar: TipoEntidadeChatwoot[] =
    tipoEntidade === 'todos'
      ? ['cliente', 'parte_contraria', 'terceiro']
      : [tipoEntidade];

  // Resultado agregado da fase 2
  const fase2Agregado: SincronizarPartesResult = {
    tipo_entidade: tipoEntidade === 'todos' ? 'cliente' : tipoEntidade,
    total_processados: 0,
    total_sucesso: 0,
    total_erros: 0,
    contatos_criados: 0,
    contatos_atualizados: 0,
    erros: [],
  };

  for (const tipo of tiposParaSincronizar) {
    console.log(`[Sync Completo] Sincronizando ${ENTIDADE_LABELS[tipo]}...`);

    const fase2Result = await sincronizarTodasPartes({
      tipoEntidade: tipo,
      apenasAtivos,
      delayEntreSync,
      pararNoErro: false,
    });

    if (fase2Result.success) {
      fase2Agregado.total_processados += fase2Result.data.total_processados;
      fase2Agregado.total_sucesso += fase2Result.data.total_sucesso;
      fase2Agregado.total_erros += fase2Result.data.total_erros;
      fase2Agregado.contatos_criados += fase2Result.data.contatos_criados;
      fase2Agregado.contatos_atualizados += fase2Result.data.contatos_atualizados;
      fase2Agregado.erros.push(...fase2Result.data.erros);
    } else {
      console.error(`[Sync Completo] Erro ao sincronizar ${tipo}:`, fase2Result.error);
      fase2Agregado.total_erros++;
      fase2Agregado.erros.push({
        entidade_id: 0,
        nome: `Tipo ${tipo}`,
        erro: fase2Result.error.message,
      });
    }
  }

  resultado.fase2_app_para_chatwoot = fase2Agregado;
  resultado.resumo.total_criados_no_chatwoot = fase2Agregado.contatos_criados;
  resultado.resumo.total_atualizados += fase2Agregado.contatos_atualizados;
  resultado.resumo.total_erros += fase2Agregado.total_erros;

  console.log('[Sync Completo] Fase 2 concluída:', {
    processados: fase2Agregado.total_processados,
    criados: fase2Agregado.contatos_criados,
    atualizados: fase2Agregado.contatos_atualizados,
  });

  console.log('[Sync Completo] Sincronização completa finalizada:', resultado.resumo);

  return ok(resultado);
}

// =============================================================================
// Endpoints para Webhooks e API
// =============================================================================

/**
 * Processa webhook POST de eventos do Chatwoot
 * Endpoint: POST /api/webhooks/chatwoot
 */
export async function processarWebhookChatwoot(
  event: string,
  payload: Record<string, unknown>
): Promise<Result<void>> {
  try {
    if (!(await isChatwootConfigured())) {
      return err(
        appError(
          'EXTERNAL_SERVICE_ERROR',
          'Chatwoot não está configurado'
        )
      );
    }

    // Processa o webhook usando o router de eventos
    const result = await processarWebhook(
      event as WebhookEventType,
      {
        event: event as WebhookEventType,
        data: payload,
        account_id: (payload.account_id as number) || 0,
      }
    );

    if (!result.success) {
      console.error('[Webhook Chatwoot] Erro ao processar:', result.error);
      return err(result.error);
    }

    console.log(`[Webhook Chatwoot] Evento ${event} processado com sucesso`);
    return ok(undefined);
  } catch (error) {
    console.error('[Webhook Chatwoot] Exceção ao processar:', error);
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao processar webhook Chatwoot',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Sincroniza uma conversa específica manualmente
 * PUT /api/chatwoot/conversas/{conversationId}
 */
export async function sincronizarConversaManual(
  conversationId: number,
  accountId: number
): Promise<Result<{ sincronizado: boolean }>> {
  try {
    if (!(await isChatwootConfigured())) {
      return err(
        appError(
          'EXTERNAL_SERVICE_ERROR',
          'Chatwoot não está configurado'
        )
      );
    }

    const chatwootConfig = await getChatwootConfigFromDatabase();
    if (!chatwootConfig) {
      return err(appError('EXTERNAL_SERVICE_ERROR', 'Chatwoot não configurado'));
    }

    // Busca detalhes da conversa no Chatwoot
    const conversationDetail = await fetch(
      `${chatwootConfig.apiUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}`,
      {
        headers: {
          'api_access_token': chatwootConfig.apiKey,
        },
      }
    );

    if (!conversationDetail.ok) {
      return err(
        appError(
          'NOT_FOUND',
          `Conversa ${conversationId} não encontrada no Chatwoot`
        )
      );
    }

    const convData = await conversationDetail.json();

    // Sincroniza para o banco local
    const syncResult = await sincronizarConversaChatwoot({
      chatwoot_conversation_id: conversationId,
      chatwoot_account_id: accountId,
      chatwoot_inbox_id: convData.conversation?.inbox_id || 0,
      status: convData.conversation?.status || 'open',
      assignee_id: convData.conversation?.assignee_id,
      message_count: convData.conversation?.messages_count || 0,
      unread_count: convData.conversation?.unread_count || 0,
    });

    if (!syncResult.success) {
      return err(syncResult.error);
    }

    console.log(`[Chatwoot] Conversa ${conversationId} sincronizada manualmente`);

    return ok({ sincronizado: true });
  } catch (error) {
    console.error('[Sincronizar Conversa Manual] Erro:', error);
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao sincronizar conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza status de uma conversa
 * PATCH /api/chatwoot/conversas/{conversationId}
 */
export async function atualizarStatusConversaAPI(
  conversationId: number,
  accountId: number,
  novoStatus: 'open' | 'resolved' | 'pending' | 'snoozed'
): Promise<Result<void>> {
  try {
    if (!(await isChatwootConfigured())) {
      return err(
        appError(
          'EXTERNAL_SERVICE_ERROR',
          'Chatwoot não está configurado'
        )
      );
    }

    const chatwootConfig = await getChatwootConfigFromDatabase();
    if (!chatwootConfig) {
      return err(appError('EXTERNAL_SERVICE_ERROR', 'Chatwoot não configurado'));
    }

    // Primeiro atualiza no Chatwoot via API
    const updateResponse = await fetch(
      `${chatwootConfig.apiUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}`,
      {
        method: 'PUT',
        headers: {
          'api_access_token': chatwootConfig.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: novoStatus }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      return err(
        appError(
          'EXTERNAL_SERVICE_ERROR',
          `Erro ao atualizar conversa no Chatwoot: ${error}`
        )
      );
    }

    // Depois atualiza no banco local
    const localUpdateResult = await atualizarStatusConversa(
      conversationId,
      accountId,
      novoStatus
    );

    if (!localUpdateResult.success) {
      console.warn('Erro ao atualizar status local:', localUpdateResult.error);
      // Não falha, pois a atualização remota foi bem-sucedida
    }

    console.log(
      `[Chatwoot] Status da conversa ${conversationId} atualizado para ${novoStatus}`
    );

    return ok(undefined);
  } catch (error) {
    console.error('[Atualizar Status Conversa] Erro:', error);
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao atualizar status da conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
