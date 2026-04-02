
'use client';

import { useEffect } from 'react';
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
import { Upload, FileCheck, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils'; // Using local utils
import { EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Typography } from '@/components/ui/typography';
import { useRepassesPendentes } from '../../hooks/use-repasses-pendentes';

interface RepassesListProps {
  onAnexarDeclaracao?: (parcelaId: number) => void;
  onRealizarRepasse?: (parcelaId: number, valorRepasse: number) => void;
  refreshToken?: number;
}

export function RepassesPendentesList({ onAnexarDeclaracao, onRealizarRepasse, refreshToken }: RepassesListProps) {
  const { data: repasses, isLoading, error, refetch } = useRepassesPendentes();

  // Trigger refetch when refreshToken changes
  useEffect(() => {
    if (refreshToken !== undefined && refreshToken > 0) {
      refetch();
    }
  }, [refreshToken, refetch]);

  // If we just loaded (or still same array ref), we filter for display
  const repassesPendentesDecl = repasses.filter(r => r.statusRepasse === 'pendente_declaracao');
  const repassesPendentesTransf = repasses.filter(r => r.statusRepasse === 'pendente_transferencia');

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (error) return <div className="text-red-500">{error}</div>;

  const getStatusBadge = (status: string) => {
      // Simplification of logic
      if (status === 'pendente_declaracao') return <Badge variant="warning">Aguardando Declaração</Badge>;
      if (status === 'pendente_transferencia') return <Badge variant="info">Pronto p/ Transferir</Badge>;
      return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      {repassesPendentesDecl.length > 0 && (
         <div className="space-y-4">
            <Typography.H4>Aguardando Declaração</Typography.H4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                   <TableRow>
                     <TableHead>Processo</TableHead><TableHead>Parcela</TableHead><TableHead>Valor</TableHead><TableHead>Recebimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {repassesPendentesDecl.map(r => (
                      <TableRow key={r.parcelaId}>
                         <TableCell>{r.processoId}</TableCell>
                         <TableCell>{r.numeroParcela}</TableCell>
                         <TableCell>{formatCurrency(r.valorRepasseCliente)}</TableCell>
                         <TableCell>{formatDate(r.dataEfetivacao)}</TableCell>
                         <TableCell>{getStatusBadge(r.statusRepasse)}</TableCell>
                         <TableCell className="text-right">
                            {onAnexarDeclaracao && (
                                <Button size="sm" variant="outline" onClick={() => onAnexarDeclaracao(r.parcelaId)}>
                                   <Upload className="h-4 w-4 mr-1" /> Anexar
                                </Button>
                            )}
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
              </Table>
            </div>
         </div>
      )}

      {repassesPendentesTransf.length > 0 && (
         <div className="space-y-4">
            <Typography.H4>Prontos para Transferência</Typography.H4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                   <TableRow>
                     <TableHead>Processo</TableHead><TableHead>Parcela</TableHead><TableHead>Valor</TableHead><TableHead>Recebimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {repassesPendentesTransf.map(r => (
                      <TableRow key={r.parcelaId}>
                         <TableCell>{r.processoId}</TableCell>
                         <TableCell>{r.numeroParcela}</TableCell>
                         <TableCell>{formatCurrency(r.valorRepasseCliente)}</TableCell>
                         <TableCell>{formatDate(r.dataEfetivacao)}</TableCell>
                         <TableCell>{getStatusBadge(r.statusRepasse)}</TableCell>
                         <TableCell className="text-right">
                             {onRealizarRepasse && (
                                 <Button size="sm" onClick={() => onRealizarRepasse(r.parcelaId, r.valorRepasseCliente)}>
                                     <FileCheck className="h-4 w-4 mr-1" /> Repassar
                                 </Button>
                             )}
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
              </Table>
            </div>
         </div>
      )}

      {repasses.length === 0 && <EmptyHeader><EmptyTitle>Nenhum repasse pendente</EmptyTitle></EmptyHeader>}
    </div>
  );
}
