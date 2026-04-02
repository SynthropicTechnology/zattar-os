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
import { generateAvatarFallback } from "@/lib/utils";
import {
  DataShell,
  DataTable,
  DataTableToolbar,
} from "@/components/shared/data-shell";
import {
  FilterPopoverMulti,
  type FilterOption,
} from "@/app/app/partes";
import { TaskStatusBadge } from "../components/shared/project-status-badge";
import { PriorityIndicator } from "../components/shared/priority-indicator";
import {
  STATUS_TAREFA_LABELS,
  STATUS_TAREFA_VALUES,
  PRIORIDADE_LABELS,
  PRIORIDADE_VALUES,
  type Tarefa,
  type StatusTarefa,
  type Prioridade,
} from "../lib/domain";

// =============================================================================
// Filter options
// =============================================================================

const STATUS_OPTIONS: FilterOption[] = STATUS_TAREFA_VALUES.map((s) => ({
  value: s,
  label: STATUS_TAREFA_LABELS[s],
}));

const PRIORIDADE_OPTIONS: FilterOption[] = PRIORIDADE_VALUES.map((p) => ({
  value: p,
  label: PRIORIDADE_LABELS[p],
}));

// =============================================================================
// Column definitions
// =============================================================================

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
    accessorKey: "projetoNome",
    header: "Projeto",
    cell: ({ row }) => row.original.projetoNome ?? "—",
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
          <Avatar className="size-6">
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

// =============================================================================
// Component
// =============================================================================

interface GlobalTasksViewProps {
  tarefas: Tarefa[];
}

export function GlobalTasksView({ tarefas }: GlobalTasksViewProps) {
  const [table, setTable] = React.useState<TanstackTable<Tarefa> | null>(null);
  const [density, setDensity] = React.useState<
    "compact" | "standard" | "relaxed"
  >("standard");
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [prioridadeFilter, setPrioridadeFilter] = React.useState<string[]>([]);

  const filteredTarefas = React.useMemo(() => {
    let result = tarefas;
    if (statusFilter.length > 0) {
      result = result.filter((t) =>
        statusFilter.includes(t.status as string)
      );
    }
    if (prioridadeFilter.length > 0) {
      result = result.filter((t) =>
        prioridadeFilter.includes(t.prioridade as string)
      );
    }
    return result;
  }, [tarefas, statusFilter, prioridadeFilter]);

  const filteredCount =
    table?.getFilteredRowModel().rows.length ?? filteredTarefas.length;

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            title="Tarefas"
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchPlaceholder="Buscar tarefas..."
            filtersSlot={
              <>
                <FilterPopoverMulti
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as StatusTarefa[])
                  }
                />
                <FilterPopoverMulti
                  label="Prioridade"
                  options={PRIORIDADE_OPTIONS}
                  value={prioridadeFilter}
                  onValueChange={(v) =>
                    setPrioridadeFilter(v as Prioridade[])
                  }
                />
              </>
            }
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
        data={filteredTarefas}
        density={density}
        onTableReady={setTable}
        emptyMessage="Nenhuma tarefa encontrada."
      />
    </DataShell>
  );
}
