'use client';

/**
 * ChatwootSyncButton - Botão para sincronização bidirecional com Chatwoot
 *
 * Componente que exibe um botão de sincronização na toolbar de tabelas
 * com feedback de progresso e resultado.
 *
 * Fluxo de sincronização em duas fases:
 * 1. Chatwoot -> App: Lista contatos do Chatwoot, busca partes por telefone, cria mapeamentos
 * 2. App -> Chatwoot: Sincroniza partes restantes para o Chatwoot
 */

import * as React from 'react';
import { CloudCog, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  sincronizarCompletoComChatwoot,
  type SincronizarCompletoResult,
} from '../actions';
import type { TipoEntidadeChatwoot } from '../domain';

// =============================================================================
// Tipos
// =============================================================================

interface ChatwootSyncButtonProps {
  /** Tipo de entidade a sincronizar (ou undefined para sincronizar todas) */
  tipoEntidade: TipoEntidadeChatwoot;
  /** Label customizado para o botão */
  label?: string;
  /** Se true, sincroniza apenas registros ativos */
  apenasAtivos?: boolean;
  /** Callback chamado após sincronização completa */
  onSyncComplete?: (result: SincronizarCompletoResult) => void;
}

type SyncState = 'idle' | 'confirming' | 'syncing' | 'success' | 'error';

// =============================================================================
// Labels e constantes
// =============================================================================

const ENTIDADE_LABELS: Record<TipoEntidadeChatwoot, { singular: string; plural: string }> = {
  cliente: { singular: 'cliente', plural: 'clientes' },
  parte_contraria: { singular: 'parte contrária', plural: 'partes contrárias' },
  terceiro: { singular: 'terceiro', plural: 'terceiros' },
};

// =============================================================================
// Componente
// =============================================================================

export function ChatwootSyncButton({
  tipoEntidade,
  label,
  apenasAtivos = false,
  onSyncComplete,
}: ChatwootSyncButtonProps) {
  const [state, setState] = React.useState<SyncState>('idle');
  const [result, setResult] = React.useState<SincronizarCompletoResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const labels = ENTIDADE_LABELS[tipoEntidade];
  const buttonLabel = label ?? `Sincronizar ${labels.plural} com Chatwoot`;

  const handleSync = React.useCallback(async () => {
    setState('syncing');
    setError(null);
    setResult(null);

    try {
      const syncResult = await sincronizarCompletoComChatwoot({
        tipoEntidade,
        apenasAtivos,
        delayEntreSync: 100,
      });

      if (syncResult.success) {
        setResult(syncResult.data);
        setState('success');

        const { resumo } = syncResult.data;

        // Toast de sucesso
        toast.success(`Sincronização concluída`, {
          description: `${resumo.total_vinculados_por_telefone} vinculados por telefone, ${resumo.total_criados_no_chatwoot} criados, ${resumo.total_atualizados} atualizados.`,
        });

        // Callback
        onSyncComplete?.(syncResult.data);
      } else {
        setError(syncResult.error.message);
        setState('error');
        toast.error('Erro na sincronização', {
          description: syncResult.error.message,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setState('error');
      toast.error('Erro na sincronização', {
        description: errorMessage,
      });
    }
  }, [tipoEntidade, apenasAtivos, onSyncComplete]);

  const handleConfirm = React.useCallback(() => {
    setState('idle');
    void handleSync();
  }, [handleSync]);

  const handleCancel = React.useCallback(() => {
    setState('idle');
  }, []);

  const handleButtonClick = React.useCallback(() => {
    setState('confirming');
  }, []);

  const handleDialogClose = React.useCallback(() => {
    if (state === 'success' || state === 'error') {
      setState('idle');
    }
  }, [state]);

  // Determina ícone baseado no estado
  const renderIcon = () => {
    switch (state) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CloudCog className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-card"
            onClick={handleButtonClick}
            disabled={state === 'syncing'}
            aria-label={buttonLabel}
          >
            {renderIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{buttonLabel}</TooltipContent>
      </Tooltip>

      {/* Dialog de confirmação */}
      <AlertDialog open={state === 'confirming'} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sincronizar com Chatwoot</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block mb-2">
                A sincronização será feita em duas etapas:
              </span>
              <span className="block text-sm">
                <strong>1.</strong> Vincular contatos do Chatwoot com {labels.plural} existentes (por telefone)
              </span>
              <span className="block text-sm">
                <strong>2.</strong> Criar/atualizar contatos no Chatwoot para {labels.plural} {apenasAtivos ? 'ativos ' : ''}restantes
              </span>
              <span className="block mt-2 text-muted-foreground">
                Esta operação pode levar alguns minutos dependendo da quantidade de registros.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Sincronizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de resultado */}
      <AlertDialog open={state === 'success' || state === 'error'} onOpenChange={handleDialogClose}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {state === 'success' ? 'Sincronização concluída' : 'Erro na sincronização'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {state === 'success' && result && (
                  <>
                    {/* Fase 1: Chatwoot -> App */}
                    {result.fase1_chatwoot_para_app && (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Fase 1: Chatwoot → App (por telefone)</p>
                        <ul className="list-disc list-inside space-y-0.5 text-sm">
                          <li>Total de contatos no Chatwoot: <strong>{result.fase1_chatwoot_para_app.total_contatos_chatwoot}</strong></li>
                          <li>Contatos com telefone: <strong>{result.fase1_chatwoot_para_app.contatos_com_telefone}</strong></li>
                          <li>Vinculados por telefone: <strong className="text-success">{result.fase1_chatwoot_para_app.contatos_vinculados}</strong></li>
                          <li>Já vinculados anteriormente: <strong>{result.fase1_chatwoot_para_app.contatos_atualizados}</strong></li>
                          <li>Sem correspondência local: <strong className="text-warning">{result.fase1_chatwoot_para_app.contatos_sem_match}</strong></li>
                        </ul>
                      </div>
                    )}

                    {/* Fase 2: App -> Chatwoot */}
                    {result.fase2_app_para_chatwoot && (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Fase 2: App → Chatwoot</p>
                        <ul className="list-disc list-inside space-y-0.5 text-sm">
                          <li>Total processados: <strong>{result.fase2_app_para_chatwoot.total_processados}</strong></li>
                          <li>Sucesso: <strong className="text-success">{result.fase2_app_para_chatwoot.total_sucesso}</strong></li>
                          <li>Contatos criados: <strong>{result.fase2_app_para_chatwoot.contatos_criados}</strong></li>
                          <li>Contatos atualizados: <strong>{result.fase2_app_para_chatwoot.contatos_atualizados}</strong></li>
                          {result.fase2_app_para_chatwoot.total_erros > 0 && (
                            <li>Erros: <strong className="text-destructive">{result.fase2_app_para_chatwoot.total_erros}</strong></li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Resumo */}
                    <div className="pt-2 border-t space-y-1">
                      <p className="font-medium text-foreground">Resumo</p>
                      <ul className="list-disc list-inside space-y-0.5 text-sm">
                        <li>Vinculados por telefone: <strong className="text-success">{result.resumo.total_vinculados_por_telefone}</strong></li>
                        <li>Criados no Chatwoot: <strong>{result.resumo.total_criados_no_chatwoot}</strong></li>
                        <li>Atualizados: <strong>{result.resumo.total_atualizados}</strong></li>
                        {result.resumo.total_sem_match > 0 && (
                          <li>Contatos sem match: <strong className="text-warning">{result.resumo.total_sem_match}</strong></li>
                        )}
                        {result.resumo.total_erros > 0 && (
                          <li>Total de erros: <strong className="text-destructive">{result.resumo.total_erros}</strong></li>
                        )}
                      </ul>
                    </div>

                    {/* Lista de contatos sem match */}
                    {result.fase1_chatwoot_para_app && result.fase1_chatwoot_para_app.contatos_sem_match_lista.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Contatos do Chatwoot sem correspondência:</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground max-h-24 overflow-y-auto">
                          {result.fase1_chatwoot_para_app.contatos_sem_match_lista.slice(0, 10).map((contato, idx) => (
                            <li key={idx}>
                              {contato.name} ({contato.phone})
                            </li>
                          ))}
                          {result.fase1_chatwoot_para_app.contatos_sem_match_lista.length > 10 && (
                            <li>E mais {result.fase1_chatwoot_para_app.contatos_sem_match_lista.length - 10}...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Erros */}
                    {result.fase2_app_para_chatwoot && result.fase2_app_para_chatwoot.erros.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Erros encontrados:</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground max-h-24 overflow-y-auto">
                          {result.fase2_app_para_chatwoot.erros.slice(0, 5).map((erro, idx) => (
                            <li key={idx}>
                              {erro.nome}: {erro.erro}
                            </li>
                          ))}
                          {result.fase2_app_para_chatwoot.erros.length > 5 && (
                            <li>E mais {result.fase2_app_para_chatwoot.erros.length - 5} erros. Verifique o console.</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {state === 'error' && (
                  <p className="text-destructive">{error}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
