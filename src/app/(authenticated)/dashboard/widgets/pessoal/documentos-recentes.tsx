'use client';

import { FolderOpen, FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { WidgetContainer, ListItem } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import type { DocumentoRecente } from '../../domain';

const TIPO_CONFIG: Record<
  DocumentoRecente['tipo'],
  { icon: typeof FileText; color: string; bgColor: string }
> = {
  doc: { icon: FileText, color: 'text-primary/50', bgColor: 'bg-primary/8 border-primary/15' },
  pdf: { icon: FileImage, color: 'text-destructive/50', bgColor: 'bg-destructive/8 border-destructive/15' },
  planilha: { icon: FileSpreadsheet, color: 'text-success/50', bgColor: 'bg-success/8 border-success/15' },
  outro: { icon: File, color: 'text-muted-foreground/50', bgColor: 'bg-muted/50 border-border/15' },
};

export function WidgetDocumentosRecentes() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  const documentos = data?.documentosRecentes ?? [];

  return (
    <WidgetContainer
      title="Documentos Recentes"
      icon={FolderOpen}
      subtitle="Últimas edições — seus arquivos"
      depth={1}
    >
      {documentos.length > 0 ? (
        <div className="flex flex-col gap-0.5 -mx-1">
          {documentos.slice(0, 5).map((doc) => {
            const config = TIPO_CONFIG[doc.tipo];
            const Icon = config.icon;
            const tempoRelativo = formatDistanceToNow(new Date(doc.atualizadoEm), {
              addSuffix: false,
              locale: ptBR,
            });

            return (
              <ListItem key={doc.id}>
                <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 border ${config.bgColor}`}>
                  <Icon className={`size-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-foreground/75 truncate">{doc.nome}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">editado {tempoRelativo}</p>
                </div>
                <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                  doc.tipo === 'pdf'
                    ? 'text-destructive/50 bg-destructive/6'
                    : doc.tipo === 'planilha'
                      ? 'text-success/50 bg-success/6'
                      : 'text-primary/50 bg-primary/6'
                }`}>
                  {doc.tipo}
                </span>
              </ListItem>
            );
          })}
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-[10px] text-muted-foreground/40">Nenhum documento editado recentemente</p>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">{documentos.length} recentes</span>
        <Link href="/documentos" className="text-[9px] text-primary/50 font-medium hover:text-primary/70 transition-colors cursor-pointer">
          abrir todos
        </Link>
      </div>
    </WidgetContainer>
  );
}
