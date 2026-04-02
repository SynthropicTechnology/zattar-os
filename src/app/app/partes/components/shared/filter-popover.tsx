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

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterPopoverProps {
  label: string;
  placeholder?: string;
  options: readonly FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Valor que representa "sem filtro". Default: 'all' */
  defaultValue?: string;
}

export function FilterPopover({
  label,
  placeholder,
  options,
  value,
  onValueChange,
  defaultValue = 'all',
}: FilterPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  const isFiltered = value !== defaultValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed bg-card">
          <PlusCircle className="h-4 w-4" />
          {label}
          {isFiltered && selected && (
            <AppBadge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">
              {selected.label}
            </AppBadge>
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
                const isSelected = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(isSelected ? defaultValue : option.value);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3 py-1">
                      <Checkbox checked={isSelected} className="pointer-events-none" />
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
                      onValueChange(defaultValue);
                      setOpen(false);
                    }}
                    className="justify-center text-center"
                  >
                    Limpar filtro
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
