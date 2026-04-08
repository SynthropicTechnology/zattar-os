'use client';

/**
 * MaisFiltrosPlanoContasPopover - Popover com filtros avançados para Plano de Contas
 *
 * Agrupa filtros secundários em um dropdown para manter a toolbar limpa.
 * Padrão: 3 filtros primários na toolbar + este popover para filtros avançados.
 */

import * as React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { Typography } from '@/components/ui/typography';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FiltroContaContabil } from '../shared/filtros/filtro-conta-contabil';

// =============================================================================
// Tipos
// =============================================================================

interface FilterOption {
  value: string;
  label: string;
}

interface MaisFiltrosPlanoContasPopoverProps {
  // Natureza
  natureza: string;
  onNaturezaChange: (value: string) => void;
  naturezaOptions: FilterOption[];

  // Conta Pai
  contaPaiId: string;
  onContaPaiIdChange: (value: string) => void;
}

// =============================================================================
// Componente
// =============================================================================

export function MaisFiltrosPlanoContasPopover({
  natureza,
  onNaturezaChange,
  naturezaOptions,
  contaPaiId,
  onContaPaiIdChange,
}: MaisFiltrosPlanoContasPopoverProps) {
  const [open, setOpen] = React.useState(false);

  // Contar filtros ativos
  const activeFiltersCount = [natureza, contaPaiId].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  // Limpar todos os filtros
  const handleClearAll = () => {
    onNaturezaChange('');
    onContaPaiIdChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed bg-card">
          <Filter className="h-4 w-4" />
          Mais Filtros
          {hasActiveFilters && (
            <AppBadge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">
              {activeFiltersCount}
            </AppBadge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography.H4>Filtros Avançados</Typography.H4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleClearAll}
              >
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          {/* Natureza */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Natureza</Label>
            <Select
              value={natureza || 'all'}
              onValueChange={(val) => onNaturezaChange(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {naturezaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta Pai */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Conta Pai</Label>
            <FiltroContaContabil
              value={contaPaiId}
              onChange={onContaPaiIdChange}
              placeholder="Todas as contas"
              className="h-9 w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
