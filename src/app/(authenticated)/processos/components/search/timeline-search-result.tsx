/**
 * TimelineSearchResult
 *
 * Linha individual de resultado na busca da timeline.
 * Exibe ícone tipado, título com destaque do termo buscado,
 * badge de tipo, contagem de anexos e data formatada.
 */

'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Scale, MessageSquare, Activity, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItemUnificado } from '../timeline/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface TimelineSearchResultProps {
  /** Item de timeline a ser exibido */
  item: TimelineItemUnificado;
  /** Termo buscado para destacar no título */
  query: string;
  /** Indica se este item está selecionado via teclado */
  isSelected: boolean;
  /** Callback ao clicar no resultado */
  onClick: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retorna metadados visuais (ícone + badge) com base no título do item.
 */
function getResultMeta(titulo: string, isDocumento: boolean) {
  const t = titulo.toLowerCase();

  if (t.includes('decisão') || t.includes('decisao') || t.includes('sentença') || t.includes('sentenca') || t.includes('acórdão') || t.includes('acordao') || t.includes('julgamento')) {
    return {
      Icon: Scale,
      badgeLabel: 'Decisão',
      badgeClasses: 'bg-success/5 text-success border-success/10',
    };
  }

  if (t.includes('petição') || t.includes('peticao') || t.includes('contestação') || t.includes('contestacao')) {
    return {
      Icon: FileText,
      badgeLabel: 'Petição',
      badgeClasses: 'bg-info dark:bg-info/30 text-info dark:text-info border-info dark:border-info/50',
    };
  }

  if (t.includes('despacho')) {
    return {
      Icon: MessageSquare,
      badgeLabel: 'Despacho',
      badgeClasses: 'bg-muted text-muted-foreground border-muted',
    };
  }

  if (isDocumento) {
    return {
      Icon: FileText,
      badgeLabel: 'Documento',
      badgeClasses: 'bg-muted text-muted-foreground border-border',
    };
  }

  return {
    Icon: Activity,
    badgeLabel: 'Movimento',
    badgeClasses: 'bg-muted text-muted-foreground border-border',
  };
}

/**
 * Formata data ISO para exibição curta no formato "dd/MM/yy".
 */
function formatarData(data: string): string {
  try {
    return format(new Date(data), 'dd/MM/yy', { locale: ptBR });
  } catch {
    return '';
  }
}

/**
 * Divide o título em partes destacando o trecho que bate com a query.
 * Retorna array de { text, match } para renderização.
 */
function splitComDestaque(titulo: string, query: string) {
  if (!query.trim()) return [{ text: titulo, match: false }];

  const partes: { text: string; match: boolean }[] = [];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(titulo)) !== null) {
    if (match.index > lastIndex) {
      partes.push({ text: titulo.slice(lastIndex, match.index), match: false });
    }
    partes.push({ text: match[0], match: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < titulo.length) {
    partes.push({ text: titulo.slice(lastIndex), match: false });
  }

  return partes;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Linha de resultado de busca da timeline.
 *
 * @example
 * <TimelineSearchResult
 *   item={item}
 *   query="sentença"
 *   isSelected={index === selectedIndex}
 *   onClick={() => handleSelect(item)}
 * />
 */
export function TimelineSearchResult({
  item,
  query,
  isSelected,
  onClick,
}: TimelineSearchResultProps) {
  const meta = getResultMeta(item.titulo, item.documento);
  const { Icon, badgeLabel, badgeClasses } = meta;
  const partesTitulo = splitComDestaque(item.titulo, query);
  const dataFormatada = formatarData(item.data);
  const temAnexo = item.backblaze !== undefined;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-2 rounded cursor-pointer group text-left transition-colors',
        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
      )}
    >
      {/* Lado esquerdo: ícone + textos */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Caixa do ícone */}
        <div
          className="size-8 rounded bg-card border flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Icon className="size-4 text-muted-foreground" />
        </div>

        {/* Textos */}
        <div className="flex flex-col min-w-0 gap-0.5">
          {/* Título com destaque */}
          <p className="text-sm font-medium truncate leading-snug text-foreground">
            {partesTitulo.map((parte, i) =>
              parte.match ? (
                <span key={i} className="font-semibold text-primary">
                  {parte.text}
                </span>
              ) : (
                <span key={i}>{parte.text}</span>
              )
            )}
          </p>

          {/* Linha secundária: badge + anexo */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium border',
                badgeClasses
              )}
            >
              {badgeLabel}
            </span>

            {temAnexo && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground font-mono">
                <Paperclip className="size-2.5" aria-hidden="true" />
                1 anexo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lado direito: data */}
      <span
        className="text-[12px] text-muted-foreground font-mono shrink-0 ml-3"
        aria-label={`Data: ${dataFormatada}`}
      >
        {dataFormatada}
      </span>
    </button>
  );
}
