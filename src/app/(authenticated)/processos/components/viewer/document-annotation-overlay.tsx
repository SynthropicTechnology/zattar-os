'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ViewerAnnotation {
  id: string;
  content: string;
  createdAt: string;
}

interface DocumentAnnotationOverlayProps {
  open: boolean;
  itemTitle?: string;
  itemDate?: string;
  annotations: ViewerAnnotation[];
  onAddAnnotation: (content: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function DocumentAnnotationOverlay({
  open,
  itemTitle,
  itemDate,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
}: DocumentAnnotationOverlayProps) {
  const [draft, setDraft] = useState('');

  const helperText = useMemo(() => {
    if (!itemTitle) return 'Selecione um evento para registrar contexto, próximos passos ou riscos.';

    return itemDate
      ? `Anote leitura, estratégia ou pendências do evento “${itemTitle}” em ${itemDate}.`
      : `Anote leitura, estratégia ou pendências do evento “${itemTitle}”.`;
  }, [itemDate, itemTitle]);

  const formatarCriacao = (value: string) => {
    try {
      return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return value;
    }
  };

  if (!open) {
    return null;
  }

  return (
    <aside className="pointer-events-auto absolute inset-y-3 right-3 z-20 hidden w-72 rounded-2xl border bg-background/96 shadow-lg backdrop-blur lg:flex lg:flex-col">
      <div className="border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <StickyNote className="size-3.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Anotações</p>
            <p className="text-[11px] text-muted-foreground">Painel flutuante da leitura</p>
          </div>
        </div>
      </div>

      <div className="border-b px-3 py-2.5 space-y-2">
        <div className="rounded-xl border bg-muted/25 px-3 py-2">
          <p className="truncate text-xs font-medium text-foreground">
            {itemTitle || 'Nenhum evento selecionado'}
          </p>
          {itemDate && <p className="mt-0.5 text-[11px] text-muted-foreground">{itemDate}</p>}
        </div>

        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Registrar nota..."
            className="min-h-22 resize-none bg-background"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="line-clamp-2 text-[10px] leading-4 text-muted-foreground">{helperText}</p>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 px-3"
              onClick={() => {
                const trimmedDraft = draft.trim();
                if (!trimmedDraft) return;
                onAddAnnotation(trimmedDraft);
                setDraft('');
              }}
              disabled={!draft.trim()}
            >
              <Plus className="size-3.5" />
              Nota
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-2.5">
        <div className="space-y-2 pr-1">
          {annotations.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/25 px-4 py-5 text-center">
              <p className="text-sm font-medium text-foreground">Nenhuma anotação ainda</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                Use este painel sem sair do documento.
              </p>
            </div>
          ) : (
            annotations.map((annotation, index) => (
              <article
                key={annotation.id}
                className={cn(
                  'rounded-xl border px-3 py-2.5 shadow-sm',
                  index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-background'
                )}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Nota {index + 1}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{formatarCriacao(annotation.createdAt)}</p>
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => onDeleteAnnotation(annotation.id)}
                    aria-label="Remover anotação"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <p className="text-sm leading-5 text-foreground">{annotation.content}</p>
              </article>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}