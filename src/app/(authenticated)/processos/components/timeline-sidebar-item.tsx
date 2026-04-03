'use client';

import { FileText, Activity, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { cn } from '@/lib/utils';

type TimelineItemWithGrau = TimelineItemEnriquecido & {
  grauOrigem?: GrauProcesso;
};

interface TimelineSidebarItemProps {
  item: TimelineItemWithGrau;
  isSelected: boolean;
  onSelect: (item: TimelineItemWithGrau) => void;
}

function formatarGrauCurto(grau: GrauProcesso): string {
  switch (grau) {
    case 'tribunal_superior':
      return 'TST';
    case 'segundo_grau':
      return '2º';
    case 'primeiro_grau':
      return '1º';
    default:
      return grau;
  }
}

function formatarHora(data: string): string {
  try {
    return format(new Date(data), 'HH:mm', { locale: ptBR });
  } catch {
    return '';
  }
}

export function TimelineSidebarItem({
  item,
  isSelected,
  onSelect,
}: TimelineSidebarItemProps) {
  const isDocumento = item.documento;
  const isClickable = isDocumento;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => isClickable && onSelect(item)}
      className={cn(
        'w-full text-left px-3 py-2 flex items-start gap-2 transition-colors border-l-2',
        isClickable
          ? 'cursor-pointer hover:bg-accent/50'
          : 'cursor-default opacity-60',
        isSelected
          ? 'bg-accent border-l-primary'
          : 'border-l-transparent'
      )}
    >
      {/* Ícone */}
      <div
        className={cn(
          'mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full',
          isDocumento
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
      >
        {isDocumento ? (
          <FileText className="h-3.5 w-3.5" />
        ) : (
          <Activity className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground shrink-0">
            {formatarHora(item.data)}
          </span>
          {item.grauOrigem && (
            <SemanticBadge
              category="grau"
              value={item.grauOrigem}
              className="text-[10px] px-1 py-0 h-4 shrink-0"
            >
              {formatarGrauCurto(item.grauOrigem)}
            </SemanticBadge>
          )}
          {item.documentoSigiloso && (
            <Lock className="h-3 w-3 text-destructive shrink-0" />
          )}
          {isDocumento && !item.backblaze && (
            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
        <p className="text-xs leading-tight truncate">{item.titulo}</p>
      </div>
    </button>
  );
}
