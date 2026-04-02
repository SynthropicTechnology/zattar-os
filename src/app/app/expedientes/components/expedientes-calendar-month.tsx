'use client';

import * as React from 'react';
import { AppBadge } from '@/components/ui/app-badge';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';
import type { PaginatedResponse } from '@/types';
import type { Expediente, ListarExpedientesParams, ExpedientesFilters } from '../domain';
import { actionListarExpedientes } from '../actions';
import { format, isToday } from 'date-fns';

interface ExpedientesCalendarMonthProps {
  /** Data de referência passada pelo parent (ExpedientesContent) */
  currentDate: Date;
  /** Filtro de status controlado pelo parent */
  statusFilter?: 'todos' | 'pendentes' | 'baixados';
  /** Filtro de busca controlado pelo parent */
  globalFilter?: string;
  /** Callback quando os dados são atualizados (para sincronizar loading state) */
  onLoadingChange?: (loading: boolean) => void;
}

export function ExpedientesCalendarMonth({
  currentDate,
  statusFilter = 'pendentes',
  globalFilter = '',
  onLoadingChange,
}: ExpedientesCalendarMonthProps) {

  // Data State
  const [data, setData] = React.useState<PaginatedResponse<Expediente> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Interaction State
  const [expedienteSelecionado, setExpedienteSelecionado] = React.useState<Expediente | null>(null);
  const [expedientesDia, setExpedientesDia] = React.useState<Expediente[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Notify parent about loading state changes
  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Derived - memoize to prevent unnecessary re-renders
  const expedientes = React.useMemo(() => data?.data || [], [data]);

  // Itens especiais
  const semPrazoPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && !e.dataPrazoLegalParte),
    [expedientes]
  );
  const vencidosPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && e.prazoVencido === true),
    [expedientes]
  );
  const pinnedIds = React.useMemo(
    () => new Set<number>([...semPrazoPendentes.map((e) => e.id), ...vencidosPendentes.map((e) => e.id)]),
    [semPrazoPendentes, vencidosPendentes]
  );

  // Generate days
  const diasMes = React.useMemo(() => {
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    // Ajuste para semana começando em segunda-feira (padrão pt-BR)
    const diasAnteriores = primeiroDia.getDay() === 0 ? 6 : primeiroDia.getDay() - 1;

    const dias: (Date | null)[] = [];
    for (let i = 0; i < diasAnteriores; i++) dias.push(null);
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) dias.push(new Date(ano, mes, dia));

    return dias;
  }, [currentDate]);

   // Helper to group by day
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Map<string, Expediente[]>();
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();

    expedientes.forEach((expediente) => {
      if (!expediente.dataPrazoLegalParte) return;

      const dataExp = new Date(expediente.dataPrazoLegalParte);

      // Local check
      if (dataExp.getFullYear() === ano && dataExp.getMonth() === mes) {
        const chave = `${dataExp.getFullYear()}-${dataExp.getMonth()}-${dataExp.getDate()}`;
        if (!mapa.has(chave)) mapa.set(chave, []);
        mapa.get(chave)!.push(expediente);
      }
    });

    // Sort
    mapa.forEach((list) => {
        list.sort((a, b) => {
            const da = a.dataPrazoLegalParte ? new Date(a.dataPrazoLegalParte).getTime() : 0;
            const db = b.dataPrazoLegalParte ? new Date(b.dataPrazoLegalParte).getTime() : 0;
            return da - db;
        });
    });

    return mapa;
  }, [expedientes, currentDate]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const params: ListarExpedientesParams = {
        pagina: 1,
        limite: 1000,
        busca: globalFilter || undefined,
      };

      const filters: ExpedientesFilters = {
        dataPrazoLegalInicio: format(start, 'yyyy-MM-dd'),
        dataPrazoLegalFim: format(end, 'yyyy-MM-dd'),
        // Preserva comportamento legado: itens "sem prazo" devem aparecer no calendário
        // mesmo quando aplicamos filtro de range por data de prazo.
        incluirSemPrazo: true,
      };

      if (statusFilter === 'pendentes') filters.baixado = false;
      if (statusFilter === 'baixados') filters.baixado = true;

      const result = await actionListarExpedientes({ ...params, ...filters });
      if (!result.success) throw new Error(result.message || 'Erro ao listar expedientes');

      setData(result.data as PaginatedResponse<Expediente>);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, globalFilter, statusFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getExpedientesDia = (dia: Date | null) => {
    if (!dia) return [];
    const chave = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`;
    const lista = expedientesPorDia.get(chave) || [];
    const restantes = lista.filter((e) => !pinnedIds.has(e.id));
    
    // Always include pinned items in every day view effectively? 
    // Legacy implementation did this: return [...semPrazoPendentes, ...vencidosPendentes, ...restantes];
    // This seems to imply pinned items are shown on *every* day or just available?
    // In legacy day render: "temExpedientes" checks length > 0.
    // So if pinned items exist, every day is marked? 
    // Yes, that seems to be the intent or legacy behavior: tasks without deadliness are 'floating'.
    
    return [...semPrazoPendentes, ...vencidosPendentes, ...restantes];
  };

  const handleExpedienteClick = (expediente: Expediente) => {
    setExpedienteSelecionado(expediente);
    setExpedientesDia([]);
    setDialogOpen(true);
  };

  const handleMaisClick = (dia: Date) => {
    const exps = getExpedientesDia(dia);
    setExpedientesDia(exps);
    setExpedienteSelecionado(null);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden bg-white dark:bg-card">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-muted/50 border-b">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia) => (
                    <div key={dia} className="p-2 text-center text-sm font-medium text-muted-foreground">{dia}</div>
                ))}
            </div>
            
            {/* Days */}
            <div className="grid grid-cols-7 auto-rows-fr">
                {diasMes.map((dia, idx) => {
                     const exps = getExpedientesDia(dia);
                     const hasExps = exps.length > 0;
                     const isTodayDate = dia && isToday(dia);
                     
                     return (
                        <div 
                            key={idx} 
                            className={`
                                min-h-[120px] border-r border-b p-2 transition-colors relative
                                ${!dia ? 'bg-muted/10' : ''}
                                ${isTodayDate ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                                ${hasExps && dia ? 'hover:bg-muted/50' : ''}
                            `}
                        >
                            {dia && (
                                <>
                                    <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                        {dia.getDate()}
                                    </div>
                                    
                                    {hasExps && (
                                        <div className="space-y-1">
                                            {exps.slice(0, 3).map(e => (
                                                <div 
                                                    key={e.id}
                                                    onClick={(ev) => { ev.stopPropagation(); handleExpedienteClick(e); }}
                                                    className={`
                                                        text-xs px-1.5 py-0.5 rounded cursor-pointer truncate border
                                                        ${e.prazoVencido ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' : 'bg-primary/10 text-primary border-primary/20'}
                                                    `}
                                                    title={`${e.classeJudicial} ${e.numeroProcesso}`}
                                                >
                                                   {e.classeJudicial} {e.numeroProcesso}
                                                </div>
                                            ))}
                                            {exps.length > 3 && (
                                                <AppBadge 
                                                    variant="secondary" 
                                                    className="w-full justify-center text-[10px] h-5 cursor-pointer hover:bg-secondary/80"
                                                    onClick={(ev) => { ev.stopPropagation(); handleMaisClick(dia); }}
                                                >
                                                    +{exps.length - 3} mais
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

        <ExpedienteDetalhesDialog
            expediente={expedienteSelecionado}
            expedientes={expedientesDia.length > 0 ? expedientesDia : undefined}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={fetchData}
        />
    </div>
  );
}
