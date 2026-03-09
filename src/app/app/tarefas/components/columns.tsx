"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { labels, priorities, statuses } from "../data/data";
import type { TarefaDisplayItem } from "../domain";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<TarefaDisplayItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
    cell: ({ row }) => {
      const date = row.original.date;
      if (!date) return <span className="text-muted-foreground">-</span>;

      const d = new Date(date);
      return (
        <span className="truncate font-medium">
          {d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      );
    },
    meta: {
      headerLabel: "Data",
    },
  },
  {
    accessorKey: "label",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => {
      const label = labels.find((l) => l.value === row.getValue("label"));

      if (!label) {
        return null;
      }

      return (
        <div className="flex items-center gap-2">
          {label.icon && <label.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span>{label.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: {
      headerLabel: "Tipo",
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => {
      const url = row.original.url;

      return (
        <div className="flex items-center gap-2">
          {url ? (
            <a
              href={url}
              className="flex max-w-125 items-center gap-1 truncate font-medium text-foreground hover:text-primary hover:underline"
              title="Abrir no módulo de origem"
            >
              <span className="truncate">{row.getValue("title")}</span>
              <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
            </a>
          ) : (
            <span className="max-w-125 truncate font-medium">{row.getValue("title")}</span>
          )}
          {row.original.prazoVencido && (
            <Badge variant="destructive" className="shrink-0 text-[10px]">
              Vencido
            </Badge>
          )}
        </div>
      );
    },
    meta: {
      headerLabel: "Título",
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = statuses.find((status) => status.value === row.getValue("status"));

      if (!status) {
        return null;
      }

      return (
        <div className="flex w-25 items-center gap-2">
          {status.icon && <status.icon className="text-muted-foreground size-4" />}
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: {
      headerLabel: "Status",
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridade" />,
    cell: ({ row }) => {
      const priority = priorities.find((priority) => priority.value === row.getValue("priority"));

      if (!priority) {
        return null;
      }

      return (
        <div className="flex items-center gap-2">
          {priority.icon && <priority.icon className="text-muted-foreground size-4" />}
          <span>{priority.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: {
      headerLabel: "Prioridade",
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // Eventos virtuais não têm ações de edição (gerenciados no módulo de origem)
      if (row.original.isVirtual) return null;
      return <DataTableRowActions row={row} />;
    }
  }
];
