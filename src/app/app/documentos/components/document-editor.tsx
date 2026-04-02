'use client';

/**
 * Componente principal do editor de documentos
 * Integra Plate.js com auto-save, colaboração, e chat
 */

import * as React from 'react';
import { useUser } from '@/providers/user-provider';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Share2,
  MessageSquare,
  MoreVertical,
  FileText,
  Upload,
  Download,
  Loader2,
  History,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

/**
 * PlateEditor skeleton para loading state
 */
function PlateEditorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-8">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-4/5" />
    </div>
  );
}

/**
 * PlateEditor lazy-loaded para otimização de bundle
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
 */
const PlateEditor = dynamic(
  () => import('@/components/editor/plate/plate-editor').then(m => ({ default: m.PlateEditor })),
  {
    ssr: false,
    loading: () => <PlateEditorSkeleton />
  }
);
import { CollaboratorsAvatars } from './collaborators-avatars';
import { UploadDialog } from './upload-dialog';
import { ShareDocumentDialog } from './share-document-dialog';
import { VersionHistoryDialog } from './version-history-dialog';
import { DocumentChat } from './document-chat';
import { useRealtimeCollaboration } from '@/hooks/use-realtime-collaboration';
import { DocumentEditorProvider } from '@/hooks/use-editor-upload';
import { exportToPdf, exportTextToPdf, exportToDocx } from '../utils';
import type { Value } from '../types';
import type { Descendant } from 'platejs';
import { useDocument } from '../hooks/use-document';
import { useDocumentAutoSave } from '../hooks/use-document-auto-save';

interface DocumentEditorProps {
  documentoId: number;
}


export function DocumentEditor({ documentoId }: DocumentEditorProps) {
  const router = useRouter();
  const { documento, loading, saving: manualSaving, saveDocument } = useDocument(documentoId);
  
  const [conteudo, setConteudo] = React.useState<Value>([]);
  const [titulo, setTitulo] = React.useState('');
  const [chatOpen, setChatOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);

  // Sync document loaded data to local state just once
  React.useEffect(() => {
    if (documento && !initialized) {
      setTitulo(documento.titulo);
      setConteudo(documento.conteudo || []);
      setInitialized(true);
    }
  }, [documento, initialized]);

  // Auto-save integration
  const { isSaving: autoSaving } = useDocumentAutoSave(
    initialized ? {
      documento_id: documentoId,
      conteudo,
      titulo,
    } : undefined,
    {
      documentoId,
      debounceTime: 2000
    }
  );

  const saving = manualSaving || autoSaving;

  const userData = useUser();
  const [exporting, setExporting] = React.useState<'pdf' | 'docx' | null>(
    null
  );
  const editorContentRef = React.useRef<HTMLDivElement>(null);

  // Colaboração em tempo real
  const {
    collaborators,
    isConnected,
  } = useRealtimeCollaboration({
    documentoId,
    userId: userData.id || 0,
    userName: userData.nomeCompleto || 'Usuário',
    userEmail: userData.emailCorporativo || '',
  });

  const handleManualSave = async () => {
    if (!documento) return;

    try {
      await saveDocument({
        titulo,
        conteudo,
      });

      toast.success('Documento salvo', { description: 'Todas as alterações foram salvas' });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar documento');
    }
  };

  const handleExportPdf = async () => {
    if (exporting) return;

    setExporting('pdf');
    try {
      // Tentar usar captura visual primeiro
      const editorElement = editorContentRef.current?.querySelector('[data-slate-editor]');
      if (editorElement) {
        await exportToPdf(editorElement as HTMLElement, titulo);
      } else {
        // Fallback para exportação baseada em texto
        await exportTextToPdf(conteudo, titulo);
      }
      toast.success('PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportDocx = async () => {
    if (exporting) return;

    setExporting('docx');
    try {
      await exportToDocx(conteudo, titulo);
      toast.success('DOCX exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar DOCX:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar DOCX');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">Documento não encontrado</h2>
          <p className="text-muted-foreground mt-2">
            O documento que você está procurando não existe ou foi removido.
          </p>
          <Button className="mt-4" onClick={() => router.push('/documentos')}>
            Voltar para documentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header/Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 gap-4">
          {/* Left */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/documentos')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="max-w-md border-0 bg-transparent font-medium shadow-none focus-visible:ring-0"
              placeholder="Título do documento"
            />

            {saving && (
              <Badge variant="secondary" className="text-xs">
                Salvando...
              </Badge>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Indicador de conexão em tempo real */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                      isConnected
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isConnected ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {isConnected
                      ? 'Colaboração em tempo real ativa'
                      : 'Conectando...'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Avatares dos colaboradores */}
            <CollaboratorsAvatars collaborators={collaborators} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleManualSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>

            <Button size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPdf} disabled={exporting !== null}>
                  {exporting === 'pdf' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDocx} disabled={exporting !== null}>
                  {exporting === 'docx' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exportar como DOCX
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                  <History className="mr-2 h-4 w-4" />
                  Histórico de versões
                </DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-auto">
          <div
            ref={editorContentRef}
            className="flex h-full w-full min-h-0 flex-col p-8"
          >
            <DocumentEditorProvider documentoId={documentoId}>
              <PlateEditor
                initialValue={conteudo as Descendant[]}
                onChange={(value) => setConteudo(value as Value)}
              />
            </DocumentEditorProvider>
          </div>
        </div>

        {/* Chat Sidebar (conditional) */}
        {chatOpen && userData.id && (
          <div className="w-80 border-l bg-muted/10">
            <DocumentChat
              documentoId={documentoId}
              currentUserName={userData.nomeCompleto || 'Usuário'}
              currentUserId={userData.id}
            />
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        documentoId={documentoId}
        onSuccess={(url) => {
          toast.success('Arquivo enviado! URL copiada para área de transferência');
          navigator.clipboard.writeText(url);
        }}
      />

      {/* Share Dialog */}
      <ShareDocumentDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        documentoId={documentoId}
        documentoTitulo={titulo}
      />

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        documentoId={documentoId}
        onVersionRestored={() => {
          // Recarregar documento após restaurar versão
          window.location.reload();
        }}
      />
    </div>
  );
}
