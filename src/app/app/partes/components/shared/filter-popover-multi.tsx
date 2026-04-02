'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import type { FilterOption } from './filter-popover';

interface FilterPopoverMultiProps {
  label: string;
  placeholder?: string;
  options: readonly FilterOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
}

export function FilterPopoverMulti({
  label,
  placeholder,
  options,
  value,
  onValueChange,
}: FilterPopoverMultiProps) {
  const [open, setOpen] = React.useState(false);
  const isFiltered = value.length > 0;

  const selectedLabels = React.useMemo(() => {
    return options.filter((o) => value.includes(o.value));
  }, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed bg-card">
          <PlusCircle className="h-4 w-4" />
          {label}
          {isFiltered && (
            <>
              {selectedLabels.length <= 2 ? (
                selectedLabels.map((opt) => (
                  <AppBadge key={opt.value} variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">
                    {opt.label}
                  </AppBadge>
                ))
              ) : (
                <AppBadge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">
                  {selectedLabels.length} selecionados
                </AppBadge>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder || label} className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      const next = isSelected
                        ? value.filter((v) => v !== option.value)
                        : [...value, option.value];
                      onValueChange(next);
                    }}
                  >
                    <div className="flex items-center space-x-3 py-1">
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none data-[state=checked]:text-white [&>span]:text-white"
                      />
                      <span className="leading-none">{option.label}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {isFiltered && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onValueChange([]);
                      setOpen(false);
                    }}
                    className="justify-center text-center"
                  >
                    Limpar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
