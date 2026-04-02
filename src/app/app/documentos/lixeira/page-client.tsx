'use client';

/**
 * Página da Lixeira de Documentos
 * Lista documentos excluídos com opções de restaurar ou deletar permanentemente
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/shared/page-shell';
import { FilterPopover } from '@/app/app/partes';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DocumentoComUsuario } from '@/app/app/documentos';
import {
  actionListarLixeira,
  actionRestaurarDaLixeira,
  actionDeletarPermanentemente
} from '@/app/app/documentos';

// ============================================================================
// Constantes
// ============================================================================

const PERIODO_OPTIONS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: 'todos', label: 'Todos' },
] as const;

type PeriodoFiltro = 'hoje' | '7dias' | '30dias' | 'todos';

// ============================================================================
// Funções Auxiliares
// ============================================================================

function filtrarDocumentosPorPeriodo(
  documentos: DocumentoComUsuario[],
  periodo: PeriodoFiltro
): DocumentoComUsuario[] {
  if (periodo === 'todos') return documentos;
  
  const agora = new Date();
  const limiteData = new Date();
  
  switch (periodo) {
    case 'hoje':
      limiteData.setHours(0, 0, 0, 0);
      break;
    case '7dias':
      limiteData.setDate(agora.getDate() - 7);
      break;
    case '30dias':
      limiteData.setDate(agora.getDate() - 30);
      break;
  }
  
  return documentos.filter((doc) => {
    if (!doc.deleted_at) return false;
    const deletedDate = new Date(doc.deleted_at);
    return deletedDate >= limiteData;
  });
}

function formatDeletedAt(date: string | null): string {
  if (!date) return 'Data desconhecida';
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  });
}

// ============================================================================
// Componentes de UI
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function EmptyState({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="flex h-100 items-center justify-center">
      <div className="text-center">
        <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Lixeira vazia</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Documentos excluídos aparecerão aqui
        </p>
        <Button variant="outline" className="mt-4" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Button>
      </div>
    </div>
  );
}

function AvisoExclusaoCard() {
  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <p className="text-sm text-orange-800 dark:text-orange-200">
          Documentos na lixeira serão deletados permanentemente após 30 dias.
        </p>
      </CardContent>
    </Card>
  );
}

function DocumentoCard({
  documento,
  actionLoading,
  onRestaurar,
  onExcluir,
}: {
  documento: DocumentoComUsuario;
  actionLoading: number | null;
  onRestaurar: (doc: DocumentoComUsuario) => void;
  onExcluir: (doc: DocumentoComUsuario) => void;
}) {
  const isLoading = actionLoading === documento.id;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">
                {documento.titulo || 'Documento sem título'}
              </CardTitle>
              <CardDescription>
                Excluído {formatDeletedAt(documento.deleted_at)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestaurar(documento)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Restaurar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onExcluir(documento)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
      {documento.descricao && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {documento.descricao}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  documento,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: DocumentoComUsuario | null;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O documento{' '}
            <strong>&quot;{documento?.titulo || 'Sem título'}&quot;</strong>{' '}
            será excluído permanentemente e não poderá ser recuperado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function LixeiraClient() {
  const router = useRouter();
  
  // Estado
  const [documentos, setDocumentos] = React.useState<DocumentoComUsuario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [periodo, setPeriodo] = React.useState<PeriodoFiltro>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentoParaDeletar, setDocumentoParaDeletar] = React.useState<DocumentoComUsuario | null>(null);

  // Documentos filtrados
  const documentosFiltrados = React.useMemo(
    () => filtrarDocumentosPorPeriodo(documentos, periodo),
    [documentos, periodo]
  );

  // Buscar documentos na lixeira
  const fetchDocumentos = React.useCallback(async () => {
    try {
      const result = await actionListarLixeira();
      if (result.success) {
        setDocumentos(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar lixeira:', error);
      toast.error('Erro ao carregar documentos da lixeira');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  // Restaurar documento
  const handleRestaurar = React.useCallback(async (documento: DocumentoComUsuario) => {
    setActionLoading(documento.id);
    try {
      const result = await actionRestaurarDaLixeira(documento.id);

      if (result.success) {
        toast.success('Documento restaurado com sucesso');
        setDocumentos((prev) => prev.filter((d) => d.id !== documento.id));
      } else {
        toast.error(result.error || 'Erro ao restaurar documento');
      }
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      toast.error('Erro ao restaurar documento');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Abrir diálogo de confirmação para deletar permanentemente
  const handleOpenDeleteDialog = React.useCallback((documento: DocumentoComUsuario) => {
    setDocumentoParaDeletar(documento);
    setDeleteDialogOpen(true);
  }, []);

  // Deletar permanentemente
  const handleDeletarPermanentemente = React.useCallback(async () => {
    if (!documentoParaDeletar) return;

    setActionLoading(documentoParaDeletar.id);
    setDeleteDialogOpen(false);

    try {
      const result = await actionDeletarPermanentemente(documentoParaDeletar.id);

      if (result.success) {
        toast.success('Documento deletado permanentemente');
        setDocumentos((prev) => prev.filter((d) => d.id !== documentoParaDeletar.id));
      } else {
        toast.error(result.error || 'Erro ao deletar documento');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar documento');
    } finally {
      setActionLoading(null);
      setDocumentoParaDeletar(null);
    }
  }, [documentoParaDeletar]);

  return (
    <PageShell
      title="Lixeira"
      description="Documentos excluídos que serão deletados permanentemente após 30 dias"
    >
      {/* Toolbar com filtros */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/app/documentos')}
          aria-label="Voltar para documentos"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <FilterPopover
          label="Período"
          options={PERIODO_OPTIONS}
          value={periodo}
          onValueChange={(val) => setPeriodo(val as PeriodoFiltro)}
          defaultValue="todos"
        />
      </div>

      {/* Conteúdo */}
      {loading ? (
        <LoadingState />
      ) : documentosFiltrados.length === 0 ? (
        <EmptyState onVoltar={() => router.push('/app/documentos')} />
      ) : (
        <div className="space-y-4">
          <AvisoExclusaoCard />
          {documentosFiltrados.map((documento) => (
            <DocumentoCard
              key={documento.id}
              documento={documento}
              actionLoading={actionLoading}
              onRestaurar={handleRestaurar}
              onExcluir={handleOpenDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Dialog de confirmação */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        documento={documentoParaDeletar}
        onConfirm={handleDeletarPermanentemente}
      />
    </PageShell>
  );
}
