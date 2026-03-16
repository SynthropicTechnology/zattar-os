"use client";

import * as React from "react";
import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DataShell,
  DataTable,
  DataTableToolbar,
} from "@/components/shared/data-shell";
import { ProjectStatusBadge } from "../shared/project-status-badge";
import { ProgressIndicator } from "../shared/progress-indicator";
import { PriorityIndicator } from "../shared/priority-indicator";
import type { Projeto } from "../../lib/domain";

interface ReportsProps {
  projetos: Projeto[];
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
    accessorKey: "dataInicio",
    header: "Início",
    cell: ({ row }) => {
      const d = row.original.dataInicio;
      return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
    },
  },
  {
    accessorKey: "dataPrevisaoFim",
    header: "Prazo",
    cell: ({ row }) => {
      const d = row.original.dataPrevisaoFim;
      return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
    },
  },
  {
    accessorKey: "orcamento",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Orçamento
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = row.original.orcamento;
      if (val == null) return "—";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val);
    },
  },
  {
    accessorKey: "progresso",
    header: "Progresso",
    cell: ({ row }) => (
      <div className="w-full">
        <ProgressIndicator value={row.original.progresso} />
      </div>
    ),
  },
];

export function Reports({ projetos }: ReportsProps) {
  const [table, setTable] = React.useState<TanstackTable<Projeto> | null>(null);
  const [density, setDensity] = React.useState<"compact" | "standard" | "relaxed">("standard");
  const filteredCount = table?.getFilteredRowModel().rows.length ?? projetos.length;

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchPlaceholder="Buscar projetos..."
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
