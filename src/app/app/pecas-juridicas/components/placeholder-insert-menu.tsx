'use client';

import * as React from 'react';
import { User, Building2, FileText, Calendar } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  getAllIndexedPlaceholders,
  groupPlaceholdersByCategory,
  PLACEHOLDER_CATEGORIES,
  type PlaceholderDefinition,
  type PlaceholderCategory,
} from '../placeholders';

// =============================================================================
// TYPES
// =============================================================================

interface PlaceholderInsertMenuProps {
  onSelect: (placeholder: string) => void;
  maxIndex?: number;
  trigger?: React.ReactNode;
}

// =============================================================================
// ICONS
// =============================================================================

const CATEGORY_ICONS: Record<PlaceholderCategory, React.ReactNode> = {
  autor: <User className="h-4 w-4" />,
  reu: <Building2 className="h-4 w-4" />,
  meta: <Calendar className="h-4 w-4" />,
  contrato: <FileText className="h-4 w-4" />,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function PlaceholderInsertMenu({
  onSelect,
  maxIndex = 5,
  trigger,
}: PlaceholderInsertMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Obter todos os placeholders com índices
  const allPlaceholders = React.useMemo(
    () => getAllIndexedPlaceholders(maxIndex),
    [maxIndex]
  );

  // Agrupar por categoria
  const groupedPlaceholders = React.useMemo(
    () => groupPlaceholdersByCategory(allPlaceholders),
    [allPlaceholders]
  );

  // Filtrar por busca
  const filteredGroups = React.useMemo(() => {
    if (!search) return groupedPlaceholders;

    const searchLower = search.toLowerCase();
    const filtered: Record<PlaceholderCategory, PlaceholderDefinition[]> = {
      autor: [],
      reu: [],
      meta: [],
      contrato: [],
    };

    for (const [category, placeholders] of Object.entries(groupedPlaceholders)) {
      filtered[category as PlaceholderCategory] = placeholders.filter(
        (p) =>
          p.label.toLowerCase().includes(searchLower) ||
          p.key.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [groupedPlaceholders, search]);

  const handleSelect = (placeholder: PlaceholderDefinition) => {
    onSelect(`{{${placeholder.key}}}`);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Inserir Placeholder
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-100 p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar placeholder..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum placeholder encontrado.</CommandEmpty>
            <ScrollArea className="h-75">
              {(Object.entries(filteredGroups) as [PlaceholderCategory, PlaceholderDefinition[]][]).map(
                ([category, placeholders], index) => {
                  if (placeholders.length === 0) return null;

                  return (
                    <React.Fragment key={category}>
                      {index > 0 && <CommandSeparator />}
                      <CommandGroup
                        heading={
                          <div className="flex items-center gap-2">
                            {CATEGORY_ICONS[category]}
                            <span>{PLACEHOLDER_CATEGORIES[category]}</span>
                          </div>
                        }
                      >
                        {placeholders.map((placeholder) => (
                          <CommandItem
                            key={placeholder.key}
                            value={placeholder.key}
                            onSelect={() => handleSelect(placeholder)}
                            className="flex flex-col items-start gap-1 py-2"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="font-medium">{placeholder.label}</span>
                              <AppBadge variant="secondary" className="ml-auto text-xs font-mono">
                                {`{{${placeholder.key}}}`}
                              </AppBadge>
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {placeholder.description}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </React.Fragment>
                  );
                }
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// TOOLBAR BUTTON VERSION
// =============================================================================

interface PlaceholderToolbarButtonProps {
  onInsert: (placeholder: string) => void;
  maxIndex?: number;
}

export function PlaceholderToolbarButton({
  onInsert,
  maxIndex = 5,
}: PlaceholderToolbarButtonProps) {
  return (
    <PlaceholderInsertMenu
      onSelect={onInsert}
      maxIndex={maxIndex}
      trigger={
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <FileText className="h-4 w-4 mr-1" />
          Placeholder
        </Button>
      }
    />
  );
}
