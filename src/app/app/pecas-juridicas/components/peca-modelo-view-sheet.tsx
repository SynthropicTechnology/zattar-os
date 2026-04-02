'use client';

/**
 * Sheet de Visualização de Modelo de Peça
 * Mostra detalhes do modelo em modo somente leitura
 */

import * as React from 'react';
import { FileText, Pencil, Calendar, Tag, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { actionBuscarPecaModelo } from '../actions';
import { TIPO_PECA_LABELS, type PecaModeloListItem } from '../domain';

// =============================================================================
// TYPES
// =============================================================================

interface PecaModeloViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo: PecaModeloListItem | null;
  onEdit?: (modelo: PecaModeloListItem) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PecaModeloViewSheet({
  open,
  onOpenChange,
  modelo,
  onEdit,
}: PecaModeloViewSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [conteudoPreview, setConteudoPreview] = React.useState<string>('');

  // Extrair texto do conteúdo Plate.js
  const extractTextFromContent = React.useCallback((content: unknown[]): string => {
    if (!content) return '';

    const extractText = (node: unknown): string => {
      if (typeof node !== 'object' || node === null) return '';

      const obj = node as Record<string, unknown>;

      if (typeof obj.text === 'string') {
        return obj.text;
      }

      if (Array.isArray(obj.children)) {
        return obj.children.map(extractText).join('');
      }

      return '';
    };

    return content.map((node) => extractText(node)).join('\n\n');
  }, []);

  // Carregar conteúdo completo quando abrir
  React.useEffect(() => {
    if (open && modelo) {
      setLoading(true);
      actionBuscarPecaModelo(modelo.id)
        .then((result) => {
          if (result.success && result.data) {
            const text = extractTextFromContent(result.data.conteudo as unknown[]);
            setConteudoPreview(text);
          }
        })
        .finally(() => setLoading(false));
    } else if (!open) {
      setConteudoPreview('');
    }
  }, [open, modelo, extractTextFromContent]);

  if (!modelo) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visualizar Modelo
          </SheetTitle>
          <SheetDescription>Detalhes do modelo de peça jurídica</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-6 p-6">
            {/* Cabeçalho do Modelo */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{modelo.titulo}</h3>
                  {modelo.descricao && (
                    <p className="text-sm text-muted-foreground">{modelo.descricao}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <AppBadge variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {TIPO_PECA_LABELS[modelo.tipoPeca] || modelo.tipoPeca}
                </AppBadge>
                <AppBadge variant={modelo.visibilidade === 'publico' ? 'default' : 'outline'}>
                  {modelo.visibilidade === 'publico' ? 'Público' : 'Privado'}
                </AppBadge>
                <AppBadge variant="outline">
                  {modelo.usoCount} {modelo.usoCount === 1 ? 'uso' : 'usos'}
                </AppBadge>
              </div>
            </div>

            {/* Metadados */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Criado em{' '}
                {format(new Date(modelo.createdAt), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>

            <Separator />

            {/* Preview do Conteúdo */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Preview do Conteúdo
              </h4>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : conteudoPreview ? (
                <div className="rounded-md border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/80 max-h-80 overflow-auto">
                    {conteudoPreview}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum conteúdo definido
                </p>
              )}
            </div>

            {/* Botão de Edição */}
            {onEdit && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onEdit(modelo)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Modelo
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
