'use client';

import Link from 'next/link';
import { AlertTriangle, Calendar, ArrowRight, Clock } from 'lucide-react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import type { ExpedienteUrgente } from '../../domain';
import { formatarPartes, obterContextoProcesso } from '../../widgets/shared/processo-display';

interface WidgetExpedientesUrgentesProps {
  data: ExpedienteUrgente[];
  loading?: boolean;
  error?: string;
}

function getUrgency(dias: number) {
  if (dias < 0) return { label: `Vencido ${Math.abs(dias)}d`, color: 'bg-destructive text-white', border: 'border-l-destructive', bg: 'bg-destructive/10' };
  if (dias === 0) return { label: 'Vence hoje', color: 'bg-destructive text-white', border: 'border-l-destructive', bg: 'bg-destructive/10' };
  if (dias <= 3) return { label: `${dias}d restantes`, color: 'bg-warning text-white', border: 'border-l-warning', bg: 'bg-warning/10' };
  return { label: `${dias}d restantes`, color: 'bg-info text-white', border: 'border-l-info', bg: '' };
}

export function WidgetExpedientesUrgentes({ data, loading, error }: WidgetExpedientesUrgentesProps) {
  if (loading) {
    return (
      <GlassPanel>
        <CardHeader><Skeleton className="h-5 w-44" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </CardContent>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel>
        <CardHeader><CardTitle>Expedientes Urgentes</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-destructive">{error}</p></CardContent>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <CardHeader>
        <CardTitle>Expedientes Urgentes</CardTitle>
        <CardDescription>
          {data.length > 0
            ? `${data.length} pendente${data.length > 1 ? 's' : ''}`
            : 'Todos os expedientes estão em dia'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/55 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum expediente urgente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 5).map((exp) => {
              const urgency = getUrgency(exp.dias_restantes);
              const partes = formatarPartes(exp.nome_parte_autora, exp.nome_parte_re);
              const contextoProcesso = obterContextoProcesso(exp);

              return (
                <div
                  key={exp.id}
                  className={cn(
                    'flex gap-3 rounded-lg border border-l-[3px] p-3 transition-colors hover:bg-muted/50',
                    urgency.border,
                    urgency.bg,
                  )}
                >
                  <div className={cn('flex flex-col items-center justify-center rounded-lg px-2 py-1.5 text-center min-w-14', urgency.color)}>
                    <Clock className="h-3 w-3 mb-0.5" />
                    <span className="text-[10px] font-bold leading-tight whitespace-nowrap">{urgency.label}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-tight">{exp.tipo_expediente}</p>
                    {partes && (
                      <p className="text-xs text-foreground/70 leading-tight">{partes}</p>
                    )}
                    {contextoProcesso && (
                      <p className="text-xs text-muted-foreground leading-tight">{contextoProcesso}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">{exp.numero_processo}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Prazo: {formatDate(exp.prazo_fatal)}
                      </span>
                      {exp.responsavel_nome && <span>{exp.responsavel_nome}</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            <Link href="/app/expedientes" className="block">
              <Button variant="ghost" size="sm" className="w-full mt-1 text-muted-foreground hover:text-foreground">
                Ver todos os expedientes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </GlassPanel>
  );
}
