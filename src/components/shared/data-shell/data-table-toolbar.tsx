'use client';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { Columns, Download, Plus, Settings2 } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DataShellActionButton } from './data-shell';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePageSearch } from '@/contexts/page-search-context';

export interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  tableId?: string;
  /** Título da página (exibido na linha 1, acima da toolbar) */
  title?: string;
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void | Promise<void>;
  density?: 'compact' | 'standard' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'standard' | 'relaxed') => void;
  actionSlot?: React.ReactNode;
  /** Slot para o seletor de modo de visualização (ViewModePopover) - renderizado antes do botão de export */
  viewModeSlot?: React.ReactNode;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  searchPlaceholder?: string;
  filtersSlot?: React.ReactNode;
  actionButton?: DataShellActionButton;
}

/**
 * DataTableToolbar
 *
 * Toolbar para DataTable com busca, filtros, controle de densidade,
 * visibilidade de colunas e exportação.
 *
 * PADRÃO SINESYS:
 * - Linha 1: Título à esquerda (h1, text-2xl), Botão de ação à direita
 * - Linha 2: SearchBox + Filtros à esquerda, Ações (export, colunas) à direita
 * - NÃO usar descrição/subtítulo - apenas título
 *
 * IMPORTANTE - Altura Padrão Automática:
 * - Todos os elementos (Input, Select, Button, DateRangePicker) dentro desta toolbar
 *   automaticamente recebem altura h-9 (36px) via seletor CSS contextual
 * - Isso é feito pelo atributo data-slot="data-table-toolbar" neste componente
 * - Os componentes ui/button.tsx, ui/select.tsx e ui/date-range-picker.tsx
 *   detectam este data-slot e aplicam h-9 automaticamente
 * - NÃO é necessário adicionar h-9 manualmente nos filtersSlot
 *
 * Acessibilidade:
 * - role="toolbar" com aria-label
 * - aria-controls vinculado à tabela
 * - Todos os botões com aria-label para screen readers
 */
export function DataTableToolbar<TData>({
  table,
  tableId,
  title,
  onExport,
  density = 'standard',
  onDensityChange,
  actionSlot,
  viewModeSlot,
  searchValue: _searchValue,
  onSearchValueChange,
  searchPlaceholder = 'Buscar...',
  filtersSlot,
  actionButton,
}: DataTableToolbarProps<TData>) {
  const handleExport = React.useCallback(
    async (format: 'csv' | 'xlsx' | 'json') => {
      if (onExport) {
        await onExport(format);
        return;
      }

      if (!table) {
        return;
      }

      const data = table.getFilteredRowModel().rows.map((row) => row.original);
      const filename = 'data-export';

      if (format === 'json') {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2)
        )}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `${filename}.json`;
        link.click();
        return;
      }

      if (format === 'csv') {
        const csv = Papa.unparse(data as unknown as object[]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }

      const exceljsModule = await import('exceljs/dist/exceljs.min.js');
      const ExcelJS = (exceljsModule as unknown as { default: typeof import('exceljs') })
        .default;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      const firstRow = (data[0] ?? {}) as Record<string, unknown>;
      const headers = Object.keys(firstRow);
      worksheet.columns = headers.map((header) => ({ header, key: header }));

      for (const row of data as unknown as Record<string, unknown>[]) {
        worksheet.addRow(row);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    [onExport, table]
  );

  // Registra handler de busca no PageSearchContext (search bar do header)
  const pageSearch = usePageSearch()

  React.useEffect(() => {
    const handler = (value: string) => {
      if (onSearchValueChange) {
        onSearchValueChange(value)
        return
      }
      table?.setGlobalFilter(value)
    }

    pageSearch.register(handler, searchPlaceholder)
    return () => pageSearch.unregister()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, onSearchValueChange, searchPlaceholder])

  const visibleColumns = React.useMemo(
    () =>
      table
        ? table
          .getAllColumns()
          .filter(
            (column) =>
              column.id !== 'select' &&
              typeof column.accessorFn !== 'undefined' &&
              column.getCanHide()
          )
        : [],
    [table]
  );

  return (
    <div
      role="toolbar"
      aria-label="Controles da tabela"
      {...(tableId && { 'aria-controls': tableId })}
      data-slot="data-table-toolbar"
    >
      {/* Linha 1: Título à esquerda, Botão de ação à direita */}
      {(title || actionButton) && (
        <div className="flex items-center justify-between py-4">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight font-heading">{title}</h1>
          )}
          {!title && <div />}
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              {actionButton.icon ?? <Plus className="size-3.5" />}
              {actionButton.label}
            </button>
          )}
        </div>
      )}

      {/* Linha 2: Filtros à esquerda, Colunas + Ações à direita */}
      <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:gap-4">
        {/* Lado esquerdo: Filtros (busca agora está no header via PageSearchContext) */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {filtersSlot}
        </div>

        {/* Lado direito: Ações */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Slot para ações adicionais (ex: ChatwootSyncButton) */}
          {actionSlot}

          {/* Slot para seletor de visualização (ViewModePopover) */}
          {viewModeSlot}

          {/* Botão de Exportar */}
          {(table || onExport) && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 bg-card"
                      aria-label="Exportar dados"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Exportar dados</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void handleExport('csv')}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport('xlsx')}>
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport('json')}>
                  JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Botão de Densidade (engrenagem) - apenas se onDensityChange for fornecido */}
          {onDensityChange && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 bg-card"
                      aria-label="Configurações de densidade"
                    >
                      <Settings2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Densidade</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Densidade</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={density}
                  onValueChange={(val) =>
                    onDensityChange(val as 'compact' | 'standard' | 'relaxed')
                  }
                >
                  <DropdownMenuRadioItem value="compact">
                    Compacta
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="standard">
                    Normal
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="relaxed">
                    Relaxada
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Botão de Colunas - apenas ícone */}
          {table && visibleColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-card" aria-label="Visibilidade de colunas">
                  <Columns className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {visibleColumns.map((column) => {
                  const columnId = column.id || (column as { accessorKey?: string }).accessorKey || '';
                  const headerLabel = (column.columnDef.meta as { headerLabel?: string } | undefined)?.headerLabel || columnId;
                  const displayName = headerLabel
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  return (
                    <DropdownMenuCheckboxItem
                      key={columnId}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {displayName}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
