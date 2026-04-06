import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:inline">
        {table.getFilteredSelectedRowModel().rows.length} de{" "}
        {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
      </div>
      <div className="flex items-center space-x-4 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="hidden text-sm font-medium lg:inline">Linhas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}>
            <SelectTrigger className="h-8 w-17.5 bg-card">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-card">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-25 items-center justify-center text-sm font-medium">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon" aria-label="Ir para a primeira página"
            className="hidden size-8 bg-card lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Ir para a primeira página</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon" aria-label="Ir para a página anterior"
            className="size-8 bg-card"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Ir para a página anterior</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon" aria-label="Ir para a próxima página"
            className="size-8 bg-card"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Ir para a próxima página</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon" aria-label="Ir para a última página"
            className="hidden size-8 bg-card lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Ir para a última página</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
