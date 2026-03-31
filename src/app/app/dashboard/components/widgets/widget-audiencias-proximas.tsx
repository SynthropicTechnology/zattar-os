'use client';

import Link from 'next/link';
import { Calendar, Clock, Video, MapPin, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AudienciaProxima } from '../../domain';

interface WidgetAudienciasProximasProps {
  data: AudienciaProxima[];
  loading?: boolean;
  error?: string;
}

function getDateLabel(dateStr: string): { label: string; sublabel: string; urgency: 'today' | 'tomorrow' | 'upcoming' } {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return { label: 'Hoje', sublabel: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), urgency: 'today' };
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return { label: 'Amanhã', sublabel: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), urgency: 'tomorrow' };
  }
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
  return {
    label: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    sublabel: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    urgency: 'upcoming',
  };
}

const urgencyStyles = {
  today: { badge: 'bg-destructive text-white', border: 'border-l-destructive', bg: 'bg-destructive/10' },
  tomorrow: { badge: 'bg-warning text-white', border: 'border-l-warning', bg: 'bg-warning/10' },
  upcoming: { badge: 'bg-info text-white', border: 'border-l-info', bg: '' },
};

export function WidgetAudienciasProximas({ data, loading, error }: WidgetAudienciasProximasProps) {
  if (loading) {
    return (
      <Card className="glass-widget bg-transparent transition-all duration-200">
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-widget bg-transparent transition-all duration-200">
        <CardHeader><CardTitle>Próximas Audiências</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-destructive">{error}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-widget bg-transparent transition-all duration-200">
      <CardHeader>
        <CardTitle>Próximas Audiências</CardTitle>
        <CardDescription>
          {data.length > 0
            ? `${data.length} agendada${data.length > 1 ? 's' : ''}`
            : 'Nenhuma audiência agendada'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/55 mb-3" />
            <p className="text-sm text-muted-foreground">Não há audiências próximas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 5).map((aud) => {
              const { label, sublabel, urgency } = getDateLabel(aud.data_audiencia);
              const styles = urgencyStyles[urgency];

              return (
                <div
                  key={aud.id}
                  className={cn(
                    'flex gap-3 rounded-lg border border-l-[3px] p-3 transition-colors hover:bg-muted/50',
                    styles.border,
                    styles.bg,
                  )}
                >
                  <div className={cn('flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 text-center min-w-13', styles.badge)}>
                    <span className="text-[10px] font-bold uppercase leading-tight">{label}</span>
                    <span className="text-[10px] opacity-80 leading-tight">{sublabel}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium truncate">{aud.numero_processo}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {aud.hora_audiencia && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {aud.hora_audiencia.substring(0, 5)}
                        </span>
                      )}
                      {aud.tipo_audiencia && <span>{aud.tipo_audiencia}</span>}
                      {aud.url_audiencia_virtual ? (
                        <a
                          href={aud.url_audiencia_virtual}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-info hover:underline"
                        >
                          <Video className="h-3 w-3" />
                          Virtual
                        </a>
                      ) : aud.sala ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Sala {aud.sala}
                        </span>
                      ) : null}
                    </div>
                    {aud.responsavel_nome && (
                      <p className="text-xs text-muted-foreground">{aud.responsavel_nome}</p>
                    )}
                  </div>
                </div>
              );
            })}

            <Link href="/app/audiencias" className="block">
              <Button variant="ghost" size="sm" className="w-full mt-1 text-muted-foreground hover:text-foreground">
                Ver todas as audiências
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
