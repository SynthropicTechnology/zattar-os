'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cpu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  auditLogService,
  type LogAlteracao,
} from '@/lib/domain/audit/services/audit-log.service';
import { AUDIENCIA_FIELD_LABELS } from '../domain';
import type { Audiencia } from '../domain';

// ---------------------------------------------------------------------------
// Types (internal)
// ---------------------------------------------------------------------------

interface ChangeEntry {
  campo: string;
  valorAnterior: string;
  valorNovo: string;
}

interface TimelineEntry {
  id: string;
  type: 'manual' | 'system' | 'captura_inicial';
  timestamp: string;
  usuario?: { nome: string };
  changes: ChangeEntry[];
  descricao?: string;
}

interface AudienciaTimelineProps {
  audienciaId: number;
  audiencia: Audiencia;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatTimestamp(iso: string): string {
  try {
    return format(parseISO(iso), "dd 'de' MMM yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AudienciaTimeline({
  audienciaId,
  audiencia,
  className,
}: AudienciaTimelineProps) {
  const [logs, setLogs] = useState<LogAlteracao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch audit logs
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    auditLogService
      .getLogs('audiencias', audienciaId)
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch((err) => console.error('Timeline fetch error:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [audienciaId]);

  // Build timeline entries
  const entries = useMemo<TimelineEntry[]>(() => {
    const result: TimelineEntry[] = [];

    // 1. Entries from audit logs
    for (const log of logs) {
      const changes: ChangeEntry[] = [];
      const changesData = (log.dados_evento as Record<string, unknown>)?.changes as
        | Record<string, { old?: unknown; new?: unknown }>
        | undefined;

      if (changesData) {
        for (const [campo, diff] of Object.entries(changesData)) {
          changes.push({
            campo: AUDIENCIA_FIELD_LABELS[campo] ?? campo,
            valorAnterior: formatValue(diff?.old),
            valorNovo: formatValue(diff?.new),
          });
        }
      }

      const isSystem = !log.usuario;
      result.push({
        id: `log-${log.id}`,
        type: isSystem ? 'system' : 'manual',
        timestamp: log.created_at,
        usuario: log.usuario
          ? { nome: log.usuario.nome_exibicao }
          : undefined,
        changes,
        descricao: log.tipo_evento,
      });
    }

    // 2. Entry from dados_anteriores (PJe sync diff)
    if (audiencia.dadosAnteriores) {
      const changes: ChangeEntry[] = [];
      for (const [snakeKey, oldValue] of Object.entries(audiencia.dadosAnteriores)) {
        const camelKey = snakeToCamel(snakeKey) as keyof Audiencia;
        const currentValue = audiencia[camelKey];
        if (formatValue(oldValue) !== formatValue(currentValue)) {
          changes.push({
            campo: AUDIENCIA_FIELD_LABELS[snakeKey] ?? snakeKey,
            valorAnterior: formatValue(oldValue),
            valorNovo: formatValue(currentValue),
          });
        }
      }

      if (changes.length > 0) {
        result.push({
          id: 'dados-anteriores',
          type: 'system',
          timestamp: audiencia.updatedAt,
          changes,
          descricao: 'Sincronização PJe',
        });
      }
    }

    // 3. Captura inicial — always present as last entry
    result.push({
      id: 'captura_inicial',
      type: 'captura_inicial',
      timestamp: audiencia.createdAt,
      changes: [],
      descricao: 'Captura inicial',
    });

    // Sort descending (most recent first)
    result.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return tb - ta;
    });

    return result;
  }, [logs, audiencia]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[60, 80, 50].map((w, i) => (
          <div key={i} className="flex gap-3">
            <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
              <div className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w - 20}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state (only captura_inicial)
  const hasChanges = entries.some((e) => e.type !== 'captura_inicial');
  if (!hasChanges && entries.length <= 1) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Sem alterações registradas
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical connector line */}
      <div className="absolute left-4 top-8 bottom-0 w-px bg-border/30" />

      {entries.map((entry) => (
        <div key={entry.id} className="relative flex gap-3 pb-5">
          {/* Avatar / icon */}
          {entry.type === 'manual' && entry.usuario ? (
            <Avatar size="lg" className="shrink-0">
              <AvatarFallback className="text-xs font-medium">
                {getInitials(entry.usuario.nome)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Cpu size={18} className="text-muted-foreground" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {entry.type === 'manual' && entry.usuario
                  ? entry.usuario.nome
                  : entry.type === 'captura_inicial'
                    ? 'Sistema'
                    : entry.descricao ?? 'Sistema'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>

            {/* Description (for captura_inicial or system entries without changes) */}
            {entry.type === 'captura_inicial' && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {entry.descricao}
              </p>
            )}

            {/* Changes list */}
            {entry.changes.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {entry.changes.map((change, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-muted-foreground">{change.campo}:</span>{' '}
                    <span className="font-mono text-xs line-through opacity-60">
                      {change.valorAnterior}
                    </span>
                    {' → '}
                    <span className="font-mono text-xs font-medium">
                      {change.valorNovo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
