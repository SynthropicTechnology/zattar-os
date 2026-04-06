"use client";

import * as React from "react";
import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DataShell,
  DataTable,
  DataTableToolbar,
} from "@/components/shared/data-shell";
import { generateAvatarFallback } from "@/lib/utils";
import { TaskStatusBadge } from "../shared/project-status-badge";
import { PriorityIndicator } from "../shared/priority-indicator";
import type { Tarefa } from "../../lib/domain";

interface TaskListProps {
  tarefas: Tarefa[];
}

const columns: ColumnDef<Tarefa>[] = [
  {
    accessorKey: "titulo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tarefa
        <ArrowUpDown className="size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <TaskStatusBadge status={row.original.status} />,
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
    cell: ({ row }) => {
      const nome = row.original.responsavelNome;
      if (!nome) return "—";
      return (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage
              src={row.original.responsavelAvatar ?? ""}
              alt={nome}
            />
            <AvatarFallback className="text-[10px]">
              {generateAvatarFallback(nome)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{nome}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "dataPrazo",
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
      const d = row.original.dataPrazo;
      return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
    },
  },
];

export function TaskList({ tarefas }: TaskListProps) {
  const [table, setTable] = React.useState<TanstackTable<Tarefa> | null>(null);
  const [density, setDensity] = React.useState<"compact" | "standard" | "relaxed">("standard");
  const filteredCount = table?.getFilteredRowModel().rows.length ?? tarefas.length;

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchPlaceholder="Buscar tarefas..."
          />
        ) : null
      }
      footer={
        <div className="text-muted-foreground text-sm">
          {filteredCount} {filteredCount === 1 ? "tarefa" : "tarefas"}
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={tarefas}
        density={density}
        onTableReady={setTable}
        emptyMessage="Nenhuma tarefa encontrada."
      />
    </DataShell>
  );
}
