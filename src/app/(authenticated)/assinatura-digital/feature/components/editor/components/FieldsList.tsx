'use client';

import { memo } from 'react';
import { Type, Image as ImageIcon, AlignLeft, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { EditorField } from '../types';

interface FieldsListProps {
  fields: EditorField[];
  selectedFieldId: string | null;
  currentPage: number;
  onSelectField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onNavigateToField: (fieldId: string) => void;
}

/**
 * Returns the appropriate icon for a field type
 */
function getFieldIcon(tipo: string) {
  switch (tipo) {
    case 'texto':
      return <Type className="h-4 w-4" />;
    case 'assinatura':
      return <ImageIcon className="h-4 w-4" />;
    case 'texto_composto':
      return <AlignLeft className="h-4 w-4" />;
    default:
      return <Type className="h-4 w-4" />;
  }
}

/**
 * Returns a human-readable label for a field type
 */
function getFieldTypeLabel(tipo: string): string {
  switch (tipo) {
    case 'texto':
      return 'Texto';
    case 'assinatura':
      return 'Assinatura';
    case 'texto_composto':
      return 'Texto Composto';
    default:
      return tipo;
  }
}

/**
 * FieldsListItem - Individual field item in the list
 */
const FieldsListItem = memo(function FieldsListItem({
  field,
  isSelected,
  isOnCurrentPage,
  onSelect,
  onDelete,
  onNavigate,
}: {
  field: EditorField;
  isSelected: boolean;
  isOnCurrentPage: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/50 border border-transparent',
        !isOnCurrentPage && 'opacity-60'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Selecionar campo ${field.nome} - ${getFieldTypeLabel(field.tipo)}, página ${field.posicao.pagina}`}
      aria-pressed={isSelected}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md',
          isSelected ? 'bg-primary/20' : 'bg-muted'
        )}
      >
        {getFieldIcon(field.tipo)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.nome}</p>
        <p className="text-xs text-muted-foreground">
          {getFieldTypeLabel(field.tipo)} • Pág. {field.posicao.pagina}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isOnCurrentPage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            aria-label={`Ir para página ${field.posicao.pagina}`}
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Excluir campo ${field.nome}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

/**
 * FieldsList - Sidebar list of all fields for quick navigation
 * Shows all fields across all pages with filtering and navigation
 */
export default function FieldsList({
  fields,
  selectedFieldId,
  currentPage,
  onSelectField,
  onDeleteField,
  onNavigateToField,
}: FieldsListProps) {
  // Sort fields by page, then by y position
  const sortedFields = [...fields].sort((a, b) => {
    if (a.posicao.pagina !== b.posicao.pagina) {
      return a.posicao.pagina - b.posicao.pagina;
    }
    return a.posicao.y - b.posicao.y;
  });

  // Group fields by page
  const fieldsByPage = sortedFields.reduce(
    (acc, field) => {
      const page = field.posicao.pagina;
      if (!acc[page]) {
        acc[page] = [];
      }
      acc[page].push(field);
      return acc;
    },
    {} as Record<number, EditorField[]>
  );

  const pages = Object.keys(fieldsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  if (fields.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <AlignLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum campo adicionado</p>
        <p className="text-xs mt-1">Clique no canvas para adicionar campos</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {pages.map((page) => (
          <div key={page}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Página {page}
            </h4>
            <div className="space-y-1">
              {fieldsByPage[page].map((field) => (
                <FieldsListItem
                  key={field.id}
                  field={field}
                  isSelected={field.id === selectedFieldId}
                  isOnCurrentPage={field.posicao.pagina === currentPage}
                  onSelect={() => onSelectField(field.id)}
                  onDelete={() => onDeleteField(field.id)}
                  onNavigate={() => onNavigateToField(field.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="pt-3 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {fields.length} campo{fields.length !== 1 ? 's' : ''} no total
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
