'use client';

/**
 * WidgetCapturaStatus -- Widget conectado
 * Fonte: useDashboard() -> data.statusCapturas (role=admin)
 * Mostra status de sincronizacao automatica dos tribunais.
 */

import { RefreshCw } from 'lucide-react';
import { WidgetContainer } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardAdmin } from '../../hooks';
import type { StatusCaptura } from '../../domain';

/** Cores do indicador por status */
const STATUS_DOT_CLASSES: Record<StatusCaptura['status'], string> = {
  sucesso: 'bg-success/70',
  erro: 'bg-destructive/80 animate-pulse',
  pendente: 'bg-muted-foreground/40',
  executando: 'bg-warning/70 animate-pulse',
};

/** Labels legíveis por status */
const STATUS_LABELS: Record<StatusCaptura['status'], string> = {
  sucesso: 'Sincronizado',
  erro: 'Erro',
  pendente: 'Pendente',
  executando: 'Executando...',
};

function formatarUltimaExecucao(iso: string | null): string {
  if (!iso) return 'Nunca executado';
  const d = new Date(iso);
  const agora = new Date();
  const diffMs = agora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min atras`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atras`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function WidgetCapturaStatus() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (!data) {
    return (
      <WidgetContainer
        title="Captura -- Tribunais"
        icon={RefreshCw}
        subtitle="Status de sincronizacao automatica"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados.
        </p>
      </WidgetContainer>
    );
  }

  if (!isDashboardAdmin(data)) {
    return (
      <WidgetContainer
        title="Captura -- Tribunais"
        icon={RefreshCw}
        subtitle="Status de sincronizacao automatica"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Disponivel apenas para administradores.
        </p>
      </WidgetContainer>
    );
  }

  const capturas = data.statusCapturas;

  if (capturas.length === 0) {
    return (
      <WidgetContainer
        title="Captura -- Tribunais"
        icon={RefreshCw}
        subtitle="Status de sincronizacao automatica"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nenhuma captura configurada.
        </p>
      </WidgetContainer>
    );
  }

  // Resumo geral
  const totalSucesso = capturas.filter((c) => c.status === 'sucesso').length;
  const totalErro = capturas.filter((c) => c.status === 'erro').length;

  return (
    <WidgetContainer
      title="Captura -- Tribunais"
      icon={RefreshCw}
      subtitle="Status de sincronizacao automatica"
      depth={1}
    >
      {/* Resumo compacto */}
      <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground/70">
        <span>
          <span className="inline-block size-2 rounded-full bg-success/70 mr-1" />
          {totalSucesso} ok
        </span>
        {totalErro > 0 && (
          <span>
            <span className="inline-block size-2 rounded-full bg-destructive/80 mr-1" />
            {totalErro} erro{totalErro > 1 ? 's' : ''}
          </span>
        )}
        <span className="ml-auto">{capturas.length} tribunais</span>
      </div>

      {/* Lista de tribunais */}
      <div className="flex flex-col gap-2">
        {capturas.map((captura) => {
          const dotClass = STATUS_DOT_CLASSES[captura.status];
          const statusLabel = STATUS_LABELS[captura.status];
          const sigla = `${captura.trt} (${captura.grau})`;

          return (
            <div
              key={`${captura.trt}-${captura.grau}`}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-border/5 transition-colors"
            >
              {/* Status dot */}
              <div className={`size-2.5 rounded-full shrink-0 ${dotClass}`} />

              {/* Sigla do tribunal */}
              <span className="text-xs font-medium truncate min-w-0 flex-1">
                {sigla}
              </span>

              {/* Status label + tempo */}
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`text-[10px] font-medium ${
                    captura.status === 'erro'
                      ? 'text-destructive/80'
                      : captura.status === 'sucesso'
                        ? 'text-success/70 dark:text-success/70'
                        : 'text-muted-foreground/60'
                  }`}
                >
                  {statusLabel}
                </span>
                <span className="text-[9px] text-muted-foreground/50">
                  {formatarUltimaExecucao(captura.ultimaExecucao)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Erro detalhado (se houver) */}
      {totalErro > 0 && (
        <div className="mt-3 pt-3 border-t border-border/10">
          {capturas
            .filter((c) => c.status === 'erro' && c.mensagemErro)
            .slice(0, 2)
            .map((c) => (
              <p
                key={`${c.trt}-${c.grau}-erro`}
                className="text-[9px] text-destructive/70 truncate mb-1"
                title={c.mensagemErro ?? ''}
              >
                {c.trt}: {c.mensagemErro}
              </p>
            ))}
        </div>
      )}
    </WidgetContainer>
  );
}
