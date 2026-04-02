'use client';

import * as React from 'react';
import { format, isToday } from 'date-fns';

import { AppBadge } from '@/components/ui/app-badge';

import type { PaginatedResponse } from '@/types';
import type { Pericia, ListarPericiasParams, PericiasFilters } from '../domain';
import { actionListarPericias } from '../actions/pericias-actions';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';

interface PericiasCalendarMonthProps {
  currentDate: Date;
  globalFilter?: string;
  situacaoCodigo?: PericiasFilters['situacaoCodigo'];
  trt?: PericiasFilters['trt'];
  grau?: PericiasFilters['grau'];
  responsavelId?: PericiasFilters['responsavelId'];
  semResponsavel?: PericiasFilters['semResponsavel'];
  especialidadeId?: PericiasFilters['especialidadeId'];
  peritoId?: PericiasFilters['peritoId'];
  laudoJuntado?: PericiasFilters['laudoJuntado'];
  onLoadingChange?: (loading: boolean) => void;
}

export function PericiasCalendarMonth({
  currentDate,
  globalFilter = '',
  situacaoCodigo,
  trt,
  grau,
  responsavelId,
  semResponsavel,
  especialidadeId,
  peritoId,
  laudoJuntado,
  onLoadingChange,
}: PericiasCalendarMonthProps) {
  const [data, setData] = React.useState<PaginatedResponse<Pericia> | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const [periciaSelecionada, setPericiaSelecionada] =
    React.useState<Pericia | null>(null);
  const [periciasDia, setPericiasDia] = React.useState<Pericia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const pericias = React.useMemo(() => data?.data || [], [data]);

  const diasMes = React.useMemo(() => {
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasAnteriores = primeiroDia.getDay() === 0 ? 6 : primeiroDia.getDay() - 1;

    const dias: (Date | null)[] = [];
    for (let i = 0; i < diasAnteriores; i++) dias.push(null);
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) dias.push(new Date(ano, mes, dia));

    return dias;
  }, [currentDate]);

  const periciasPorDia = React.useMemo(() => {
    const mapa = new Map<string, Pericia[]>();
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();

    pericias.forEach((p) => {
      if (!p.prazoEntrega) return;
      const d = new Date(p.prazoEntrega);
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        const chave = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!mapa.has(chave)) mapa.set(chave, []);
        mapa.get(chave)!.push(p);
      }
    });

    mapa.forEach((list) => {
      list.sort((a, b) => {
        const da = a.prazoEntrega ? new Date(a.prazoEntrega).getTime() : 0;
        const db = b.prazoEntrega ? new Date(b.prazoEntrega).getTime() : 0;
        return da - db;
      });
    });

    return mapa;
  }, [pericias, currentDate]);

  const getPericiasDia = (dia: Date | null) => {
    if (!dia) return [];
    const chave = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`;
    return periciasPorDia.get(chave) || [];
  };

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const params: ListarPericiasParams = {
        pagina: 1,
        limite: 1000,
        busca: globalFilter || undefined,
      };

      const filters: PericiasFilters = {
        prazoEntregaInicio: format(start, 'yyyy-MM-dd'),
        prazoEntregaFim: format(end, 'yyyy-MM-dd'),
        situacaoCodigo,
        trt,
        grau,
        responsavelId,
        semResponsavel,
        especialidadeId,
        peritoId,
        laudoJuntado,
      };

      const result = await actionListarPericias({ ...params, ...filters });
      if (!result.success) throw new Error(result.message || 'Erro ao listar perícias');

      setData(result.data as PaginatedResponse<Pericia>);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentDate,
    globalFilter,
    situacaoCodigo,
    trt,
    grau,
    responsavelId,
    semResponsavel,
    especialidadeId,
    peritoId,
    laudoJuntado,
  ]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePericiaClick = (p: Pericia) => {
    setPericiaSelecionada(p);
    setPericiasDia([]);
    setDialogOpen(true);
  };

  const handleMaisClick = (dia: Date) => {
    const ps = getPericiasDia(dia);
    setPericiasDia(ps);
    setPericiaSelecionada(null);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-card overflow-x-auto">
        <div className="min-w-150">
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, i) => (
            <div
              key={dia}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              <span className="hidden sm:inline">{dia}</span>
              <span className="sm:hidden">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {diasMes.map((dia, idx) => {
            const ps = getPericiasDia(dia);
            const hasPs = ps.length > 0;
            const isTodayDate = dia && isToday(dia);

            return (
              <div
                key={idx}
                className={`
                  min-h-20 sm:min-h-30 border-r border-b p-1 sm:p-2 transition-colors relative
                  ${!dia ? 'bg-muted/10' : ''}
                  ${isTodayDate ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                  ${hasPs && dia ? 'hover:bg-muted/50' : ''}
                `}
              >
                {dia && (
                  <>
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isTodayDate
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {dia.getDate()}
                    </div>

                    {hasPs && (
                      <div className="space-y-1">
                        {ps.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handlePericiaClick(p);
                            }}
                            className="text-xs px-1.5 py-0.5 rounded cursor-pointer truncate border bg-primary/10 text-primary border-primary/20"
                            title={p.numeroProcesso}
                          >
                            {p.numeroProcesso}
                          </div>
                        ))}

                        {ps.length > 3 && (
                          <AppBadge
                            variant="secondary"
                            className="w-full justify-center text-[10px] h-5 cursor-pointer hover:bg-secondary/80"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleMaisClick(dia);
                            }}
                          >
                            +{ps.length - 3} mais
                          </AppBadge>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <PericiaDetalhesDialog
        pericia={periciaSelecionada}
        pericias={periciasDia.length > 0 ? periciasDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}


