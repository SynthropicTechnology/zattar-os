'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useFocused, useReadOnly, useSelected } from 'platejs/react';
import { IS_APPLE } from 'platejs';

import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ALL_PLACEHOLDERS } from '../placeholders';

// =============================================================================
// TYPES
// =============================================================================

export interface PlaceholderElement {
  type: 'placeholder';
  value: string; // ex: "autor_1.nome"
  children: [{ text: '' }];
  [key: string]: unknown; // Index signature for Plate.js TElement compatibility
}

// =============================================================================
// UTILS
// =============================================================================

function getPlaceholderLabel(value: string): string {
  // Tentar encontrar definição do placeholder
  const baseKey = value.replace(/_\d+\./, '_N.');
  const definition = ALL_PLACEHOLDERS.find((p) => p.key === baseKey);

  if (definition) {
    // Extrair índice se presente
    const match = value.match(/_(\d+)\./);
    const index = match ? match[1] : '';
    return definition.label + (index ? ` ${index}` : '');
  }

  return value;
}

function getPlaceholderDescription(value: string): string {
  const baseKey = value.replace(/_\d+\./, '_N.');
  const definition = ALL_PLACEHOLDERS.find((p) => p.key === baseKey);
  return definition?.description || 'Placeholder personalizado';
}

function getPlaceholderCategory(value: string): string {
  if (value.startsWith('autor_')) return 'autor';
  if (value.startsWith('reu_')) return 'reu';
  if (value.startsWith('meta.')) return 'meta';
  if (value.startsWith('contrato.')) return 'contrato';
  return 'outro';
}

const CATEGORY_COLORS: Record<string, string> = {
  autor: 'bg-info/10 text-info',
  reu: 'bg-destructive/10 text-destructive',
  meta: 'bg-primary text-primary dark:bg-primary dark:text-primary',
  contrato: 'bg-success/10 text-success',
  outro: 'bg-muted text-muted-foreground',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function PlaceholderNodeElement(
  props: PlateElementProps<PlaceholderElement>
) {
  const element = props.element;

  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();

  const category = getPlaceholderCategory(element.value);
  const label = getPlaceholderLabel(element.value);
  const description = getPlaceholderDescription(element.value);
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.outro;

  const content = (
    <PlateElement
      {...props}
      className={cn(
        'inline-block rounded-md px-1.5 py-0.5 align-baseline font-medium text-sm',
        colorClass,
        !readOnly && 'cursor-pointer',
        selected && focused && 'ring-2 ring-ring'
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        'data-placeholder-category': category,
        draggable: true,
      }}
    >
      {mounted && IS_APPLE ? (
        <>
          {props.children}
          {'{{'}
          {label}
          {'}}'}
        </>
      ) : (
        <>
          {'{{'}
          {label}
          {'}}'}
          {props.children}
        </>
      )}
    </PlateElement>
  );

  // Wrap com tooltip se não for readonly
  if (!readOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
              <p className="text-xs font-mono text-muted-foreground">
                {`{{${element.value}}}`}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// =============================================================================
// STATIC VERSION (for rendering without editor context)
// =============================================================================

export function PlaceholderNodeStatic({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const category = getPlaceholderCategory(value);
  const label = getPlaceholderLabel(value);
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.outro;

  return (
    <span
      className={cn(
        'inline-block rounded-md px-1.5 py-0.5 align-baseline font-medium text-sm',
        colorClass,
        className
      )}
    >
      {'{{'}
      {label}
      {'}}'}
    </span>
  );
}
