"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { useRouter } from "next/navigation";
import { DataShell, DataTableToolbar } from "@/components/shared/data-shell";
import { Button } from "@/components/ui/button";
import { X, List, LayoutGrid } from "lucide-react";
import { ViewModePopover } from "@/components/shared";

import { priorities, statuses, labels } from "@/app/(authenticated)/tarefas/data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTablePagination } from "./data-table-pagination";
import { useTarefaStore } from "../store";
import { SYSTEM_BOARD_DEFINITIONS } from "../domain";
import { TarefaDisplayItem } from "../domain";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const {
    setTarefas,
    setSelectedTarefaId,
    setTarefaSheetOpen,
    setCreateDialogOpen,
  } = useTarefaStore();

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Sincronizar dados com o store
  React.useEffect(() => {
    setTarefas(data as TarefaDisplayItem[]);
  }, [data, setTarefas]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters
    },
    initialState: {
      pagination: {
        pageSize: 25
      }
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  const handleRowClick = (id: string) => {
    setSelectedTarefaId(id);
    setTarefaSheetOpen(true);
  };

  return (
    <DataShell
      footer={<DataTablePagination table={table} />}
      header={
        <DataTableToolbar
          table={table}
          title="Tarefas"
          actionButton={{
            label: "Nova tarefa",
            onClick: () => setCreateDialogOpen(true),
          }}
          filtersSlot={
            <>
              {table.getColumn("status") && (
                <DataTableFacetedFilter
                  column={table.getColumn("status")}
                  title="Status"
                  options={statuses}
                />
              )}
              {table.getColumn("priority") && (
                <DataTableFacetedFilter
                  column={table.getColumn("priority")}
                  title="Prioridade"
                  options={priorities}
                />
              )}
              {table.getColumn("label") && (
                <DataTableFacetedFilter
                  column={table.getColumn("label")}
                  title="Tipo"
                  options={labels}
                />
              )}
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-card hover:bg-accent"
                  onClick={() => table.resetColumnFilters()}
                >
                  Limpar
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </>
          }
          viewModeSlot={
            <ViewModePopover
              value="lista"
              onValueChange={(v) => {
                if (v === "quadro") {
                  const firstBoard = SYSTEM_BOARD_DEFINITIONS[0];
                  router.push(`/app/tarefas/quadro/${firstBoard.slug}`);
                }
              }}
              options={[
                { value: 'lista', label: 'Lista', icon: List },
                { value: 'quadro', label: 'Quadro', icon: LayoutGrid },
              ]}
            />
          }
        />
      }
    >
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick((row.original as TarefaDisplayItem).id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DataShell>
  );
}
