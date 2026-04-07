'use client';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import {
  CheckCircle2,
  XCircle,
  FileEdit,
  FilePlus,
  FileX,
  AlertTriangle,
} from 'lucide-react';
import type { CapturaRawLog } from '@/app/(authenticated)/captura';
import type { LogEntry, LogRegistroInserido, LogRegistroAtualizado, LogErro } from '../services/persistence/capture-log.service';

function formatarGrau(grau: string): string {
  switch (grau) {
    case 'primeiro_grau': return '1\u00ba Grau';
    case 'segundo_grau': return '2\u00ba Grau';
    case 'tribunal_superior': return 'Tribunal Superior';
    default: return grau;
  }
}

function calcularEstatisticas(logs: LogEntry[]) {
  return {
    inseridos: logs.filter((l) => l.tipo === 'inserido').length,
    atualizados: logs.filter((l) => l.tipo === 'atualizado').length,
    naoAtualizados: logs.filter((l) => l.tipo === 'nao_atualizado').length,
    erros: logs.filter((l) => l.tipo === 'erro').length,
    total: logs.length,
  };
}

function LogStats({ logs }: { logs: LogEntry[] }) {
  const stats = calcularEstatisticas(logs);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex items-center gap-2 rounded-md border bg-background p-2.5">
        <FilePlus className="h-4 w-4 text-success" />
        <div>
          <p className="text-xs text-muted-foreground">Inseridos</p>
          <p className="text-sm font-semibold">{stats.inseridos}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-background p-2.5">
        <FileEdit className="h-4 w-4 text-info" />
        <div>
          <p className="text-xs text-muted-foreground">Atualizados</p>
          <p className="text-sm font-semibold">{stats.atualizados}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-background p-2.5">
        <FileX className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">Sem alteracao</p>
          <p className="text-sm font-semibold">{stats.naoAtualizados}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-background p-2.5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <div>
          <p className="text-xs text-muted-foreground">Erros</p>
          <p className="text-sm font-semibold">{stats.erros}</p>
        </div>
      </div>
    </div>
  );
}

function LogEntries({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) return null;

  const erros = logs.filter((l): l is LogErro => l.tipo === 'erro');
  const inseridos = logs.filter((l): l is LogRegistroInserido => l.tipo === 'inserido');
  const atualizados = logs.filter((l): l is LogRegistroAtualizado => l.tipo === 'atualizado');

  return (
    <div className="mt-3 space-y-3">
      {erros.length > 0 && (
        <div>
          <p className="text-xs font-medium text-destructive mb-1.5">
            Erros ({erros.length})
          </p>
          <div className="space-y-1">
            {erros.map((log, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border border-destructive dark:border-destructive bg-destructive/50 dark:bg-destructive/30 p-2 text-xs">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{log.entidade}</span>
                  <span className="text-muted-foreground ml-1">— {log.erro}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inseridos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-success mb-1.5">
            Inseridos ({inseridos.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {inseridos.slice(0, 20).map((log, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                {log.numero_processo || `#${log.id_pje}`}
              </Badge>
            ))}
            {inseridos.length > 20 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{inseridos.length - 20} mais
              </Badge>
            )}
          </div>
        </div>
      )}

      {atualizados.length > 0 && (
        <div>
          <p className="text-xs font-medium text-info mb-1.5">
            Atualizados ({atualizados.length})
          </p>
          <div className="space-y-1">
            {atualizados.slice(0, 10).map((log, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                <span className="font-mono">{log.numero_processo || `#${log.id_pje}`}</span>
                {log.campos_alterados.length > 0 && (
                  <span className="ml-1">
                    — {log.campos_alterados.join(', ')}
                  </span>
                )}
              </div>
            ))}
            {atualizados.length > 10 && (
              <p className="text-xs text-muted-foreground">+{atualizados.length - 10} mais</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CapturaRawLogsProps {
  rawLogs: CapturaRawLog[];
}

export function CapturaRawLogs({ rawLogs }: CapturaRawLogsProps) {
  if (rawLogs.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        Nenhum log detalhado disponivel para esta captura.
      </div>
    );
  }

  const totalSucesso = rawLogs.filter((l) => l.status === 'success').length;
  const totalErro = rawLogs.filter((l) => l.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Resumo geral */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{rawLogs.length} registro{rawLogs.length !== 1 ? 's' : ''}</Badge>
        {totalSucesso > 0 && (
          <Badge variant={getSemanticBadgeVariant('captura_status', 'completed')}>
            <CheckCircle2 className="mr-1 h-3 w-3" /> {totalSucesso} sucesso
          </Badge>
        )}
        {totalErro > 0 && (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> {totalErro} erro{totalErro !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Logs por tribunal/grau */}
      <Accordion type="multiple" className="space-y-2">
        {rawLogs.map((rawLog) => {
          const logs = (rawLog.logs ?? []) as LogEntry[];
          const stats = calcularEstatisticas(logs);
          const isError = rawLog.status === 'error';

          return (
            <AccordionItem
              key={rawLog.raw_log_id}
              value={rawLog.raw_log_id}
              className="rounded-md border px-4"
            >
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex flex-1 items-center gap-2 text-sm">
                  {isError ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  )}
                  <span className="font-medium">{rawLog.trt}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                    {formatarGrau(rawLog.grau)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                    {rawLog.tipo_captura}
                  </Badge>

                  {logs.length > 0 && !isError && (
                    <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
                      {stats.inseridos > 0 && `${stats.inseridos} inserido${stats.inseridos !== 1 ? 's' : ''}`}
                      {stats.inseridos > 0 && stats.atualizados > 0 && ', '}
                      {stats.atualizados > 0 && `${stats.atualizados} atualizado${stats.atualizados !== 1 ? 's' : ''}`}
                      {(stats.inseridos > 0 || stats.atualizados > 0) && stats.erros > 0 && ', '}
                      {stats.erros > 0 && `${stats.erros} erro${stats.erros !== 1 ? 's' : ''}`}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  {/* Erro principal do raw log */}
                  {rawLog.erro && (
                    <div className="rounded-md border border-destructive dark:border-destructive bg-destructive/50 dark:bg-destructive/30 p-3 text-xs text-destructive dark:text-destructive">
                      {rawLog.erro}
                    </div>
                  )}

                  {/* Estatísticas dos LogEntries */}
                  {logs.length > 0 && (
                    <>
                      <LogStats logs={logs} />
                      <LogEntries logs={logs} />
                    </>
                  )}

                  {/* Metadados */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t">
                    <span>Credencial: {rawLog.credencial_id}</span>
                    <span>Criado em: {new Date(rawLog.criado_em).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
