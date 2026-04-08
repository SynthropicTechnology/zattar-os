"use client"

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { FormFieldType } from '../../types/domain';
import { getFieldIcon } from './SchemaCanvas';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/typography';
import { ENTITY_FIELD_CATEGORIES, type EntityFieldDefinition } from './entity-fields-mapping';

interface FieldDefinition {
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  fieldName: string;
  pessoaTipo?: 'pf' | 'pj' | 'ambos';
}

interface DraggableFieldItemProps {
  field: FieldDefinition;
}

function DraggableFieldItem({ field }: DraggableFieldItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.type}-${field.fieldName}`,
    data: {
      type: field.type,
      label: field.label,
      fieldName: field.fieldName,
      entityField: true
    }
  });

  const Icon = field.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
              "flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-2.5 py-1.5 cursor-grab active:cursor-grabbing transition-colors hover:border-primary/50 hover:bg-accent/50",
              isDragging && "opacity-50 border-primary"
            )}
          >
            <Icon className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs flex-1 min-w-0 wrap-break-word leading-tight">{field.label}</span>
            {field.badge && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">
                {field.badge}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">{field.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function FieldPalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(ENTITY_FIELD_CATEGORIES.map(cat => cat.id))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const convertEntityFields = (entityFields: EntityFieldDefinition[]): FieldDefinition[] => {
    return entityFields.map(field => ({
      type: field.type,
      label: field.label,
      icon: getFieldIcon(field.type),
      description: field.description,
      badge: field.badge,
      fieldName: field.fieldName,
      pessoaTipo: field.pessoaTipo,
    }));
  };

  const filteredCategories = ENTITY_FIELD_CATEGORIES.map(category => ({
    ...category,
    fields: convertEntityFields(
      category.fields.filter(field =>
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  })).filter(category => category.fields.length > 0);

  return (
    <div className="h-full flex flex-col border rounded-lg bg-card overflow-hidden">
      <div className="shrink-0 px-3 pt-3 pb-2 space-y-2 border-b">
        <Heading level="card" className="text-xs uppercase tracking-wider text-muted-foreground">Campos Disponíveis</Heading>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar campos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-3 pt-2 space-y-0.5">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="size-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum campo encontrado</p>
            </div>
          ) : (
            filteredCategories.map(category => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories.has(category.id);

              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full px-1 py-1.5 rounded-md hover:bg-accent/50 transition-colors">
                    <CategoryIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex-1 text-left">{category.label}</span>
                    <ChevronDown
                      className={cn(
                        "size-3 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-0.5 pb-1.5 space-y-0.5">
                    {category.fields.map(field => (
                      <DraggableFieldItem key={`${category.id}-${field.fieldName}`} field={field} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
