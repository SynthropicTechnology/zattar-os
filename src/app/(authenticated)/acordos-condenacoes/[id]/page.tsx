
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import Link from 'next/link';
import {
  formatCurrency,
  formatarTipo,
  formatarDirecao,
  ParcelasTable,
  EditParcelaDialog,
  IntegracaoFinanceiraSection,
  type AcordoComParcelas,
  type Parcela,
} from '@/app/(authenticated)/obrigacoes';
import { actionBuscarAcordo, actionDeletarAcordo } from '@/app/(authenticated)/obrigacoes/server-actions';
import { formatDate } from '@/lib/formatters';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyContent } from '@/components/ui/empty';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface AcordoDetalhesPageProps {
  params: Promise<{ id: string }>;
}

export default function AcordoDetalhesPage({ params }: AcordoDetalhesPageProps) {
  const router = useRouter();
  const [acordo, setAcordo] = useState<AcordoComParcelas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [acordoId, setAcordoId] = useState<number | null>(null);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    parcela: Parcela | null;
  }>({
    open: false,
    parcela: null,
  });

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      const id = parseInt(resolvedParams.id, 10);
      setAcordoId(id);
    }
    resolveParams();
  }, [params]);

  const loadAcordo = useCallback(async () => {
    if (acordoId === null) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await actionBuscarAcordo(acordoId);
      if (result.success && result.data) {
        setAcordo(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch {
      setError('Erro ao comunicar com o servidor');
    } finally {
      setIsLoading(false);
    }
  }, [acordoId]);

  useEffect(() => {
    if (acordoId !== null) loadAcordo();
  }, [acordoId, loadAcordo]);

  const handleDelete = async () => {
    if (acordoId === null) return;
    try {
      setIsDeleting(true);
      const result = await actionDeletarAcordo(acordoId);
      if (result.success) {
        toast.success('Acordo deletado com sucesso');
        router.push('/acordos-condenacoes');
      } else {
        toast.error(result.error || 'Erro ao deletar');
      }
    } catch {
      toast.error('Erro ao comunicar com o servidor');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusConfigs = {
    pendente: { label: 'Pendente', variant: 'secondary' as const },
    pago_parcial: { label: 'Pago Parcial', variant: 'default' as const },
    pago_total: { label: 'Pago Total', variant: 'default' as const },
    atrasado: { label: 'Atrasado', variant: 'destructive' as const },
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Loader2 className="h-6 w-6 animate-spin" /></EmptyMedia><EmptyTitle>Carregando detalhes...</EmptyTitle></EmptyHeader></Empty>
      </div>
    );
  }

  if (error || !acordo) {
    return (
      <div className="container mx-auto py-8">
        <Empty className="border-destructive">
          <EmptyHeader>
            <EmptyMedia variant="icon"><AlertCircle className="h-6 w-6 text-destructive" /></EmptyMedia>
            <EmptyTitle className="text-destructive">{error || 'Acordo não encontrado'}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => router.push('/acordos-condenacoes')}>Voltar para Lista</Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const statusConfig = statusConfigs[acordo.status] || statusConfigs.pendente;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/acordos-condenacoes"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{formatarTipo(acordo.tipo)}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">Processo #{acordo.processoId}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/acordos-condenacoes/${acordoId}/editar`}><Edit className="h-4 w-4 mr-1" /> Editar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}><Trash2 className="h-4 w-4 mr-1" /> Excluir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita e todas as parcelas serão removidas.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Confirmar Exclusão</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Detalhes */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Detalhes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div><p className="text-sm text-muted-foreground mb-1">Tipo</p><p className="font-medium">{formatarTipo(acordo.tipo)}</p></div>
          <div><p className="text-sm text-muted-foreground mb-1">Direção</p><p className="font-medium">{formatarDirecao(acordo.direcao)}</p></div>
          <div><p className="text-sm text-muted-foreground mb-1">Valor Total</p><p className="font-medium text-lg">{formatCurrency(acordo.valorTotal)}</p></div>
          <div><p className="text-sm text-muted-foreground mb-1">Parcelas</p><p className="font-medium">{acordo.numeroParcelas}x</p></div>
          <div><p className="text-sm text-muted-foreground mb-1">1ª Parcela</p><p className="font-medium">{formatDate(acordo.dataVencimentoPrimeiraParcela)}</p></div>
          {acordo.formaDistribuicao && <div><p className="text-sm text-muted-foreground mb-1">Distribuição</p><p className="font-medium capitalize">{acordo.formaDistribuicao}</p></div>}
          {acordo.percentualEscritorio !== undefined && <div><p className="text-sm text-muted-foreground mb-1">Perc. Escritório</p><p className="font-medium">{acordo.percentualEscritorio}%</p></div>}
          {acordo.honorariosSucumbenciaisTotal !== undefined && acordo.honorariosSucumbenciaisTotal > 0 && <div><p className="text-sm text-muted-foreground mb-1">Hon. Sucumbenciais</p><p className="font-medium">{formatCurrency(acordo.honorariosSucumbenciaisTotal)}</p></div>}
          <div><p className="text-sm text-muted-foreground mb-1">Criado em</p><p className="font-medium">{formatDate(acordo.createdAt)}</p></div>
          <div><p className="text-sm text-muted-foreground mb-1">Atualizado em</p><p className="font-medium">{formatDate(acordo.updatedAt)}</p></div>
        </div>
      </div>

      {/* Parcelas */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Parcelas</h2>
        <ParcelasTable
          parcelas={acordo.parcelas || []}
          direcao={acordo.direcao}
          onParcelaUpdated={loadAcordo}
          acordoCondenacaoId={acordo.id}
          onEdit={(parcela) => setEditDialog({ open: true, parcela })}
        />
      </div>

      {/* Integração Financeira */}
      <IntegracaoFinanceiraSection acordoId={acordo.id} onSyncComplete={loadAcordo} />

      {/* Dialog Edição Parcela */}
      {editDialog.parcela && acordoId && (
        <EditParcelaDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}
          parcela={editDialog.parcela}
          acordoCondenacaoId={acordoId}
          onSuccess={() => { loadAcordo(); setEditDialog({ open: false, parcela: null }); }}
        />
      )}
    </div>
  );
}
