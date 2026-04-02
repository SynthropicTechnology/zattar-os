'use client';

import * as React from 'react';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';
import type { AcordoComParcelas, ObrigacaoComDetalhes, StatusObrigacao, DisplayItem } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';
import { format, isToday, parseISO } from 'date-fns';

interface ObrigacoesCalendarMonthProps {
  currentDate: Date;
  onLoadingChange?: (loading: boolean) => void;
}

export function ObrigacoesCalendarMonth({
  currentDate,
  onLoadingChange,
}: ObrigacoesCalendarMonthProps) {

  // Data State
  const [obrigacoes, setObrigacoes] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Interaction State
  const [itemSelecionado, setItemSelecionado] = React.useState<ObrigacaoComDetalhes | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Notify parent about loading state changes
  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

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

   // Helper to group by day (Parcelas flattened)
  const itensPorDia = React.useMemo(() => {
    const mapa = new Map<string, DisplayItem[]>();
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();

    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
          if (!parcela.dataVencimento) return;
          const dataVenc = parseISO(parcela.dataVencimento);
          
          if (dataVenc.getFullYear() === ano && dataVenc.getMonth() === mes) {
             const chave = `${dataVenc.getFullYear()}-${dataVenc.getMonth()}-${dataVenc.getDate()}`;
             if (!mapa.has(chave)) mapa.set(chave, []);
             
             // Create a display item
             mapa.get(chave)!.push({
                 id: parcela.id,
                 acordoId: acordo.id,
                 descricao: `Parcela ${parcela.numeroParcela} - Processo ${acordo.processo?.numero_processo || 'N/A'}`,
                 valor: parcela.valorBrutoCreditoPrincipal,
                 status: parcela.status === 'atrasada' ? 'vencida' : (parcela.status === 'recebida' || parcela.status === 'paga' ? 'efetivada' : 'pendente'),
                 originalParcela: parcela,
                 originalAcordo: acordo
             });
          }
      });
    });

    return mapa;
  }, [obrigacoes, currentDate]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(start, 'yyyy-MM-dd'),
        dataFim: format(end, 'yyyy-MM-dd'),
        incluirSemData: false,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao listar obrigações');

      setObrigacoes(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getItensDia = (dia: Date | null) => {
    if (!dia) return [];
    const chave = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`;
    return itensPorDia.get(chave) || [];
  };

  const handleItemClick = (item: DisplayItem) => {
      // Map to ObrigacaoComDetalhes
      const detalhes: ObrigacaoComDetalhes = {
          id: item.id,
          tipo: item.originalAcordo.tipo,
          descricao: item.descricao,
          valor: item.valor,
          dataVencimento: item.originalParcela.dataVencimento,
          status: item.status as StatusObrigacao,
          statusSincronizacao: 'nao_aplicavel', // Placeholder
          diasAteVencimento: null, // Calculate if needed
          tipoEntidade: 'parcela',
          acordoId: item.acordoId,
          processoId: item.originalAcordo.processoId,
      };
      
    setItemSelecionado(detalhes);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden bg-white dark:bg-card overflow-x-auto">
          <div className="min-w-150">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-muted/50 border-b">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, i) => (
                    <div key={dia} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      <span className="hidden sm:inline">{dia}</span>
                      <span className="sm:hidden">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}</span>
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 auto-rows-fr">
                {diasMes.map((dia, idx) => {
                     const itens = getItensDia(dia);
                     const hasItens = itens.length > 0;
                     const isTodayDate = dia && isToday(dia);

                     return (
                        <div
                            key={idx}
                            className={`
                                min-h-20 sm:min-h-30 border-r border-b p-1 sm:p-2 transition-colors relative
                                ${!dia ? 'bg-muted/10' : ''}
                                ${isTodayDate ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                                ${hasItens && dia ? 'hover:bg-muted/50' : ''}
                            `}
                        >
                            {dia && (
                                <>
                                    <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                        {dia.getDate()}
                                    </div>
                                    
                                    {hasItens && (
                                        <div className="space-y-1">
                                            {itens.slice(0, 3).map(item => (
                                                <div 
                                                    key={item.id}
                                                    onClick={(ev) => { ev.stopPropagation(); handleItemClick(item); }}
                                                    className={`
                                                        text-xs px-1.5 py-0.5 rounded cursor-pointer truncate border
                                                        ${item.status === 'vencida' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' : 
                                                          item.status === 'efetivada' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                                                          'bg-primary/10 text-primary border-primary/20'}
                                                    `}
                                                    title={item.descricao}
                                                >
                                                   {item.descricao}
                                                </div>
                                            ))}
                                            {itens.length > 3 && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="w-full justify-center text-[10px] h-5 cursor-pointer hover:bg-secondary/80"
                                                >
                                                    +{itens.length - 3} mais
                                                </Badge>
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

        <ObrigacaoDetalhesDialog
            obrigacao={itemSelecionado}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
        />
    </div>
  );
}
