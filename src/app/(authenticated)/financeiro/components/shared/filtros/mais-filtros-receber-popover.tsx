'use client';

/**
 * MaisFiltrosReceberPopover - Popover com filtros avançados para Contas a Receber
 *
 * Agrupa filtros secundários em um dropdown para manter a toolbar limpa.
 * Padrão: 4 filtros primários na toolbar + este popover para filtros avançados.
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
import { FiltroContaContabil } from './filtro-conta-contabil';
import { FiltroCentroCusto } from './filtro-centro-custo';
import type { TipoContaContabil } from '../../../domain/plano-contas';

// =============================================================================
// Tipos
// =============================================================================

interface FilterOption {
  value: string;
  label: string;
}

interface MaisFiltrosReceberPopoverProps {
  // Tipo Recorrente/Avulsa
  tipoRecorrente: string;
  onTipoRecorrenteChange: (value: string) => void;
  tipoRecorrenteOptions: FilterOption[];

  // Origem
  origem: string;
  onOrigemChange: (value: string) => void;
  origemOptions: FilterOption[];

  // Conta Contábil
  contaContabilId: string;
  onContaContabilIdChange: (value: string) => void;
  tiposContaContabil?: TipoContaContabil[];

  // Centro de Custo
  centroCustoId: string;
  onCentroCustoIdChange: (value: string) => void;
}

// =============================================================================
// Componente
// =============================================================================

export function MaisFiltrosReceberPopover({
  tipoRecorrente,
  onTipoRecorrenteChange,
  tipoRecorrenteOptions,
  origem,
  onOrigemChange,
  origemOptions,
  contaContabilId,
  onContaContabilIdChange,
  tiposContaContabil,
  centroCustoId,
  onCentroCustoIdChange,
}: MaisFiltrosReceberPopoverProps) {
  const [open, setOpen] = React.useState(false);

  // Contar filtros ativos
  const activeFiltersCount = [
    tipoRecorrente,
    origem,
    contaContabilId,
    centroCustoId,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  // Limpar todos os filtros
  const handleClearAll = () => {
    onTipoRecorrenteChange('');
    onOrigemChange('');
    onContaContabilIdChange('');
    onCentroCustoIdChange('');
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

          {/* Tipo (Recorrente/Avulsa) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select
              value={tipoRecorrente || 'all'}
              onValueChange={(val) => onTipoRecorrenteChange(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipoRecorrenteOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origem */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Origem</Label>
            <Select
              value={origem || 'all'}
              onValueChange={(val) => onOrigemChange(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {origemOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta Contábil */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Conta Contábil</Label>
            <FiltroContaContabil
              value={contaContabilId}
              onChange={onContaContabilIdChange}
              tiposConta={tiposContaContabil}
              placeholder="Todas as contas"
              className="h-9 w-full"
            />
          </div>

          {/* Centro de Custo */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Centro de Custo</Label>
            <FiltroCentroCusto
              value={centroCustoId}
              onChange={onCentroCustoIdChange}
              placeholder="Todos os centros"
              className="h-9 w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
