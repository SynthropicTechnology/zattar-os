"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectStatusBadge } from "../shared/project-status-badge";
import { ProgressIndicator } from "../shared/progress-indicator";
import type { Projeto } from "../../lib/domain";

interface TableRecentProjectsProps {
  projetos: Projeto[];
}

function ProjectActions({ projetoId }: { projetoId: string }) {
  const router = useRouter();
  return (
    <div className="text-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/app/project-management/projects/${projetoId}`
              )
            }
          >
            Ver Projeto
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/app/project-management/projects/${projetoId}/team`
              )
            }
          >
            Equipe
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const columns: ColumnDef<Projeto>[] = [
  {
    accessorKey: "nome",
    header: "Projeto",
  },
  {
    accessorKey: "clienteNome",
    header: "Cliente",
    cell: ({ row }) => row.original.clienteNome ?? "—",
  },
  {
    accessorKey: "dataInicio",
    header: "Início",
    cell: ({ row }) => {
      const d = row.original.dataInicio;
      if (!d) return "—";
      return new Date(d).toLocaleDateString("pt-BR");
    },
  },
  {
    accessorKey: "dataPrevisaoFim",
    header: "Prazo",
    cell: ({ row }) => {
      const d = row.original.dataPrevisaoFim;
      if (!d) return "—";
      return new Date(d).toLocaleDateString("pt-BR");
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "progresso",
    header: "Progresso",
    cell: ({ row }) => (
      <ProgressIndicator
        value={row.original.progresso}
        className="min-w-[120px]"
      />
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ProjectActions projetoId={row.original.id} />,
  },
];

export function TableRecentProjects({ projetos }: TableRecentProjectsProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: projetos,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    initialState: { pagination: { pageSize: 6 } },
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Projetos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/app/project-management/projects/${row.original.id}`
                      )
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Nenhum projeto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-4">
          <div className="text-muted-foreground flex-1 text-sm">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()} ({projetos.length} projetos)
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
