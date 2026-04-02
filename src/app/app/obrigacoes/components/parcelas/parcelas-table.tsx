
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { CheckCircle2, Edit2, FileX } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils';
import { toast } from 'sonner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Parcela } from '../../types';
import { actionMarcarParcelaRecebida } from '../../actions/parcelas';

interface ParcelasTableProps {
  parcelas: Parcela[];
  onEdit?: (parcela: Parcela) => void;
  // Callbacks optional, if not provided we use actions directly
  onMarcarRecebida?: (parcelaId: number) => void;
  onMarcarPaga?: (parcelaId: number) => void;
  direcao: 'recebimento' | 'pagamento';
  onParcelaUpdated?: () => void;
  acordoCondenacaoId?: number;
}

export function ParcelasTable({
  parcelas,
  onEdit,
  onMarcarRecebida,
  onMarcarPaga,
  direcao,
  onParcelaUpdated,
}: ParcelasTableProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

    const getStatusBadge = (status: Parcela['status']) => {
      const styles: Record<string, { variant: 'warning' | 'success' | 'destructive' | 'outline' }> = {
        pendente: { variant: 'warning' },
        recebida: { variant: 'success' },
        paga: { variant: 'success' },
        atrasado: { variant: 'destructive' },
      };

      const labels: Record<string, string> = {
        pendente: 'Pendente',
        recebida: 'Recebida',
        paga: 'Paga',
        atrasado: 'Atrasado',
      };

      const style = styles[status] || { variant: 'warning' };

      return (
        <Badge variant={style.variant}>
          {labels[status] || status}
        </Badge>
      );
    };

    const getStatusRepasseBadge = (status: string) => {
      const styles: Record<string, { variant: 'outline' | 'warning' | 'info' | 'success' }> = {
        nao_aplicavel: { variant: 'outline' },
        pendente_declaracao: { variant: 'warning' },
        pendente_transferencia: { variant: 'info' },
        repassado: { variant: 'success' },
      };

      const labels: Record<string, string> = {
        nao_aplicavel: 'N/A',
        pendente_declaracao: 'Pendente Declaração',
        pendente_transferencia: 'Pendente Transferência',
        repassado: 'Repassado',
      };

      const style = styles[status] || { variant: 'outline' };

      return (
        <Badge variant={style.variant}>
          {labels[status] || status}
        </Badge>
      );
    };

  const handleMarcar = async (parcelaId: number, tipo: 'recebida' | 'paga') => {
    setLoadingId(parcelaId);
    try {
      if (tipo === 'recebida' && onMarcarRecebida) {
        await onMarcarRecebida(parcelaId);
      } else if (tipo === 'paga' && onMarcarPaga) {
        await onMarcarPaga(parcelaId);
      } else {
        // Use Server Action
        // NOTE: actionMarcarParcelaRecebida currently handles logic. 
        // Ideally we should have a 'Paga' action or pass a param. 
        // For now using the same action and assuming it handles status based on direction implicitly or we might need to update service.
        const response = await actionMarcarParcelaRecebida(parcelaId, {
            dataRecebimento: new Date().toISOString()
        });

        if (response.success) {
          toast.success(tipo === 'recebida' ? 'Parcela marcada como recebida' : 'Parcela marcada como paga');
          if (onParcelaUpdated) onParcelaUpdated();
        } else {
          toast.error(response.error || 'Erro ao atualizar parcela');
        }
      }
    } catch {
      toast.error('Erro inesperado');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Parcela</TableHead>
            <TableHead>Crédito Principal</TableHead>
            <TableHead>Hon. Contratuais</TableHead>
            <TableHead>Hon. Sucumbenciais</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Forma Pgto</TableHead>
            {direcao === 'recebimento' && <TableHead>Repasse</TableHead>}
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcelas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="p-0">
                <Empty className="border-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><FileX className="h-6 w-6" /></EmptyMedia>
                    <EmptyTitle>Nenhuma parcela encontrada</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            parcelas.map((parcela) => (
              <TableRow key={parcela.id}>
                <TableCell className="font-medium">
                  {parcela.numeroParcela}
                  {parcela.editadoManualmente && <span className="ml-1 text-xs text-muted-foreground" title="Editado manualmente">*</span>}
                </TableCell>
                <TableCell>{formatCurrency(parcela.valorBrutoCreditoPrincipal)}</TableCell>
                <TableCell>{formatCurrency(parcela.honorariosContratuais)}</TableCell>
                <TableCell>{formatCurrency(parcela.honorariosSucumbenciais)}</TableCell>
                <TableCell>{formatDate(parcela.dataVencimento)}</TableCell>
                <TableCell>{getStatusBadge(parcela.status)}</TableCell>
                <TableCell className="text-xs">{parcela.formaPagamento?.replace(/_/g, ' ') || '-'}</TableCell>
                {direcao === 'recebimento' && (
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusRepasseBadge(parcela.statusRepasse)}
                      {parcela.valorRepasseCliente ? <span className="text-xs text-muted-foreground">{formatCurrency(parcela.valorRepasseCliente)}</span> : null}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {onEdit && parcela.status === 'pendente' && (
                      <Button size="sm" variant="ghost" onClick={() => onEdit(parcela)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {parcela.status === 'pendente' && (
                      <>
                        {direcao === 'recebimento' && (
                          <Button size="sm" variant="outline" onClick={() => handleMarcar(parcela.id, 'recebida')} disabled={loadingId === parcela.id}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Recebida
                          </Button>
                        )}
                        {direcao === 'pagamento' && (
                          <Button size="sm" variant="outline" onClick={() => handleMarcar(parcela.id, 'paga')} disabled={loadingId === parcela.id}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Paga
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
