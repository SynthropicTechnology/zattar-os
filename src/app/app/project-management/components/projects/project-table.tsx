"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";
import { ArrowUpDown, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DataShell,
  DataTable,
  DataTableToolbar,
} from "@/components/shared/data-shell";
import { ProjectStatusBadge } from "../shared/project-status-badge";
import { ProgressIndicator } from "../shared/progress-indicator";
import { PriorityIndicator } from "../shared/priority-indicator";
import type { Projeto } from "../../lib/domain";

interface ProjectTableProps {
  projetos: Projeto[];
  viewModeSlot?: React.ReactNode;
}

function ProjectRowActions({ projeto }: { projeto: Projeto }) {
  const router = useRouter();
  return (
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
            router.push(`/app/project-management/projects/${projeto.id}`)
          }
        >
          Ver Projeto
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/app/project-management/projects/${projeto.id}/edit`
            )
          }
        >
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/app/project-management/projects/${projeto.id}/team`
            )
          }
        >
          Equipe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<Projeto>[] = [
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Projeto
        <ArrowUpDown className="size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "clienteNome",
    header: "Cliente",
    cell: ({ row }) => row.original.clienteNome ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
    filterFn: (row, _id, value) => value.includes(row.original.status),
  },
  {
    accessorKey: "prioridade",
    header: "Prioridade",
    cell: ({ row }) => (
      <PriorityIndicator prioridade={row.original.prioridade} />
    ),
  },
  {
    accessorKey: "responsavelNome",
    header: "Responsável",
    cell: ({ row }) => row.original.responsavelNome ?? "—",
  },
  {
    accessorKey: "progresso",
    header: "Progresso",
    cell: ({ row }) => (
      <ProgressIndicator
        value={row.original.progresso}
        className="min-w-25"
      />
    ),
  },
  {
    accessorKey: "dataPrevisaoFim",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Prazo
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.dataPrevisaoFim;
      return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
    },
  },
  {
    accessorKey: "orcamento",
    header: "Orçamento",
    cell: ({ row }) => {
      const v = row.original.orcamento;
      if (v == null) return "—";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ProjectRowActions projeto={row.original} />,
  },
];

export function ProjectTable({ projetos, viewModeSlot }: ProjectTableProps) {
  const router = useRouter();
  const [table, setTable] = React.useState<TanstackTable<Projeto> | null>(
    null
  );
  const [density, setDensity] = React.useState<
    "compact" | "standard" | "relaxed"
  >("standard");

  const filteredCount =
    table?.getFilteredRowModel().rows.length ?? projetos.length;

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            title="Projetos"
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchPlaceholder="Buscar projetos..."
            viewModeSlot={viewModeSlot}
            actionButton={{
              label: "Novo Projeto",
              onClick: () =>
                router.push("/app/project-management/projects/new"),
            }}
          />
        ) : null
      }
      footer={
        <div className="text-muted-foreground text-sm">
          {filteredCount} {filteredCount === 1 ? "projeto" : "projetos"}
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={projetos}
        density={density}
        onTableReady={setTable}
        emptyMessage="Nenhum projeto encontrado."
      />
    </DataShell>
  );
}
