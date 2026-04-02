'use client';

import * as React from 'react';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';
import type { AcordoComParcelas, ObrigacaoComDetalhes, StatusObrigacao, DisplayItem } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { YearCalendarGrid } from '@/components/shared/year-calendar-grid';

interface ObrigacoesCalendarYearProps {
  currentDate: Date;
  onLoadingChange?: (loading: boolean) => void;
}

export function ObrigacoesCalendarYear({
  currentDate,
  onLoadingChange,
}: ObrigacoesCalendarYearProps) {
  const [obrigacoes, setObrigacoes] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // State for Day List Dialog
  const [dayListOpen, setDayListOpen] = React.useState(false);
  const [selectedDayItens, setSelectedDayItens] = React.useState<DisplayItem[]>([]);
  const [selectedDayDate, setSelectedDayDate] = React.useState<Date | null>(null);

  // State for Details Dialog
  const [itemSelecionado, setItemSelecionado] = React.useState<ObrigacaoComDetalhes | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      const end = new Date(currentDate.getFullYear(), 11, 31);

      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(start, 'yyyy-MM-dd'),
        dataFim: format(end, 'yyyy-MM-dd'),
        incluirSemData: false,
      });

      if (result.success && result.data) setObrigacoes(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Flatten items
  const itensPorDia = React.useMemo(() => {
    const mapa = new Map<string, DisplayItem[]>();
    const ano = currentDate.getFullYear();

    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
          if (!parcela.dataVencimento) return;
          const dataVenc = parseISO(parcela.dataVencimento);

          if (dataVenc.getFullYear() === ano) {
             const chave = `${dataVenc.getMonth()}-${dataVenc.getDate()}`;
             if (!mapa.has(chave)) mapa.set(chave, []);

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

  const hasDayContent = React.useCallback(
    (mes: number, dia: number) => {
      const chave = `${mes}-${dia}`;
      const itens = itensPorDia.get(chave);
      return !!(itens && itens.length > 0);
    },
    [itensPorDia],
  );

  const handleDiaClick = React.useCallback(
    (mes: number, dia: number) => {
      const chave = `${mes}-${dia}`;
      const itens = itensPorDia.get(chave);
      if (itens && itens.length > 0) {
        setSelectedDayItens(itens);
        setSelectedDayDate(new Date(currentDate.getFullYear(), mes, dia));
        setDayListOpen(true);
      }
    },
    [itensPorDia, currentDate],
  );

  const handleItemClick = (item: DisplayItem) => {
      const detalhes: ObrigacaoComDetalhes = {
          id: item.id,
          tipo: item.originalAcordo.tipo,
          descricao: item.descricao,
          valor: item.valor,
          dataVencimento: item.originalParcela.dataVencimento,
          status: item.status as StatusObrigacao,
          statusSincronizacao: 'nao_aplicavel',
          diasAteVencimento: null,
          tipoEntidade: 'parcela',
          acordoId: item.acordoId,
          processoId: item.originalAcordo.processoId,
      };

    setItemSelecionado(detalhes);
    setDetailsOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <YearCalendarGrid
        year={currentDate.getFullYear()}
        hasDayContent={hasDayContent}
        onDayClick={handleDiaClick}
      />

      {/* Dialog lista do dia */}
      <Dialog open={dayListOpen} onOpenChange={setDayListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
                {selectedDayDate ? format(selectedDayDate, 'dd/MM/yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 p-1">
                {selectedDayItens.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.descricao}</span>
                            <span className="text-xs text-muted-foreground capitalize">{item.status}</span>
                        </div>
                        <Badge variant={item.status === 'vencida' ? 'destructive' : 'outline'}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </Badge>
                    </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ObrigacaoDetalhesDialog
        obrigacao={itemSelecionado}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
